from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(unique=True, blank=True)

    class Meta:
        ordering = ('name',)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Document(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='documents')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='XOF')
    # The matching published product in the Chariow store. This stays private:
    # storefront clients never choose a price or a provider product id.
    chariow_product_id = models.CharField(max_length=80, blank=True)
    cover_image = models.ImageField(upload_to='documents/covers/', blank=True)
    encrypted_file = models.FileField(upload_to='documents/protected/', blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-created_at',)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or 'document'
            slug = base_slug
            number = 2
            while type(self).objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{number}'
                number += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class DocumentFile(models.Model):
    """A protected PDF belonging to one catalogue product (a document lot)."""
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='files')
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/protected/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('id',)

    def __str__(self):
        return self.name
