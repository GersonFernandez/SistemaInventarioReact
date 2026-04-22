import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    price = django_filters.NumberFilter(method='filter_price_exact')
    price__gte = django_filters.NumberFilter(field_name='price', method='filter_price_gte')
    price__lte = django_filters.NumberFilter(field_name='price', method='filter_price_lte')

    class Meta:
        model = Product
        fields = {
            'is_active': ['exact'],
            'category': ['exact'],
            'supplier': ['exact'],
            'price': ['exact'],
        }

    def filter_price_exact(self, queryset, name, value):
        if value is None or value <= 0:
            return queryset
        return queryset.filter(price=value)

    def filter_price_gte(self, queryset, name, value):
        if value is None or value <= 0:
            return queryset
        return queryset.filter(price__gte=value)

    def filter_price_lte(self, queryset, name, value):
        if value is None or value <= 0:
            return queryset
        return queryset.filter(price__lte=value)