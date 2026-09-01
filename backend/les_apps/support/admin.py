from django.contrib import admin

from .models import SupportConversation, SupportMessage


class SupportMessageInline(admin.TabularInline):
    model = SupportMessage
    extra = 0
    readonly_fields = ('sender', 'content', 'created_at', 'read_at')


@admin.register(SupportConversation)
class SupportConversationAdmin(admin.ModelAdmin):
    list_display = ('customer', 'status', 'updated_at')
    list_filter = ('status',)
    search_fields = ('customer__email', 'customer__username')
    inlines = (SupportMessageInline,)
