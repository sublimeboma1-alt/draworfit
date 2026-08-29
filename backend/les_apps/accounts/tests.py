from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AuthenticationFlowTests(APITestCase):
    def test_a_visitor_can_register_log_in_and_read_their_profile(self):
        registration = {
            'username': 'amina',
            'email': 'amina@example.com',
            'password': 'secure-pass-123',
            'first_name': 'Amina',
            'last_name': 'Diallo',
        }

        response = self.client.post(reverse('accounts:register'), registration, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], registration['email'])
        self.assertNotIn('password', response.data)

        response = self.client.post(
            reverse('accounts:login'),
            {'username': registration['username'], 'password': registration['password']},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        response = self.client.get(reverse('accounts:profile'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], registration['username'])
