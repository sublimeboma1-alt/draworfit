from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, DocumentViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('', DocumentViewSet, basename='document')

urlpatterns = router.urls
