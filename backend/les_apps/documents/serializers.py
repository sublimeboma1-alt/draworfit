from rest_framework import serializers

from .models import Category, Document, DocumentFile


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug')
        read_only_fields = ('id', 'slug')


class DocumentSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    files = serializers.SerializerMethodField()
    category_id = serializers.PrimaryKeyRelatedField(source='category', queryset=Category.objects.all(), write_only=True, required=False, allow_null=True)

    class Meta:
        model = Document
        fields = ('id', 'title', 'slug', 'description', 'category', 'category_id', 'price', 'currency', 'cover_image', 'files', 'is_published', 'created_at', 'updated_at')
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at')

    def get_files(self, instance):
        return [{'id': item.id, 'name': item.name} for item in instance.files.all()]
