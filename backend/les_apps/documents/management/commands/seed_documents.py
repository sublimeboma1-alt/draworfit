from django.core.management.base import BaseCommand
from django.utils.text import slugify

from les_apps.documents.models import Category, Document


PRODUCTS = [
    ('Développement personnel', 'Les bases de la confiance en soi', 'Un guide pratique pour renforcer votre confiance et avancer avec sérénité.', '2500.00'),
    ('Développement personnel', 'Objectifs et discipline au quotidien', 'Méthodes simples pour organiser vos journées et atteindre vos objectifs.', '3000.00'),
    ('Entrepreneuriat', 'Créer son activité pas à pas', 'Les fondations essentielles pour lancer une activité rentable.', '5000.00'),
    ('Entrepreneuriat', 'Vendre efficacement sur Internet', 'Apprenez à présenter vos offres et trouver vos premiers clients.', '4500.00'),
    ('Marketing', 'Marketing digital pour débutants', 'Un cours clair sur les réseaux sociaux, contenus et publicité numérique.', '3500.00'),
    ('Marketing', 'Créer une marque qui attire', 'Identité, message et positionnement pour une marque mémorable.', '4000.00'),
    ('Finance', 'Gérer son argent intelligemment', 'Budget, épargne et bonnes habitudes financières pour le quotidien.', '2500.00'),
    ('Finance', 'Investir avec prudence', 'Comprendre les principes fondamentaux avant de commencer à investir.', '5500.00'),
    ('Études', 'Méthodes pour mieux apprendre', 'Réviser efficacement, mémoriser durablement et réussir ses examens.', '2000.00'),
    ('Technologie', 'Initiation à l’intelligence artificielle', 'Découvrez les concepts et usages pratiques de l’intelligence artificielle.', '6000.00'),
]


class Command(BaseCommand):
    help = 'Crée ou met à jour les 10 documents de démonstration de la boutique.'

    def handle(self, *args, **options):
        for category_name, title, description, price in PRODUCTS:
            category, _ = Category.objects.get_or_create(
                slug=slugify(category_name), defaults={'name': category_name}
            )
            Document.objects.update_or_create(
                slug=slugify(title),
                defaults={
                    'title': title,
                    'description': description,
                    'category': category,
                    'price': price,
                    'currency': 'XOF',
                    'is_published': True,
                },
            )
        self.stdout.write(self.style.SUCCESS('10 documents de démonstration sont disponibles dans la boutique.'))
