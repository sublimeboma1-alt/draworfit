from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from les_apps.documents.serializers import DocumentSerializer
from .models import Device, DocumentLicense


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ('id', 'installation_id', 'name', 'platform', 'created_at', 'last_seen_at')
        read_only_fields = ('id', 'created_at', 'last_seen_at')


class DocumentLicenseSerializer(serializers.ModelSerializer):
    document = serializers.SerializerMethodField()
    device = DeviceSerializer(read_only=True)

    class Meta:
        model = DocumentLicense
        fields = ('id', 'document', 'status', 'activation_code', 'device', 'code_used_at', 'activated_at', 'created_at')

    def get_document(self, instance):
        return DocumentSerializer(instance.order_item.document).data


class ActivateLicenseSerializer(serializers.Serializer):
    activation_code = serializers.CharField(min_length=40, max_length=40, write_only=True)
    installation_id = serializers.CharField(max_length=128)
    name = serializers.CharField(max_length=120)
    platform = serializers.CharField(max_length=40)
    public_key = serializers.CharField(min_length=64, write_only=True)

    @transaction.atomic
    def create(self, validated_data):
        request = self.context['request']
        code = validated_data.pop('activation_code').upper()
        try:
            license_ = DocumentLicense.objects.select_for_update().select_related(
                'order_item__order', 'order_item__document'
            ).get(activation_code=code)
        except DocumentLicense.DoesNotExist:
            raise serializers.ValidationError({'activation_code': 'Code d’activation invalide.'})

        if license_.order_item.order.customer_id != request.user.id:
            raise serializers.ValidationError({'activation_code': 'Ce code n’appartient pas à ce compte.'})
        if license_.status != DocumentLicense.Status.READY:
            raise serializers.ValidationError({'activation_code': 'Ce code a déjà été utilisé ou cette licence est révoquée.'})

        installation_id = validated_data.pop('installation_id')
        device, created = Device.objects.get_or_create(
            installation_id=installation_id,
            defaults={'user': request.user, **validated_data},
        )
        if not created and device.user_id != request.user.id:
            raise serializers.ValidationError({'installation_id': 'Cet appareil est déjà associé à un autre compte.'})
        if not created:
            device.name = validated_data['name']
            device.platform = validated_data['platform']
            device.public_key = validated_data['public_key']
            device.save()

        now = timezone.now()
        license_.device = device
        license_.status = DocumentLicense.Status.ACTIVE
        license_.code_used_at = now
        license_.activated_at = now
        license_.save(update_fields=('device', 'status', 'code_used_at', 'activated_at', 'updated_at'))
        return license_

    def to_representation(self, instance):
        return DocumentLicenseSerializer(instance).data
