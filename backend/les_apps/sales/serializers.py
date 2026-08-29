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
        fields = ('id', 'status', 'currency', 'total_amount', 'items', 'created_at', 'updated_at')


class OrderCreateSerializer(serializers.Serializer):
    document_ids = serializers.PrimaryKeyRelatedField(queryset=Document.objects.filter(is_published=True), many=True, write_only=True)

    def validate_document_ids(self, documents):
        if not documents:
            raise serializers.ValidationError('Sélectionnez au moins un document.')
        if len({document.id for document in documents}) != len(documents):
            raise serializers.ValidationError('Un document ne peut apparaître qu’une fois dans une commande.')
        return documents

    @transaction.atomic
    def create(self, validated_data):
        documents = validated_data['document_ids']
        currencies = {document.currency for document in documents}
        if len(currencies) != 1:
            raise serializers.ValidationError('Les documents doivent avoir la même devise.')
        total = sum((document.price for document in documents), Decimal('0.00'))
        order = Order.objects.create(customer=self.context['request'].user, currency=documents[0].currency, total_amount=total)
        OrderItem.objects.bulk_create([
            OrderItem(order=order, document=document, title=document.title, unit_price=document.price)
            for document in documents
        ])
        return order

    def to_representation(self, instance):
        return OrderSerializer(instance).data
