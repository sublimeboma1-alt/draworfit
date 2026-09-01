"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path, re_path
from django.views.generic import RedirectView

from .views import react_application, service_worker

# Administration branding.
admin.site.site_header = 'Administration Draworfit'
admin.site.site_title = 'Draworfit Admin'
admin.site.index_title = 'Gestion de Draworfit'

urlpatterns = [
    path('sw.js', service_worker, name='service-worker'),
    path('admin', RedirectView.as_view(url='/superadmin/', permanent=False)),
    path('admin/', admin.site.urls),
    path('api/superadmin/', include('les_apps.accounts.superadmin_urls')),
    path('api/auth/', include('les_apps.accounts.urls')),
    path('api/documents/', include('les_apps.documents.urls')),
    path('api/sales/', include('les_apps.sales.urls')),
    path('api/licenses/', include('les_apps.licenses.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.FRONTEND_BUILD_DIR)

# Keep this last: React receives its own routes, while Django keeps API/admin routes.
urlpatterns += [
    re_path(r'^(?P<path>.*)$', react_application, name='react-application'),
]
