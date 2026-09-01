from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('documents', '0001_initial')]

    operations = [
        migrations.CreateModel(
            name='DocumentFile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('file', models.FileField(upload_to='documents/protected/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('document', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='files', to='documents.document')),
            ],
            options={'ordering': ('id',)},
        ),
    ]
