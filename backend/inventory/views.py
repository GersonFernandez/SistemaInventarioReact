from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .filters import ProductFilter
from .models import Category, Order, Product, StockReception, Supplier
from .permissions import CategoryAccessPermission, ProductAccessPermission, ReceptionAccessPermission, SupplierAccessPermission
from .serializers import CategorySerializer, OrderSerializer, ProductImageSerializer, ProductSerializer, StockReceptionSerializer, SupplierSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('supplier').all()
    serializer_class = ProductSerializer
    permission_classes = [ProductAccessPermission]
    search_fields = ('name', 'sku', 'description', 'category')
    filterset_class = ProductFilter
    ordering_fields = ('name', 'price', 'created_at', 'stock')
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    throttle_classes = [ScopedRateThrottle]

    def get_throttles(self):
        self.throttle_scope = 'catalog' if self.request.method == 'GET' else 'inventory_write'
        return super().get_throttles()

    @action(detail=True, methods=['post'], url_path='image', serializer_class=ProductImageSerializer)
    def image(self, request, pk=None):
        product = self.get_object()
        serializer = self.get_serializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProductSerializer(product, context={'request': request}).data, status=status.HTTP_200_OK)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [SupplierAccessPermission]
    search_fields = ('name', 'rfc', 'email', 'contact_name')
    filterset_fields = ('is_active',)
    ordering_fields = ('name', 'created_at')
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'inventory_write'


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [CategoryAccessPermission]
    search_fields = ('name',)
    filterset_fields = ('is_active',)
    ordering_fields = ('name', 'created_at')
    throttle_classes = [ScopedRateThrottle]

    def get_throttles(self):
        self.throttle_scope = 'catalog' if self.request.method == 'GET' else 'inventory_write'
        return super().get_throttles()

    def perform_update(self, serializer):
        previous_name = serializer.instance.name
        category = serializer.save()
        if previous_name != category.name:
            Product.objects.filter(category=previous_name).update(category=category.name)

    def perform_destroy(self, instance):
        linked_products = Product.objects.filter(category=instance.name).count()
        if linked_products > 0:
            raise ValidationError({'detail': 'No se puede eliminar una categoría con productos asociados.'})
        instance.delete()


class StockReceptionViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = StockReception.objects.select_related('product', 'supplier', 'created_by').all()
    serializer_class = StockReceptionSerializer
    permission_classes = [ReceptionAccessPermission]
    filterset_fields = ('product', 'supplier', 'created_by')
    search_fields = ('product__name', 'product__sku', 'batch', 'notes')
    ordering_fields = ('received_at', 'quantity')
    throttle_classes = [ScopedRateThrottle]

    def get_throttles(self):
        self.throttle_scope = 'inventory_write' if self.request.method != 'GET' else 'catalog'
        return super().get_throttles()


class OrderViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = Order.objects.select_related('product', 'customer').all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'catalog'
