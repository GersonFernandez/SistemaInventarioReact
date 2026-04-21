from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from inventory.models import Product, Supplier


class InventoryApiTests(APITestCase):
	def setUp(self):
		self.admin = User.objects.create_user(
			email='inv-admin@example.com',
			password='AdminPass123!',
			name='Inv Admin',
			role=User.Role.ADMIN,
			scope=User.Scope.INTERNAL,
			is_staff=True,
		)
		self.operator = User.objects.create_user(
			email='inv-operator@example.com',
			password='OperatorPass123!',
			name='Inv Operator',
			role=User.Role.OPERATOR,
			scope=User.Scope.INTERNAL,
		)
		self.viewer_internal = User.objects.create_user(
			email='inv-viewer@example.com',
			password='ViewerPass123!',
			name='Inv Viewer',
			role=User.Role.VIEWER,
			scope=User.Scope.INTERNAL,
		)
		self.supplier = Supplier.objects.create(name='Supplier Test', email='supplier@test.com')
		self.product = Product.objects.create(
			name='Producto Test',
			sku='TEST-001',
			price='100.00',
			stock=0,
			supplier=self.supplier,
			is_active=True,
		)

	def test_public_can_list_products(self):
		response = self.client.get('/api/v1/products')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertGreaterEqual(response.data['count'], 1)

	def test_viewer_cannot_create_product(self):
		self.client.force_authenticate(user=self.viewer_internal)
		payload = {
			'name': 'No autorizado',
			'sku': 'TEST-002',
			'price': '20.00',
			'stock': 0,
			'supplier': self.supplier.id,
			'is_active': True,
		}
		response = self.client.post('/api/v1/products', payload, format='json')
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_operator_can_create_reception_and_increment_stock(self):
		self.client.force_authenticate(user=self.operator)
		payload = {
			'product': self.product.id,
			'supplier': self.supplier.id,
			'quantity': 12,
			'batch': 'LOT-TEST-001',
			'notes': 'Recepcion de prueba',
		}
		response = self.client.post('/api/v1/receptions', payload, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.product.refresh_from_db()
		self.assertEqual(self.product.stock, 12)

	def test_reception_delete_reverts_stock(self):
		self.client.force_authenticate(user=self.admin)
		create_payload = {
			'product': self.product.id,
			'supplier': self.supplier.id,
			'quantity': 9,
			'batch': 'LOT-TEST-DELETE',
		}
		create_response = self.client.post('/api/v1/receptions', create_payload, format='json')
		self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
		reception_id = create_response.data['id']

		delete_response = self.client.delete(f'/api/v1/receptions/{reception_id}')
		self.assertEqual(delete_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

		self.product.refresh_from_db()
		self.assertEqual(self.product.stock, 9)
