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
