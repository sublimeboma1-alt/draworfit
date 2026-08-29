from django.db.models.signals import post_save
from django.dispatch import receiver

from les_apps.sales.models import Order

from .models import DocumentLicense


@receiver(post_save, sender=Order)
def create_licenses_after_payment(sender, instance, **kwargs):
    """A paid order grants one activation code for each purchased document."""
    if instance.status != Order.Status.PAID:
        return
    for item in instance.items.all():
        DocumentLicense.objects.get_or_create(order_item=item)
