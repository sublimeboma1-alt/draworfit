from django.db import models

from les_apps.documents.models import Document


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'En attente'
        PAID = 'paid', 'Payée'
        CANCELLED = 'cancelled', 'Annulée'

    customer = models.ForeignKey('accounts.User', on_delete=models.PROTECT, related_name='orders')
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    currency = models.CharField(max_length=3, default='XOF')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'Commande #{self.pk} — {self.customer.email}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    document = models.ForeignKey(Document, on_delete=models.PROTECT, related_name='order_items')
    title = models.CharField(max_length=255)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        constraints = [models.UniqueConstraint(fields=('order', 'document'), name='one_document_per_order')]

# Create your models here.
