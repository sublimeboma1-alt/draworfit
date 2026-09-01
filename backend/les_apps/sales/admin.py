from django.contrib import admin

from .models import Order, OrderItem, PaymentWebhookEvent


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('document', 'title', 'unit_price')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'status', 'total_amount', 'currency', 'payment_provider', 'provider_sale_id', 'created_at')
    list_filter = ('status', 'currency')
    search_fields = ('customer__email',)
    inlines = (OrderItemInline,)
    actions = ('confirm_payment',)

    @admin.action(description='Confirm payment for selected orders')
    def confirm_payment(self, request, queryset):
        pending_orders = queryset.filter(status=Order.Status.PENDING)
        updated = pending_orders.update(status=Order.Status.PAID)
        # update() does not emit post_save; create the licences explicitly.
        from les_apps.licenses.models import DocumentLicense
        for item in OrderItem.objects.filter(order__in=pending_orders):
            DocumentLicense.objects.get_or_create(order_item=item)
        self.message_user(request, f'{updated} order(s) confirmed.')


@admin.register(PaymentWebhookEvent)
class PaymentWebhookEventAdmin(admin.ModelAdmin):
    list_display = ('delivery_id', 'event_name', 'order', 'created_at')
    search_fields = ('delivery_id', 'order__id')
    readonly_fields = ('provider', 'delivery_id', 'event_name', 'order', 'payload', 'created_at')

# Register your models here.
