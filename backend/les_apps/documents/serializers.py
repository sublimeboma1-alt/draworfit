from rest_framework import serializers

from .models import Category, Document


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug')
        read_only_fields = ('id', 'slug')


class DocumentSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(source='category', queryset=Category.objects.all(), write_only=True, required=False, allow_null=True)

    class Meta:
        model = Document
        fields = ('id', 'title', 'slug', 'description', 'category', 'category_id', 'price', 'currency', 'cover_image', 'is_published', 'created_at', 'updated_at')
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at')
