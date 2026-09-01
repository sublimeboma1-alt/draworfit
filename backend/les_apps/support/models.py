from django.conf import settings
from django.db import models


class SupportConversation(models.Model):
    class Status(models.TextChoices):
        OPEN = 'open', 'Ouverte'
        CLOSED = 'closed', 'Fermée'

    customer = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_conversation')
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-updated_at',)


class SupportMessage(models.Model):
    conversation = models.ForeignKey(SupportConversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_messages')
    content = models.TextField(max_length=2000)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('created_at',)
