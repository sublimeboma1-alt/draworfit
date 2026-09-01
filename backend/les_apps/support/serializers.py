from rest_framework import serializers

from .models import SupportConversation, SupportMessage


class SupportMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = SupportMessage
        fields = ('id', 'content', 'sender_name', 'is_admin', 'created_at')

    def get_sender_name(self, instance):
        return instance.sender.first_name or instance.sender.username or instance.sender.email

    def get_is_admin(self, instance):
        return instance.sender.is_staff


class SupportConversationSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    messages = SupportMessageSerializer(many=True, read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = SupportConversation
        fields = ('id', 'customer_name', 'customer_email', 'status', 'created_at', 'updated_at', 'unread_count', 'messages')

    def get_customer_name(self, instance):
        return instance.customer.first_name or instance.customer.username or instance.customer.email

    def get_unread_count(self, instance):
        user = self.context['request'].user
        return instance.messages.exclude(sender=user).filter(read_at__isnull=True).count()


class SupportMessageCreateSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=2000, trim_whitespace=True)
