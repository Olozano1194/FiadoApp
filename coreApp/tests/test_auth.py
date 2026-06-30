from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient


class AuthLoginTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="testuser", password="securepass123"
        )

    def setUp(self):
        self.client = APIClient()

    def test_login_with_valid_credentials_returns_tokens(self):
        response = self.client.post(
            "/api/token/",
            {"username": "testuser", "password": "securepass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_with_invalid_password_returns_401(self):
        response = self.client.post(
            "/api/token/",
            {"username": "testuser", "password": "wrongpass"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_login_with_invalid_username_returns_401(self):
        response = self.client.post(
            "/api/token/",
            {"username": "nobody", "password": "securepass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)


class AuthTokenRefreshTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="testuser", password="securepass123"
        )

    def setUp(self):
        self.client = APIClient()

    def _get_tokens(self):
        response = self.client.post(
            "/api/token/",
            {"username": "testuser", "password": "securepass123"},
            format="json",
        )
        return response.data

    def test_refresh_with_valid_token_returns_new_access(self):
        tokens = self._get_tokens()
        response = self.client.post(
            "/api/token/refresh/",
            {"refresh": tokens["refresh"]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_refresh_with_invalid_token_returns_401(self):
        response = self.client.post(
            "/api/token/refresh/",
            {"refresh": "invalidtoken123"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)


class AuthChangePasswordTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="testuser", password="oldpass123"
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_change_password_success(self):
        response = self.client.post(
            "/api/change-password/",
            {"old_password": "oldpass123", "new_password": "newpass12345"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        # Verify the new password works
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpass12345"))

    def test_change_password_with_wrong_old_password(self):
        response = self.client.post(
            "/api/change-password/",
            {"old_password": "wrongpass", "new_password": "newpass12345"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("incorrecta", str(response.data).lower())

    def test_change_password_too_short(self):
        response = self.client.post(
            "/api/change-password/",
            {"old_password": "oldpass123", "new_password": "short"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("8", str(response.data))

    def test_change_password_missing_fields(self):
        response = self.client.post(
            "/api/change-password/",
            {"old_password": "oldpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("required", str(response.data).lower())

    def test_change_password_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            "/api/change-password/",
            {"old_password": "oldpass123", "new_password": "newpass12345"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)


class AuthTokenVerifyTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="testuser", password="securepass123"
        )

    def setUp(self):
        self.client = APIClient()

    def _get_access_token(self):
        response = self.client.post(
            "/api/token/",
            {"username": "testuser", "password": "securepass123"},
            format="json",
        )
        return response.data["access"]

    def test_verify_valid_token_returns_200(self):
        token = self._get_access_token()
        response = self.client.post(
            "/api/token/verify/",
            {"token": token},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_verify_invalid_token_returns_401(self):
        response = self.client.post(
            "/api/token/verify/",
            {"token": "invalidtoken"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)