from django.contrib import admin

from .models import Category, Document


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'price', 'currency', 'is_published', 'created_at')
    list_filter = ('is_published', 'category', 'currency')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}

# Register your models here.
