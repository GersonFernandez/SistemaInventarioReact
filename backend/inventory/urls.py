from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import OrderViewSet, ProductViewSet, StockReceptionViewSet, SupplierViewSet

router = DefaultRouter(trailing_slash=False)
router.register('products', ProductViewSet, basename='products')
router.register('suppliers', SupplierViewSet, basename='suppliers')
router.register('receptions', StockReceptionViewSet, basename='receptions')
router.register('orders', OrderViewSet, basename='orders')

urlpatterns = [
    path('', include(router.urls)),
]