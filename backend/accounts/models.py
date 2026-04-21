import hashlib
import secrets
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
	def create_user(self, email, password=None, **extra_fields):
		if not email:
			raise ValueError('El correo electrónico es obligatorio.')
		email = self.normalize_email(email)
		extra_fields.setdefault('is_active', True)
		extra_fields.setdefault('role', User.Role.VIEWER)
		user = self.model(email=email, **extra_fields)
		user.set_password(password)
		user.save(using=self._db)
		return user

	def create_superuser(self, email, password=None, **extra_fields):
		extra_fields.setdefault('is_staff', True)
		extra_fields.setdefault('is_superuser', True)
		extra_fields.setdefault('scope', User.Scope.INTERNAL)
		extra_fields.setdefault('role', User.Role.ADMIN)
		if extra_fields.get('is_staff') is not True:
			raise ValueError('El superusuario debe tener is_staff=True.')
		if extra_fields.get('is_superuser') is not True:
			raise ValueError('El superusuario debe tener is_superuser=True.')
		return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
	class Role(models.TextChoices):
		ADMIN = 'admin', 'Admin'
		OPERATOR = 'operador', 'Operador'
		VIEWER = 'viewer', 'Viewer'

	class Scope(models.TextChoices):
		INTERNAL = 'internal', 'Interno'
		PUBLIC = 'public', 'Público'

	email = models.EmailField(unique=True)
	name = models.CharField(max_length=150)
	role = models.CharField(max_length=20, choices=Role.choices, default=Role.VIEWER)
	scope = models.CharField(max_length=20, choices=Scope.choices, default=Scope.INTERNAL)
	is_active = models.BooleanField(default=True)
	is_staff = models.BooleanField(default=False)
	otp_enabled = models.BooleanField(default=False)
	date_joined = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(auto_now=True)

	USERNAME_FIELD = 'email'
	REQUIRED_FIELDS = ['name']

	objects = UserManager()

	def save(self, *args, **kwargs):
		if self.scope == self.Scope.PUBLIC:
			self.role = self.Role.VIEWER
			self.is_staff = False
		super().save(*args, **kwargs)

	def __str__(self):
		return self.email


class ApiClientKey(models.Model):
	name = models.CharField(max_length=120)
	key_prefix = models.CharField(max_length=12, unique=True, editable=False)
	key_hash = models.CharField(max_length=64, editable=False)
	is_active = models.BooleanField(default=True)
	owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='api_keys')
	created_at = models.DateTimeField(auto_now_add=True)
	last_used_at = models.DateTimeField(null=True, blank=True)

	@staticmethod
	def hash_key(raw_key):
		return hashlib.sha256(raw_key.encode('utf-8')).hexdigest()

	@classmethod
	def generate_raw_key(cls):
		return secrets.token_urlsafe(32)

	@classmethod
	def create_with_key(cls, **kwargs):
		raw_key = cls.generate_raw_key()
		instance = cls.objects.create(
			key_prefix=raw_key[:12],
			key_hash=cls.hash_key(raw_key),
			**kwargs,
		)
		return instance, raw_key

	def touch(self):
		self.last_used_at = timezone.now()
		self.save(update_fields=['last_used_at'])

	def __str__(self):
		return self.name
