import secrets

from django.db import models


def generate_activation_code():
    """160-bit code, encoded as exactly 40 hexadecimal characters."""
    return secrets.token_hex(20).upper()


class Device(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='devices')
    installation_id = models.CharField(max_length=128, unique=True)
    name = models.CharField(max_length=120)
    platform = models.CharField(max_length=40)
    public_key = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-last_seen_at',)

    def __str__(self):
        return f'{self.name} ({self.user.email})'


class DocumentLicense(models.Model):
    class Status(models.TextChoices):
        READY = 'ready', 'Prête à activer'
        ACTIVE = 'active', 'Active'
        REVOKED = 'revoked', 'Révoquée'

    order_item = models.OneToOneField('sales.OrderItem', on_delete=models.PROTECT, related_name='license')
    activation_code = models.CharField(max_length=40, unique=True, default=generate_activation_code, editable=False)
    device = models.ForeignKey(Device, on_delete=models.SET_NULL, null=True, blank=True, related_name='licenses')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.READY)
    code_used_at = models.DateTimeField(null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    # La clé AES du fichier y sera chiffrée avec la clé publique de l'appareil.
    wrapped_file_key = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'Licence #{self.pk} — {self.order_item.title}'
