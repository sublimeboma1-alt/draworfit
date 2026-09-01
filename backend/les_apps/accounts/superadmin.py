from pathlib import Path

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from les_apps.documents.models import Category, Document
from les_apps.licenses.models import Device, DocumentLicense
from les_apps.sales.models import Order, OrderItem

User = get_user_model()


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class UserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'university', 'country_of_origin', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'password')
        read_only_fields = ('id', 'date_joined')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class CategoryAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug')
        read_only_fields = ('id',)


class DocumentAdminSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Document
        fields = ('id', 'title', 'slug', 'description', 'category', 'category_name', 'price', 'currency', 'cover_image', 'encrypted_file', 'is_published', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class OrderAdminSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.email', read_only=True)
    items_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'customer', 'customer_name', 'status', 'currency', 'total_amount', 'items_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class OrderItemAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ('id', 'order', 'document', 'title', 'unit_price')
        read_only_fields = ('id',)


class DeviceAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ('id', 'user', 'installation_id', 'name', 'platform', 'public_key', 'created_at', 'last_seen_at')
        read_only_fields = ('id', 'created_at', 'last_seen_at')


class LicenseAdminSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='order_item.document.title', read_only=True)

    class Meta:
        model = DocumentLicense
        fields = ('id', 'order_item', 'document_title', 'activation_code', 'device', 'status', 'code_used_at', 'activated_at', 'wrapped_file_key', 'created_at', 'updated_at')
        read_only_fields = ('id', 'activation_code', 'created_at', 'updated_at')


class SuperAdminViewSet(viewsets.ModelViewSet):
    permission_classes = (IsSuperAdmin,)


class UserViewSet(SuperAdminViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserAdminSerializer
    search_fields = ('username', 'email', 'first_name', 'last_name')


class CategoryViewSet(SuperAdminViewSet):
    queryset = Category.objects.all()
    serializer_class = CategoryAdminSerializer


class DocumentViewSet(SuperAdminViewSet):
    queryset = Document.objects.select_related('category').all()
    serializer_class = DocumentAdminSerializer

    @action(detail=False, methods=('post',), url_path='bulk-upload')
    @transaction.atomic
    def bulk_upload(self, request):
        """Create one catalogue document for every PDF sent by the superadmin."""
        files = request.FILES.getlist('encrypted_files')
        if not files:
            raise serializers.ValidationError({'encrypted_files': 'Ajoutez au moins un fichier PDF.'})
        if any(not file.name.lower().endswith('.pdf') for file in files):
            raise serializers.ValidationError({'encrypted_files': 'Seuls les fichiers PDF sont acceptés.'})
        try:
            category = Category.objects.get(pk=request.data.get('category'))
        except (Category.DoesNotExist, TypeError, ValueError):
            raise serializers.ValidationError({'category': 'Choisissez une catégorie existante.'})
        try:
            price = float(request.data.get('price'))
            if price < 0:
                raise ValueError
        except (TypeError, ValueError):
            raise serializers.ValidationError({'price': 'Indiquez un prix valide.'})

        created = []
        for file in files:
            base_title = Path(file.name).stem[:255] or 'Document'
            title, number = base_title, 2
            while Document.objects.filter(title=title).exists():
                suffix = f' ({number})'
                title = f'{base_title[:255 - len(suffix)]}{suffix}'
                number += 1
            created.append(Document.objects.create(
                title=title, description=request.data.get('description', ''), category=category,
                price=price, currency=(request.data.get('currency') or 'XOF').upper()[:3],
                is_published=str(request.data.get('is_published', '')).lower() in ('true', '1', 'on'),
                encrypted_file=file,
            ))
        return Response(DocumentAdminSerializer(created, many=True, context={'request': request}).data, status=status.HTTP_201_CREATED)


class OrderViewSet(SuperAdminViewSet):
    queryset = Order.objects.select_related('customer').prefetch_related('items').all()
    serializer_class = OrderAdminSerializer


class OrderItemViewSet(SuperAdminViewSet):
    queryset = OrderItem.objects.select_related('order', 'document').all()
    serializer_class = OrderItemAdminSerializer


class DeviceViewSet(SuperAdminViewSet):
    queryset = Device.objects.select_related('user').all()
    serializer_class = DeviceAdminSerializer


class LicenseViewSet(SuperAdminViewSet):
    queryset = DocumentLicense.objects.select_related('order_item__document', 'device').all()
    serializer_class = LicenseAdminSerializer


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = (IsSuperAdmin,)

    def list(self, request):
        return Response({
            'users': User.objects.count(), 'documents': Document.objects.count(),
            'orders': Order.objects.count(), 'pending_orders': Order.objects.filter(status=Order.Status.PENDING).count(),
            'licenses': DocumentLicense.objects.count(), 'devices': Device.objects.count(),
        })
