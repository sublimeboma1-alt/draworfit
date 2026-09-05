from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from rest_framework.routers import DefaultRouter

from .views import SnapOnlyOrderViewSet, chariow_webhook

router = DefaultRouter()
router.register('orders', SnapOnlyOrderViewSet, basename='order')

urlpatterns = [
    # csrf_exempt est appliqué ici ET dans la vue (vue Django pure) pour que
    # Chariow (Pulse) puisse poster sans cookie CSRF, quelle que soit la config.
    path('webhooks/chariow/', csrf_exempt(chariow_webhook), name='chariow-webhook'),
] + router.urls
