from rest_framework.routers import DefaultRouter

from .superadmin import CategoryViewSet, DashboardViewSet, DeviceViewSet, DocumentViewSet, LicenseViewSet, OrderItemViewSet, OrderViewSet, UserViewSet
from les_apps.support.views import AdminSupportConversationViewSet

router = DefaultRouter()
router.register('dashboard', DashboardViewSet, basename='superadmin-dashboard')
router.register('users', UserViewSet, basename='superadmin-users')
router.register('categories', CategoryViewSet, basename='superadmin-categories')
router.register('documents', DocumentViewSet, basename='superadmin-documents')
router.register('orders', OrderViewSet, basename='superadmin-orders')
router.register('order-items', OrderItemViewSet, basename='superadmin-order-items')
router.register('devices', DeviceViewSet, basename='superadmin-devices')
router.register('licenses', LicenseViewSet, basename='superadmin-licenses')
router.register('support/conversations', AdminSupportConversationViewSet, basename='superadmin-support')

urlpatterns = router.urls
