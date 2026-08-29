from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Document


class PublicCatalogTests(APITestCase):
    def test_catalog_lists_only_published_documents_and_their_category(self):
        category = Category.objects.create(name='Informatique')
        published = Document.objects.create(
            title='Python débutant',
            description='Les bases de Python.',
            category=category,
            price=5000,
            is_published=True,
        )
        Document.objects.create(title='Brouillon privé', price=3000, is_published=False)

        response = self.client.get(reverse('document-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        documents = response.data['results'] if isinstance(response.data, dict) else response.data
        self.assertEqual([document['slug'] for document in documents], [published.slug])
        self.assertEqual(documents[0]['category']['name'], category.name)

        response = self.client.get(reverse('document-detail', kwargs={'slug': published.slug}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], published.title)
