import os
from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand
from oauth2_provider.models import Application

from accounts.models import User
from inventory.models import Product, StockReception, Supplier


class Command(BaseCommand):
    help = 'Carga datos iniciales: usuarios, proveedores, productos, recepciones y aplicación OAuth2.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Iniciando seed inicial...'))

        admin_user, _ = User.objects.get_or_create(
            email='admin@empresa.com',
            defaults={
                'name': 'Admin Principal',
                'role': User.Role.ADMIN,
                'scope': User.Scope.INTERNAL,
                'is_staff': True,
                'is_active': True,
            },
        )
        admin_user.set_password('Admin1234!')
        admin_user.save(update_fields=['password'])

        operator_user, _ = User.objects.get_or_create(
            email='operador@empresa.com',
            defaults={
                'name': 'Operador Almacen',
                'role': User.Role.OPERATOR,
                'scope': User.Scope.INTERNAL,
                'is_staff': False,
                'is_active': True,
            },
        )
        operator_user.set_password('Operador1234!')
        operator_user.save(update_fields=['password'])

        public_user, _ = User.objects.get_or_create(
            email='cliente@demo.com',
            defaults={
                'name': 'Cliente Demo',
                'role': User.Role.VIEWER,
                'scope': User.Scope.PUBLIC,
                'is_active': True,
            },
        )
        public_user.set_password('Cliente1234!')
        public_user.save(update_fields=['password'])

        sup1, _ = Supplier.objects.get_or_create(
            name='TechDistrib SA de CV',
            defaults={
                'rfc': 'TDI123456ABC',
                'email': 'ventas@techdistrib.mx',
                'phone': '+525512345678',
                'contact_name': 'Carlos Ruiz',
                'address': 'Av. Insurgentes 123, CDMX',
                'is_active': True,
            },
        )
        sup2, _ = Supplier.objects.get_or_create(
            name='Importadora Global SRL',
            defaults={
                'rfc': 'IGS987654XYZ',
                'email': 'compras@iglobal.com',
                'phone': '+523398765432',
                'contact_name': 'Ana Torres',
                'address': 'Blvd. Puerta de Hierro 45, Guadalajara',
                'is_active': True,
            },
        )

        p1, _ = Product.objects.get_or_create(
            sku='MON-001',
            defaults={
                'name': 'Monitor LG 27" 4K UHD',
                'description': 'Panel IPS, HDR10, 99% sRGB.',
                'price': Decimal('349.99'),
                'stock': 0,
                'category': 'Electronica',
                'supplier': sup1,
                'is_active': True,
            },
        )
        p2, _ = Product.objects.get_or_create(
            sku='TEC-002',
            defaults={
                'name': 'Teclado Mecanico ASUS ROG',
                'description': 'Switches mecanicos y RGB.',
                'price': Decimal('89.99'),
                'stock': 0,
                'category': 'Perifericos',
                'supplier': sup2,
                'is_active': True,
            },
        )
        p3, _ = Product.objects.get_or_create(
            sku='SSD-005',
            defaults={
                'name': 'SSD Samsung 1TB NVMe',
                'description': 'PCIe 4.0, alta velocidad.',
                'price': Decimal('99.00'),
                'stock': 0,
                'category': 'Almacenamiento',
                'supplier': sup1,
                'is_active': True,
            },
        )

        if not StockReception.objects.filter(product=p1).exists():
            StockReception.objects.create(product=p1, supplier=sup1, quantity=15, batch='LOT-SEED-001', notes='Carga inicial', created_by=admin_user)
        if not StockReception.objects.filter(product=p2).exists():
            StockReception.objects.create(product=p2, supplier=sup2, quantity=8, batch='LOT-SEED-002', notes='Carga inicial', created_by=operator_user)
        if not StockReception.objects.filter(product=p3).exists():
            StockReception.objects.create(product=p3, supplier=sup1, quantity=25, batch='LOT-SEED-003', notes='Carga inicial', created_by=admin_user)

        redirect_uri = os.getenv('FRONTEND_OAUTH_REDIRECT_URI', 'http://localhost:5173/portal/oauth/callback')
        oauth_app, created = Application.objects.get_or_create(
            name='Inventario Frontend SPA',
            defaults={
                'user': admin_user,
                'client_type': Application.CLIENT_PUBLIC,
                'authorization_grant_type': Application.GRANT_AUTHORIZATION_CODE,
                'redirect_uris': redirect_uri,
                'skip_authorization': True,
            },
        )
        if not created:
            oauth_app.client_type = Application.CLIENT_PUBLIC
            oauth_app.authorization_grant_type = Application.GRANT_AUTHORIZATION_CODE
            oauth_app.redirect_uris = redirect_uri
            oauth_app.skip_authorization = True
            if oauth_app.user_id is None:
                oauth_app.user = admin_user
            oauth_app.save()

        self.stdout.write(self.style.SUCCESS('Seed completado.'))
        self.stdout.write('Usuarios de prueba:')
        self.stdout.write('  - admin@empresa.com / Admin1234!')
        self.stdout.write('  - operador@empresa.com / Operador1234!')
        self.stdout.write('  - cliente@demo.com / Cliente1234!')
        self.stdout.write('OAuth client configurado:')
        self.stdout.write(f'  - client_id: {oauth_app.client_id}')
        self.stdout.write(f'  - redirect_uri: {redirect_uri}')
