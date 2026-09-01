from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import SupportConversation, SupportMessage
from .serializers import SupportConversationSerializer, SupportMessageCreateSerializer, SupportMessageSerializer


class CustomerSupportViewSet(viewsets.ViewSet):
    permission_classes = (permissions.IsAuthenticated,)

    def list(self, request):
        conversation = SupportConversation.objects.filter(customer=request.user).prefetch_related('messages__sender').first()
        if not conversation:
            return Response({'conversation': None, 'messages': []})
        conversation.messages.filter(read_at__isnull=True).exclude(sender=request.user).update(read_at=timezone.now())
        return Response({'conversation': SupportConversationSerializer(conversation, context={'request': request}).data, 'messages': SupportMessageSerializer(conversation.messages.all(), many=True).data})

    @action(detail=False, methods=('post',), url_path='messages')
    def send_message(self, request):
        serializer = SupportMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation, _ = SupportConversation.objects.get_or_create(customer=request.user)
        if conversation.status == SupportConversation.Status.CLOSED:
            conversation.status = SupportConversation.Status.OPEN
            conversation.save(update_fields=('status', 'updated_at'))
        message = SupportMessage.objects.create(conversation=conversation, sender=request.user, content=serializer.validated_data['content'])
        return Response(SupportMessageSerializer(message).data, status=status.HTTP_201_CREATED)


class AdminSupportConversationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (permissions.IsAdminUser,)
    serializer_class = SupportConversationSerializer
    queryset = SupportConversation.objects.select_related('customer').prefetch_related('messages__sender').all()

    @action(detail=True, methods=('post',), url_path='reply')
    def reply(self, request, pk=None):
        serializer = SupportMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation = self.get_object()
        message = SupportMessage.objects.create(conversation=conversation, sender=request.user, content=serializer.validated_data['content'])
        if conversation.status == SupportConversation.Status.CLOSED:
            conversation.status = SupportConversation.Status.OPEN
            conversation.save(update_fields=('status', 'updated_at'))
        return Response(SupportMessageSerializer(message).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=('post',), url_path='close')
    def close(self, request, pk=None):
        conversation = self.get_object()
        conversation.status = SupportConversation.Status.CLOSED
        conversation.save(update_fields=('status', 'updated_at'))
        return Response(SupportConversationSerializer(conversation, context={'request': request}).data)
