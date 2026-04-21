import json

from oauth2_provider.models import Application
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


class AuthApiTests(APITestCase):
	def setUp(self):
		self.admin_user = User.objects.create_user(
			email='admin-test@example.com',
			password='AdminPass123!',
			name='Admin Test',
			role=User.Role.ADMIN,
			scope=User.Scope.INTERNAL,
			is_staff=True,
		)
		self.viewer_user = User.objects.create_user(
			email='viewer-test@example.com',
			password='ViewerPass123!',
			name='Viewer Test',
			role=User.Role.VIEWER,
			scope=User.Scope.INTERNAL,
			is_staff=False,
		)

	def test_register_public_user(self):
		payload = {
			'email': 'public-test@example.com',
			'name': 'Public User',
			'password': 'PublicPass123!',
		}
		response = self.client.post('/api/v1/auth/register', payload, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		created = User.objects.get(email='public-test@example.com')
		self.assertEqual(created.scope, User.Scope.PUBLIC)
		self.assertEqual(created.role, User.Role.VIEWER)

	def test_login_returns_jwt(self):
		payload = {'email': self.admin_user.email, 'password': 'AdminPass123!'}
		response = self.client.post('/api/v1/auth/login', payload, format='json')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('access', response.data)
		self.assertIn('refresh', response.data)
		self.assertEqual(response.data['user']['email'], self.admin_user.email)

	def test_admin_can_list_users(self):
		self.client.force_authenticate(user=self.admin_user)
		response = self.client.get('/api/v1/users')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertGreaterEqual(response.data['count'], 2)

	def test_non_admin_cannot_list_users(self):
		self.client.force_authenticate(user=self.viewer_user)
		response = self.client.get('/api/v1/users')
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_logout_blacklists_refresh_token(self):
		login_response = self.client.post(
			'/api/v1/auth/login',
			{'email': self.admin_user.email, 'password': 'AdminPass123!'},
			format='json',
		)
		self.assertEqual(login_response.status_code, status.HTTP_200_OK)

		access = login_response.data['access']
		refresh = login_response.data['refresh']

		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
		logout_response = self.client.post('/api/v1/auth/logout', {'refresh': refresh}, format='json')
		self.assertEqual(logout_response.status_code, status.HTTP_205_RESET_CONTENT)

		refresh_response = self.client.post('/api/v1/auth/refresh', {'refresh': refresh}, format='json')
		self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)


class OAuthToolkitTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			email='oauth-user@example.com',
			password='OauthPass123!',
			name='OAuth User',
			role=User.Role.ADMIN,
			scope=User.Scope.INTERNAL,
			is_staff=True,
		)
		self.app = Application.objects.create(
			name='Password Grant Test App',
			user=self.user,
			client_type=Application.CLIENT_PUBLIC,
			authorization_grant_type=Application.GRANT_PASSWORD,
		)

	def test_oauth_token_password_grant(self):
		payload = {
			'grant_type': 'password',
			'username': self.user.email,
			'password': 'OauthPass123!',
			'client_id': self.app.client_id,
			'scope': 'read write',
		}
		response = self.client.post('/api/v1/oauth/token/', payload)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		body = json.loads(response.content.decode('utf-8'))
		self.assertIn('access_token', body)
		self.assertIn('refresh_token', body)
