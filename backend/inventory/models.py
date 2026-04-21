from django.conf import settings
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models, transaction
from django.db.models import F


class TimeStampedModel(models.Model):
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		abstract = True


class Supplier(TimeStampedModel):
	name = models.CharField(max_length=150)
	rfc = models.CharField(
		max_length=13,
		blank=True,
		validators=[RegexValidator(r'^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$', 'RFC inválido.')],
	)
	email = models.EmailField(blank=True)
	phone = models.CharField(
		max_length=20,
		blank=True,
		validators=[RegexValidator(r'^[\d\s\-\+\(\)]{7,20}$', 'Teléfono inválido.')],
	)
	address = models.CharField(max_length=255, blank=True)
	contact_name = models.CharField(max_length=120, blank=True)
	is_active = models.BooleanField(default=True)

	class Meta:
		ordering = ('name',)

	def __str__(self):
		return self.name


class Product(TimeStampedModel):
	name = models.CharField(max_length=150)
	sku = models.CharField(max_length=50, unique=True)
	description = models.TextField(blank=True)
	price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
	stock = models.PositiveIntegerField(default=0)
	category = models.CharField(max_length=100, blank=True)
	supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
	image = models.ImageField(upload_to='products/', blank=True, null=True)
	is_active = models.BooleanField(default=True)

	class Meta:
		ordering = ('name',)

	def __str__(self):
		return f'{self.name} ({self.sku})'


class StockReception(TimeStampedModel):
	product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='receptions')
	supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='receptions')
	quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
	batch = models.CharField(max_length=100, blank=True)
	notes = models.TextField(blank=True)
	received_at = models.DateTimeField(auto_now_add=True)
	created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='stock_receptions')

	class Meta:
		ordering = ('-received_at',)

	@transaction.atomic
	def save(self, *args, **kwargs):
		if self.pk:
			previous = StockReception.objects.select_for_update().get(pk=self.pk)
			super().save(*args, **kwargs)
			if previous.product_id != self.product_id:
				Product.objects.filter(pk=previous.product_id).update(stock=F('stock') - previous.quantity)
				Product.objects.filter(pk=self.product_id).update(stock=F('stock') + self.quantity)
			else:
				delta = self.quantity - previous.quantity
				if delta:
					Product.objects.filter(pk=self.product_id).update(stock=F('stock') + delta)
			return

		super().save(*args, **kwargs)
		Product.objects.filter(pk=self.product_id).update(stock=F('stock') + self.quantity)

	@transaction.atomic
	def delete(self, *args, **kwargs):
		Product.objects.filter(pk=self.product_id).update(stock=F('stock') - self.quantity)
		return super().delete(*args, **kwargs)

	def __str__(self):
		return f'{self.product.sku} +{self.quantity}'
