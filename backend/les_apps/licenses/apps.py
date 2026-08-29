from django.apps import AppConfig


class LicensesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'les_apps.licenses'

    def ready(self):
        from . import signals  # noqa: F401
