import bleach
from rest_framework import serializers

from accounts.api_keys import get_api_key_from_request, is_valid_api_key
from accounts.models import User

from .models import Product, StockReception, Supplier


ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
MAX_IMAGE_SIZE = 5 * 1024 * 1024


def sanitize_text(value):
    return bleach.clean(value or '', strip=True)


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

    def validate_name(self, value):
        return sanitize_text(value)

    def validate_contact_name(self, value):
        return sanitize_text(value)

    def validate_address(self, value):
        return sanitize_text(value)


class ProductSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'sku', 'description', 'price', 'stock', 'category',
            'supplier', 'supplier_name', 'image', 'image_url', 'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

    def validate_name(self, value):
        return sanitize_text(value)

    def validate_description(self, value):
        return sanitize_text(value)

    def validate_category(self, value):
        return sanitize_text(value)

    def validate_image(self, value):
        if not value:
            return value
        if getattr(value, 'size', 0) > MAX_IMAGE_SIZE:
            raise serializers.ValidationError('La imagen excede 5 MB.')
        if getattr(value, 'content_type', '') not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError('Formato de imagen no permitido.')
        return value


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ('image',)

    def validate_image(self, value):
        if getattr(value, 'size', 0) > MAX_IMAGE_SIZE:
            raise serializers.ValidationError('La imagen excede 5 MB.')
        if getattr(value, 'content_type', '') not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError('Solo se aceptan imágenes JPG, PNG o WebP.')
        return value


class StockReceptionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    operator = serializers.CharField(source='created_by.email', read_only=True)

    class Meta:
        model = StockReception
        fields = (
            'id', 'product', 'product_name', 'supplier', 'supplier_name', 'quantity',
            'batch', 'notes', 'received_at', 'created_by', 'operator', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'received_at', 'created_by', 'created_at', 'updated_at')

    def validate_notes(self, value):
        return sanitize_text(value)

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)