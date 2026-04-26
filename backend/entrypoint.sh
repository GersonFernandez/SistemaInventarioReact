#!/bin/sh
set -e

python manage.py migrate --noinput

python manage.py shell <<'PY'
import os
from django.contrib.auth import get_user_model

User = get_user_model()

super_email = os.getenv("DJANGO_SUPERUSER_EMAIL")
super_password = os.getenv("DJANGO_SUPERUSER_PASSWORD")
super_name = os.getenv("DJANGO_SUPERUSER_NAME", "Administrador")

if super_email and super_password:
	superuser = User.objects.filter(email=super_email).first()
	if not superuser:
		User.objects.create_superuser(email=super_email, password=super_password, name=super_name)
		print(f"Superuser '{super_email}' created.")
	else:
		updated = False
		if not superuser.is_staff:
			superuser.is_staff = True
			updated = True
		if not superuser.is_superuser:
			superuser.is_superuser = True
			updated = True
		if updated:
			superuser.save(update_fields=["is_staff", "is_superuser"])
		print(f"Superuser '{super_email}' already exists.")

def ensure_role_user(email, password, name, role, scope="internal", is_staff=False):
	if not email or not password or not name:
		return
	user = User.objects.filter(email=email).first()
	if not user:
		user = User.objects.create_user(
			email=email,
			password=password,
			name=name,
			role=role,
			scope=scope,
			is_staff=is_staff,
			is_active=True,
		)
		print(f"Role user '{email}' ({role}) created.")
		return

	fields_to_update = []
	if user.name != name:
		user.name = name
		fields_to_update.append("name")
	if user.role != role:
		user.role = role
		fields_to_update.append("role")
	if user.scope != scope:
		user.scope = scope
		fields_to_update.append("scope")
	if user.is_staff != is_staff:
		user.is_staff = is_staff
		fields_to_update.append("is_staff")
	if not user.is_active:
		user.is_active = True
		fields_to_update.append("is_active")

	if fields_to_update:
		user.save(update_fields=fields_to_update)
	print(f"Role user '{email}' ({role}) already exists.")

ensure_role_user(
	email=os.getenv("SEED_ADMIN_EMAIL", "admin.rol@empresa.com"),
	password=os.getenv("SEED_ADMIN_PASSWORD", "AdminRol1234!"),
	name=os.getenv("SEED_ADMIN_NAME", "Usuario Admin"),
	role=User.Role.ADMIN,
	scope=User.Scope.INTERNAL,
	is_staff=True,
)

ensure_role_user(
	email=os.getenv("SEED_OPERATOR_EMAIL", "operador.rol@empresa.com"),
	password=os.getenv("SEED_OPERATOR_PASSWORD", "OperadorRol1234!"),
	name=os.getenv("SEED_OPERATOR_NAME", "Usuario Operador"),
	role=User.Role.OPERATOR,
	scope=User.Scope.INTERNAL,
	is_staff=False,
)

ensure_role_user(
	email=os.getenv("SEED_VIEWER_EMAIL", "viewer.rol@empresa.com"),
	password=os.getenv("SEED_VIEWER_PASSWORD", "ViewerRol1234!"),
	name=os.getenv("SEED_VIEWER_NAME", "Usuario Viewer"),
	role=User.Role.VIEWER,
	scope=User.Scope.INTERNAL,
	is_staff=False,
)
PY

if [ "${SEED_PRODUCTS:-false}" = "true" ]; then
  python manage.py seed_products
fi

python manage.py runserver 0.0.0.0:8000
