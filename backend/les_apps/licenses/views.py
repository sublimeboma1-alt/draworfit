from django.http import FileResponse
from rest_framework import decorators, response, status, viewsets

from .models import DocumentLicense
from .serializers import ActivateLicenseSerializer, DocumentLicenseSerializer


class LicenseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DocumentLicenseSerializer

    def get_queryset(self):
        return DocumentLicense.objects.filter(
            order_item__order__customer=self.request.user
        ).select_related('device', 'order_item__document__category')

    @decorators.action(detail=False, methods=('post',), serializer_class=ActivateLicenseSerializer)
    def activate(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        license_ = serializer.save()
        return response.Response(DocumentLicenseSerializer(license_).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=('post',), url_path='revoke-device')
    def revoke_device(self, request, pk=None):
        license_ = self.get_object()
        if license_.status == DocumentLicense.Status.REVOKED:
            return response.Response({'detail': 'Cette licence est déjà révoquée.'}, status=status.HTTP_400_BAD_REQUEST)
        license_.status = DocumentLicense.Status.REVOKED
        license_.device = None
        license_.save(update_fields=('status', 'device', 'updated_at'))
        return response.Response(DocumentLicenseSerializer(license_).data)

    @decorators.action(detail=True, methods=('get',), url_path='read')
    def read(self, request, pk=None):
        """Stream a purchased document only to the device that activated its licence."""
        license_ = self.get_object()
        installation_id = request.headers.get('X-Draworfit-Installation-ID')
        if license_.status != DocumentLicense.Status.ACTIVE or not license_.device_id:
            return response.Response({'detail': 'Activez d’abord ce document sur cet appareil.'}, status=status.HTTP_403_FORBIDDEN)
        if license_.device.installation_id != installation_id:
            return response.Response({'detail': 'Ce document est lié à un autre appareil.'}, status=status.HTTP_403_FORBIDDEN)

        document_file = license_.order_item.document.encrypted_file
        if not document_file:
            return response.Response({'detail': 'Le fichier de ce document est indisponible.'}, status=status.HTTP_404_NOT_FOUND)

        streamed_file = FileResponse(document_file.open('rb'), content_type='application/pdf')
        streamed_file['Content-Disposition'] = 'inline'
        streamed_file['Cache-Control'] = 'no-store, private'
        streamed_file['X-Content-Type-Options'] = 'nosniff'
        streamed_file['X-Frame-Options'] = 'SAMEORIGIN'
        return streamed_file
