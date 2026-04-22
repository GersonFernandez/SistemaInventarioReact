from django.conf import settings
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models, transaction
from django.db.models import F
from django.utils import timezone
import uuid


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


def generate_order_number():
	stamp = timezone.now().strftime('%Y%m%d')
	suffix = uuid.uuid4().hex[:8].upper()
	return f'ORD-{stamp}-{suffix}'


class Order(TimeStampedModel):
	class Status(models.TextChoices):
		PAID = 'paid', 'Pagada'
		FAILED = 'failed', 'Fallida'

	product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='orders')
	customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
	order_number = models.CharField(max_length=30, unique=True, default=generate_order_number, editable=False)

	full_name = models.CharField(max_length=150)
	phone = models.CharField(max_length=20)
	street = models.CharField(max_length=255)
	city = models.CharField(max_length=100)
	state = models.CharField(max_length=100)
	zip_code = models.CharField(max_length=20)
	references = models.CharField(max_length=255, blank=True)

	payment_method = models.CharField(max_length=30, default='credit_card')
	card_last4 = models.CharField(max_length=4)
	total_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
	status = models.CharField(max_length=20, choices=Status.choices, default=Status.PAID)

	class Meta:
		ordering = ('-created_at',)

	def __str__(self):
		return f'{self.order_number} - {self.product.sku}'
