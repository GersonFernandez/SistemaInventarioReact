from django.contrib import admin

from .models import Category, Product, StockReception, Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_name', 'email', 'phone', 'is_active')
    search_fields = ('name', 'rfc', 'email', 'contact_name')
    list_filter = ('is_active',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    search_fields = ('name',)
    list_filter = ('is_active',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'stock', 'price', 'is_active')
    search_fields = ('name', 'sku', 'category')
    list_filter = ('is_active', 'category')


@admin.register(StockReception)
class StockReceptionAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'supplier', 'created_by', 'received_at')
    search_fields = ('product__name', 'product__sku', 'batch', 'created_by__email')
    list_filter = ('received_at',)
