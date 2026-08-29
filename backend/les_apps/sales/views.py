from rest_framework import mixins, viewsets

from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer


class OrderViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Orders stay pending until a payment provider, or an admin, confirms them."""

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user).prefetch_related('items__document__category')

    def get_serializer_class(self):
        return OrderCreateSerializer if self.action == 'create' else OrderSerializer
