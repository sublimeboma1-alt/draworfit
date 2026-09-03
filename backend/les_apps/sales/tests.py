from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from les_apps.accounts.models import User
from les_apps.documents.models import Document


class OrderTests(TestCase):
    def test_new_order_stays_pending_until_payment_is_confirmed(self):
        customer = User.objects.create_user(username='buyer', password='safe-password')
        document = Document.objects.create(title='Protected file', price=1000, is_published=True)
        client = APIClient()
        client.force_authenticate(customer)

        response = client.post(reverse('order-list'), {'document_ids': [document.id]}, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['status'], 'pending')

    def test_customer_cannot_purchase_the_same_document_twice(self):
        customer = User.objects.create_user(username='repeat-buyer', password='safe-password')
        document = Document.objects.create(title='One copy only', price=1000, is_published=True)
        client = APIClient()
        client.force_authenticate(customer)

        client.post(reverse('order-list'), {'document_ids': [document.id]}, format='json')
        response = client.post(reverse('order-list'), {'document_ids': [document.id]}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('deja achete', str(response.data))

    @patch('les_apps.sales.views._chariow_checkout')
    def test_checkout_allows_missing_profile_details_until_redirect(self, mock_checkout):
        customer = User.objects.create_user(
            username='guest-buyer',
            password='safe-password',
            email='guest@example.com',
            first_name='',
            last_name='',
            phone_number='',
            country_of_origin='',
        )
        document = Document.objects.create(title='Redirected checkout', price=1000, is_published=True, chariow_product_id='prd_123')
        order = customer.orders.create(status='pending', total_amount=1000)
        order.items.create(document=document, title=document.title, unit_price=document.price)
        client = APIClient()
        client.force_authenticate(customer)

        mock_checkout.return_value = {'data': {'purchase': {'id': 'sale_abc'}, 'step': 'pending', 'payment': {'checkout_url': 'https://example.com/pay'}}}

        response = client.post(reverse('order-checkout', args=[order.id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['step'], 'pending')
        self.assertIn('checkout_url', response.data)

    @patch('les_apps.sales.views._chariow_checkout')
    def test_checkout_returns_chariow_validation_error_to_customer(self, mock_checkout):
        customer = User.objects.create_user(username='validation-buyer', password='safe-password', email='buyer@example.com')
        document = Document.objects.create(title='Configured file', price=1000, is_published=True, chariow_product_id='prd_123')
        order = customer.orders.create(status='pending', total_amount=1000)
        order.items.create(document=document, title=document.title, unit_price=document.price)
        client = APIClient()
        client.force_authenticate(customer)
        from les_apps.sales.views import ChariowError
        mock_checkout.side_effect = ChariowError('Produit Chariow introuvable.', 422)

        response = client.post(reverse('order-checkout', args=[order.id]))

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.data['detail'], 'Produit Chariow introuvable.')
