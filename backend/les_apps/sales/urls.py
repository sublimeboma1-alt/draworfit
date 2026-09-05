from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import SnapOnlyOrderViewSet, chariow_webhook

router = DefaultRouter()
router.register('orders', SnapOnlyOrderViewSet, basename='order')

urlpatterns = [
    path('webhooks/chariow/', chariow_webhook, name='chariow-webhook'),
] + router.urls
