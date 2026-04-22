import bleach
from django.db import transaction
from django.db.models import F
from rest_framework import serializers

from accounts.api_keys import get_api_key_from_request, is_valid_api_key
from accounts.models import User

from .models import Order, Product, StockReception, Supplier


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


class OrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    card_number = serializers.CharField(write_only=True)
    card_holder = serializers.CharField(write_only=True)
    expiry = serializers.CharField(write_only=True)
    cvv = serializers.CharField(write_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'product', 'product_name', 'full_name', 'phone',
            'street', 'city', 'state', 'zip_code', 'references',
            'payment_method', 'card_number', 'card_holder', 'expiry', 'cvv',
            'card_last4', 'total_amount', 'status', 'created_at'
        )
        read_only_fields = (
            'id', 'order_number', 'payment_method', 'card_last4', 'total_amount',
            'status', 'created_at'
        )

    def validate_full_name(self, value):
        return sanitize_text(value)

    def validate_street(self, value):
        return sanitize_text(value)

    def validate_city(self, value):
        return sanitize_text(value)

    def validate_state(self, value):
        return sanitize_text(value)

    def validate_references(self, value):
        return sanitize_text(value)

    def validate(self, attrs):
        card_number = ''.join(ch for ch in attrs.get('card_number', '') if ch.isdigit())
        if len(card_number) < 13 or len(card_number) > 19:
            raise serializers.ValidationError({'card_number': 'Número de tarjeta inválido.'})

        expiry = attrs.get('expiry', '')
        if len(expiry) != 5 or expiry[2] != '/':
            raise serializers.ValidationError({'expiry': 'Formato de vencimiento inválido. Usa MM/AA.'})

        cvv = attrs.get('cvv', '')
        if not cvv.isdigit() or len(cvv) not in (3, 4):
            raise serializers.ValidationError({'cvv': 'CVV inválido.'})

        product = attrs.get('product')
        if not product.is_active:
            raise serializers.ValidationError({'product': 'El producto no está disponible.'})
        if product.stock <= 0:
            raise serializers.ValidationError({'product': 'El producto está agotado.'})

        attrs['card_number'] = card_number
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        card_number = validated_data.pop('card_number')
        validated_data.pop('card_holder', None)
        validated_data.pop('expiry', None)
        validated_data.pop('cvv', None)

        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        product = Product.objects.select_for_update().get(pk=validated_data['product'].pk)
        if not product.is_active:
            raise serializers.ValidationError({'product': 'El producto no está disponible.'})
        if product.stock <= 0:
            raise serializers.ValidationError({'product': 'El producto está agotado.'})

        validated_data['customer'] = user
        validated_data['payment_method'] = 'credit_card'
        validated_data['card_last4'] = card_number[-4:]
        validated_data['total_amount'] = product.price
        validated_data['status'] = Order.Status.PAID
        order = super().create(validated_data)
        Product.objects.filter(pk=product.pk).update(stock=F('stock') - 1)
        return order