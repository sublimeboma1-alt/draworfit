from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Base user for all platform roles and future purchase relationships."""

    email = models.EmailField('adresse e-mail', unique=True)
    phone_number = models.CharField('numero de telephone', max_length=30, blank=True)
    university = models.CharField('universite', max_length=255, blank=True)
    country_of_origin = models.CharField('pays d origine', max_length=120, blank=True)

    def __str__(self):
        return self.email
