from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from les_apps.documents.models import Document
from les_apps.documents.serializers import DocumentSerializer
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    document = DocumentSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'document', 'title', 'unit_price')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'status', 'currency', 'total_amount', 'payment_provider', 'provider_sale_id', 'items', 'created_at', 'updated_at')


class OrderCreateSerializer(serializers.Serializer):
    document_ids = serializers.PrimaryKeyRelatedField(queryset=Document.objects.filter(is_published=True), many=True, write_only=True)

    def validate_document_ids(self, documents):
        if not documents:
            raise serializers.ValidationError('Sélectionnez au moins un document.')
        if len({document.id for document in documents}) != len(documents):
            raise serializers.ValidationError('Un document ne peut apparaître qu’une fois dans une commande.')
        customer = self.context['request'].user
        already_purchased = OrderItem.objects.filter(
            order__customer=customer,
            document__in=documents,
        ).values_list('document__title', flat=True)
        if already_purchased:
            raise serializers.ValidationError(
                'Vous avez deja achete ce document : ' + ', '.join(already_purchased) + '.'
            )
        return documents

    @transaction.atomic
    def create(self, validated_data):
        documents = validated_data['document_ids']
        customer = self.context['request'].user
        # Serialize one account's purchases to prevent duplicate concurrent orders.
        type(customer).objects.select_for_update().get(pk=customer.pk)
        if OrderItem.objects.filter(order__customer=customer, document__in=documents).exists():
            raise serializers.ValidationError('Vous avez deja achete un des documents selectionnes.')
        currencies = {document.currency for document in documents}
        if len(currencies) != 1:
            raise serializers.ValidationError('Les documents doivent avoir la même devise.')
        total = sum((document.price for document in documents), Decimal('0.00'))
        order = Order.objects.create(customer=customer, currency=documents[0].currency, total_amount=total)
        OrderItem.objects.bulk_create([
            OrderItem(order=order, document=document, title=document.title, unit_price=document.price)
            for document in documents
        ])
        return order

    def to_representation(self, instance):
        return OrderSerializer(instance).data
