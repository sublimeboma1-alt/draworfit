from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('accounts', '0001_initial')]

    operations = [
        migrations.AddField(model_name='user', name='phone_number', field=models.CharField(blank=True, max_length=30, verbose_name='numero de telephone')),
        migrations.AddField(model_name='user', name='university', field=models.CharField(blank=True, max_length=255, verbose_name='universite')),
        migrations.AddField(model_name='user', name='country_of_origin', field=models.CharField(blank=True, max_length=120, verbose_name='pays d origine')),
    ]
