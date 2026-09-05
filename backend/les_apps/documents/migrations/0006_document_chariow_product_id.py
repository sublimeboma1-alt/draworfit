from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [('documents', '0005_replace_chariow_product_with_snap_html')]

    operations = [
        migrations.AddField(
            model_name='document',
            name='chariow_product_id',
            field=models.CharField(blank=True, max_length=80),
        ),
    ]