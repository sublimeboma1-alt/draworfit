from rest_framework.routers import DefaultRouter

from .views import LicenseViewSet

router = DefaultRouter()
router.register('', LicenseViewSet, basename='license')

urlpatterns = router.urls
