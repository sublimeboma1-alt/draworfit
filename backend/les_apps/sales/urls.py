from rest_framework.routers import DefaultRouter

from django.urls import path

from .views import OrderViewSet, chariow_webhook

router = DefaultRouter()
router.register('orders', OrderViewSet, basename='order')

urlpatterns = [path('webhooks/chariow/', chariow_webhook, name='chariow-webhook'), *router.urls]
