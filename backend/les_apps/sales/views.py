import hashlib
import hmac
import json
import os
from urllib import error, request

from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from les_apps.licenses.models import DocumentLicense
from .models import Order, PaymentWebhookEvent
from .serializers import OrderCreateSerializer, OrderSerializer


CHARIOW_CHECKOUT_URL = 'https://api.chariow.com/v1/checkout'

COUNTRY_CODES = {
    'senegal': 'SN', 'sénégal': 'SN', 'cote d ivoire': 'CI', 'côte d ivoire': 'CI', 'cote divoire': 'CI',
    'france': 'FR', 'mali': 'ML', 'guinee': 'GN', 'guinée': 'GN', 'burkina faso': 'BF', 'benin': 'BJ',
    'bénin': 'BJ', 'cameroun': 'CM', 'gabon': 'GA', 'congo': 'CG', 'rdc': 'CD', 'republique democratique du congo': 'CD',
    'niger': 'NE', 'togo': 'TG', 'maroc': 'MA', 'algerie': 'DZ', 'algérie': 'DZ', 'tunisie': 'TN',
}
PHONE_PREFIX_CODES = {'221': 'SN', '225': 'CI', '223': 'ML', '224': 'GN', '226': 'BF', '229': 'BJ', '237': 'CM', '33': 'FR'}


class ChariowError(Exception):
    """An error returned by Chariow that is safe to show to the customer."""

    def __init__(self, message, status_code=status.HTTP_502_BAD_GATEWAY):
        super().__init__(message)
        self.status_code = status_code


def _country_code(user):
    country = ' '.join((user.country_of_origin or '').strip().lower().replace("'", ' ').split())
    if len(country) == 2 and country.isalpha():
        return country.upper()
    if country in COUNTRY_CODES:
        return COUNTRY_CODES[country]
    digits = ''.join(char for char in (user.phone_number or '') if char.isdigit())
    return next((code for prefix, code in PHONE_PREFIX_CODES.items() if digits.startswith(prefix)), '')


def _chariow_checkout(payload):
    api_key = os.environ.get('CHARIOW_API_KEY')
    if not api_key:
        raise RuntimeError('Le paiement Chariow n’est pas encore configuré.')
    outgoing = request.Request(
        CHARIOW_CHECKOUT_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with request.urlopen(outgoing, timeout=20) as result:
            return json.loads(result.read().decode('utf-8'))
    except error.HTTPError as exc:
        body = exc.read().decode('utf-8')
        try:
            response = json.loads(body)
            message = response.get('message') or 'Le paiement ne peut pas être initialisé.'
            field_errors = response.get('errors') or {}
            if isinstance(field_errors, dict):
                details = '; '.join(
                    f'{field}: {", ".join(value) if isinstance(value, list) else value}'
                    for field, value in field_errors.items()
                )
                if details:
                    message = f'{message} ({details})'
        except json.JSONDecodeError:
            message = 'Le paiement ne peut pas être initialisé.'
        raise ChariowError(message, exc.code if 400 <= exc.code < 500 else status.HTTP_502_BAD_GATEWAY) from exc
    except error.URLError as exc:
        raise RuntimeError('Chariow est momentanément inaccessible. Réessayez.') from exc


def _mark_order_paid(order, sale_id):
    """One place for payment completion, including licence generation."""
    with transaction.atomic():
        order = Order.objects.select_for_update().prefetch_related('items').get(pk=order.pk)
        if order.provider_sale_id and order.provider_sale_id != sale_id:
            raise ValueError('La vente Chariow ne correspond pas à cette commande.')
        order.status = Order.Status.PAID
        order.payment_provider = 'chariow'
        order.provider_sale_id = sale_id
        order.save(update_fields=('status', 'payment_provider', 'provider_sale_id', 'updated_at'))
        for item in order.items.all():
            DocumentLicense.objects.get_or_create(order_item=item)
    return order


class OrderViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Orders stay pending until a payment provider, or an admin, confirms them."""

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user).prefetch_related('items__document__category')

    def get_serializer_class(self):
        return OrderCreateSerializer if self.action == 'create' else OrderSerializer

    @action(detail=True, methods=('post',), url_path='checkout')
    def checkout(self, request, pk=None):
        order = self.get_object()
        if order.status == Order.Status.PAID:
            return Response({'detail': 'Cette commande est déjà payée.'}, status=status.HTTP_409_CONFLICT)
        items = list(order.items.select_related('document'))
        if len(items) != 1:
            return Response({'detail': 'Un paiement Chariow doit correspondre à un seul document.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        product_id = items[0].document.chariow_product_id
        if not product_id:
            return Response({'detail': 'Ce document n’est pas encore configuré pour le paiement.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        # Customer details are passed to Chariow only when available; the user can be redirected
        # to complete the payment flow without being blocked by an incomplete profile.
        phone = (request.user.phone_number or '').strip()
        country = _country_code(request.user)
        first_name = (request.user.first_name or '').strip()
        last_name = (request.user.last_name or '').strip()
        redirect_base = os.environ.get('CHARIOW_REDIRECT_URL') or request.build_absolute_uri('/').rstrip('/')
        payload = {
            'product_id': product_id,
            'email': request.user.email,
            'first_name': first_name,
            'last_name': last_name,
            'phone': {'number': ''.join(char for char in phone if char.isdigit()), 'country_code': country},
            'redirect_url': f'{redirect_base}/documents/{items[0].document.slug}?payment=success&order={order.pk}',
            'custom_metadata': {'order_id': str(order.pk), 'order_ref': f'DRAWORFIT-{order.pk}'},
        }
        try:
            result = _chariow_checkout(payload)
        except ChariowError as exc:
            return Response({'detail': str(exc)}, status=exc.status_code)
        except RuntimeError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        data = result.get('data') or {}
        sale_id = (data.get('purchase') or {}).get('id')
        if not sale_id:
            return Response({'detail': 'Réponse Chariow invalide.'}, status=status.HTTP_502_BAD_GATEWAY)
        order.payment_provider = 'chariow'
        order.provider_sale_id = sale_id
        order.save(update_fields=('payment_provider', 'provider_sale_id', 'updated_at'))
        if data.get('step') == 'completed':
            order = _mark_order_paid(order, sale_id)
        return Response({'order': OrderSerializer(order).data, 'step': data.get('step'), 'checkout_url': (data.get('payment') or {}).get('checkout_url')})


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def chariow_webhook(request):
    """Chariow Pulse endpoint. Never trust the redirect URL as payment proof."""
    secret = os.environ.get('CHARIOW_WEBHOOK_SECRET', '')
    signature = request.headers.get('x-chariow-signature', '')
    expected = 'sha256=' + hmac.new(secret.encode('utf-8'), request.body, hashlib.sha256).hexdigest()
    if not secret or not hmac.compare_digest(signature, expected):
        return JsonResponse({'detail': 'Signature Chariow invalide.'}, status=401)
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({'detail': 'JSON invalide.'}, status=400)
    delivery_id = request.headers.get('x-pulse-delivery-id')
    if not delivery_id:
        return JsonResponse({'detail': 'Identifiant de livraison manquant.'}, status=400)
    event_name = request.headers.get('x-pulse-event') or payload.get('event', '')
    metadata = (payload.get('sale') or {}).get('custom_metadata') or {}
    order_id = metadata.get('order_id')
    order = None
    if order_id:
        order = Order.objects.filter(pk=order_id).first()
    try:
        PaymentWebhookEvent.objects.create(delivery_id=delivery_id, event_name=event_name, order=order, payload=payload)
    except IntegrityError:
        return JsonResponse({'received': True, 'duplicate': True})
    if event_name == 'successful.sale' and order:
        sale = payload.get('sale') or {}
        product = payload.get('product') or {}
        item = order.items.select_related('document').first()
        if item and product.get('id') == item.document.chariow_product_id and sale.get('id'):
            try:
                _mark_order_paid(order, sale['id'])
            except ValueError:
                return JsonResponse({'detail': 'Commande incohérente.'}, status=409)
    return JsonResponse({'received': True})
