from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('documents', '0004_document_documents_d_is_publ_21ad2c_idx')]

    operations = [
        migrations.RemoveField(model_name='document', name='chariow_product_id'),
        migrations.AddField(model_name='document', name='chariow_snap_html', field=models.TextField(blank=True)),
    ]
