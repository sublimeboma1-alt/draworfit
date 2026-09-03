from rest_framework.routers import DefaultRouter

from .views import SnapOnlyOrderViewSet

router = DefaultRouter()
router.register('orders', SnapOnlyOrderViewSet, basename='order')

urlpatterns = router.urls
