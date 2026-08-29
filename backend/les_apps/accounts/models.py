from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Base user for all platform roles and future purchase relationships."""

    email = models.EmailField('adresse e-mail', unique=True)

    def __str__(self):
        return self.email
