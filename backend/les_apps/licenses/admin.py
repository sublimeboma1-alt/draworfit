from django.contrib import admin

from .models import Device, DocumentLicense


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('name', 'platform', 'user', 'last_seen_at')
    search_fields = ('name', 'user__email', 'installation_id')


@admin.register(DocumentLicense)
class DocumentLicenseAdmin(admin.ModelAdmin):
    list_display = ('id', 'order_item', 'status', 'device', 'activated_at')
    list_filter = ('status',)
    search_fields = ('activation_code', 'order_item__order__customer__email')
    readonly_fields = ('activation_code', 'code_used_at', 'activated_at', 'created_at', 'updated_at')

# Register your models here.
