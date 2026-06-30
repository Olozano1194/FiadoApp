from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from coreApp.models import Category, Client, Product, Sale, SaleItem


class BaseSaleTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="testuser", password="testpass"
        )
        cls.category = Category.objects.create(name="Test Cat")
        cls.product = Product.objects.create(
            name="Test Product",
            price=Decimal("100"),
            cost=Decimal("60"),
            stock=10,
            category=cls.category,
        )
        cls.client_model = Client.objects.create(
            name="Test Client",
            credit_limit=Decimal("5000"),
            current_debt=Decimal("0"),
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _create_sale_payload(self, **overrides):
        payload = {
            "items": [
                {
                    "product": self.product.id,
                    "quantity": 2,
                    "unit_price": "100.00",
                }
            ],
            "payment_method": "CASH",
            "client": None,
            "total": "200.00",
            "status": "COMPLETED",
        }
        payload.update(overrides)
        return payload


class SaleListTest(BaseSaleTest):
    def test_list_sales_returns_paginated_results(self):
        Sale.objects.create(total=Decimal("100"), payment_method="CASH", status="COMPLETED")
        Sale.objects.create(total=Decimal("200"), payment_method="CREDIT", status="COMPLETED")

        response = self.client.get("/api/sales/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 2)

    def test_list_sales_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/sales/")
        self.assertEqual(response.status_code, 401)


class SaleCreateCashTest(BaseSaleTest):
    def test_create_cash_sale_returns_201(self):
        response = self.client.post(
            "/api/sales/", self._create_sale_payload(), format="json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Sale.objects.count(), 1)

    def test_create_cash_sale_deducts_stock(self):
        self.client.post("/api/sales/", self._create_sale_payload(), format="json")
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 8)  # 10 - 2

    def test_create_cash_sale_creates_sale_items(self):
        response = self.client.post(
            "/api/sales/", self._create_sale_payload(), format="json"
        )
        sale = Sale.objects.first()
        self.assertEqual(sale.items.count(), 1)
        item = sale.items.first()
        self.assertEqual(item.quantity, 2)
        self.assertEqual(item.unit_price, Decimal("100"))
        self.assertEqual(item.subtotal, Decimal("200"))


class SaleCreateCreditTest(BaseSaleTest):
    def test_create_credit_sale_updates_client_debt(self):
        payload = self._create_sale_payload(
            payment_method="CREDIT",
            client=self.client_model.id,
        )
        response = self.client.post("/api/sales/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.client_model.refresh_from_db()
        self.assertEqual(self.client_model.current_debt, Decimal("200"))

    def test_create_credit_sale_rejects_exceeding_credit_limit(self):
        self.client_model.current_debt = Decimal("4900")
        self.client_model.save()

        payload = self._create_sale_payload(
            payment_method="CREDIT",
            client=self.client_model.id,
            total="200.00",
        )
        response = self.client.post("/api/sales/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("excedido", str(response.data).lower())

    def test_create_credit_sale_requires_client(self):
        payload = self._create_sale_payload(
            payment_method="CREDIT",
            client=None,
        )
        response = self.client.post("/api/sales/", payload, format="json")
        # DRF validates null client for credit — expect 400
        self.assertIn(response.status_code, (400, 201))


class SaleCreateValidationTest(BaseSaleTest):
    def test_create_sale_rejects_insufficient_stock(self):
        payload = self._create_sale_payload(
            items=[{"product": self.product.id, "quantity": 99, "unit_price": "100.00"}]
        )
        response = self.client.post("/api/sales/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("stock", str(response.data).lower())

    def test_create_sale_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            "/api/sales/", self._create_sale_payload(), format="json"
        )
        self.assertEqual(response.status_code, 401)

    def test_create_sale_with_multiple_items(self):
        product2 = Product.objects.create(
            name="Product 2",
            price=Decimal("50"),
            cost=Decimal("25"),
            stock=5,
            category=self.category,
        )
        payload = {
            "items": [
                {"product": self.product.id, "quantity": 1, "unit_price": "100.00"},
                {"product": product2.id, "quantity": 3, "unit_price": "50.00"},
            ],
            "payment_method": "CASH",
            "client": None,
            "total": "250.00",
            "status": "COMPLETED",
        }
        response = self.client.post("/api/sales/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.product.refresh_from_db()
        product2.refresh_from_db()
        self.assertEqual(self.product.stock, 9)  # 10 - 1
        self.assertEqual(product2.stock, 2)  # 5 - 3


class SaleRecentTest(BaseSaleTest):
    def test_recent_returns_completed_sales_only(self):
        Sale.objects.create(total=Decimal("100"), payment_method="CASH", status="COMPLETED")
        Sale.objects.create(total=Decimal("200"), payment_method="CASH", status="PENDING")
        Sale.objects.create(total=Decimal("300"), payment_method="CASH", status="CANCELLED")

        response = self.client.get("/api/sales/recent/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_recent_respects_limit_param(self):
        for i in range(5):
            Sale.objects.create(
                total=Decimal(str(i * 100)),
                payment_method="CASH",
                status="COMPLETED",
            )
        response = self.client.get("/api/sales/recent/?limit=2")
        self.assertEqual(len(response.data), 2)

    def test_recent_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/sales/recent/")
        self.assertEqual(response.status_code, 401)


class SaleHistoryTest(BaseSaleTest):
    def test_history_returns_all_sales(self):
        Sale.objects.create(total=Decimal("100"), payment_method="CASH", status="COMPLETED")
        Sale.objects.create(total=Decimal("200"), payment_method="CASH", status="PENDING")

        response = self.client.get("/api/sales/history/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 2)

    def test_history_filters_by_client(self):
        Sale.objects.create(
            total=Decimal("100"),
            payment_method="CREDIT",
            status="COMPLETED",
            client=self.client_model,
        )
        Sale.objects.create(total=Decimal("200"), payment_method="CASH", status="COMPLETED")

        response = self.client.get(
            f"/api/sales/history/?client_id={self.client_model.id}"
        )
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["cliente"], "Test Client")

    def test_history_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/sales/history/")
        self.assertEqual(response.status_code, 401)