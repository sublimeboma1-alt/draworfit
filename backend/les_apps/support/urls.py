from rest_framework.routers import DefaultRouter

from .views import CustomerSupportViewSet

router = DefaultRouter()
router.register('', CustomerSupportViewSet, basename='support')

urlpatterns = router.urls
