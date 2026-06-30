from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from coreApp.models import Category, Product


class BaseProductTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="testuser", password="testpass"
        )
        cls.category = Category.objects.create(name="Bebidas")
        cls.products = [
            Product.objects.create(
                name="Coca Cola",
                price=Decimal("150"),
                cost=Decimal("100"),
                stock=20,
                min_stock=10,
                category=cls.category,
                barcode="123456789",
            ),
            Product.objects.create(
                name="Pepsi",
                price=Decimal("120"),
                cost=Decimal("80"),
                stock=5,
                min_stock=10,
                category=cls.category,
            ),
            Product.objects.create(
                name="Agua Mineral",
                price=Decimal("80"),
                cost=Decimal("50"),
                stock=15,
                min_stock=10,
                category=cls.category,
            ),
        ]

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)


class ProductListTest(BaseProductTest):
    def test_list_returns_paginated_products(self):
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 3)

    def test_list_orders_by_name(self):
        response = self.client.get("/api/products/")
        names = [p["name"] for p in response.data["results"]]
        self.assertEqual(names, sorted(names))

    def test_list_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, 401)


class ProductCreateTest(BaseProductTest):
    def test_create_product_returns_201(self):
        data = {
            "name": "Nuevo Producto",
            "price": "200.00",
            "cost": "100.00",
            "stock": 50,
            "min_stock": 10,
            "category": self.category.id,
        }
        response = self.client.post("/api/products/", data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Product.objects.count(), 4)

    def test_create_product_without_cost_defaults_to_zero(self):
        data = {
            "name": "Sin Costo",
            "price": "100.00",
            "stock": 10,
            "min_stock": 5,
        }
        response = self.client.post("/api/products/", data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Product.objects.get(name="Sin Costo").cost, Decimal("0"))

    def test_create_product_requires_name_and_price(self):
        response = self.client.post(
            "/api/products/", {"stock": 10}, format="json"
        )
        self.assertEqual(response.status_code, 400)


class ProductUpdateTest(BaseProductTest):
    def test_update_product_price(self):
        product = self.products[0]
        response = self.client.patch(
            f"/api/products/{product.id}/",
            {"price": "200.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        product.refresh_from_db()
        self.assertEqual(product.price, Decimal("200"))

    def test_update_product_stock(self):
        product = self.products[0]
        response = self.client.patch(
            f"/api/products/{product.id}/",
            {"stock": 5},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        product.refresh_from_db()
        self.assertEqual(product.stock, 5)

    def test_update_nonexistent_product_returns_404(self):
        response = self.client.patch("/api/products/999/", {"price": "100"}, format="json")
        self.assertEqual(response.status_code, 404)


class ProductDeleteTest(BaseProductTest):
    def test_delete_product_returns_204(self):
        product = self.products[0]
        response = self.client.delete(f"/api/products/{product.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Product.objects.count(), 2)

    def test_delete_nonexistent_product_returns_404(self):
        response = self.client.delete("/api/products/999/")
        self.assertEqual(response.status_code, 404)


class ProductLowStockTest(BaseProductTest):
    def test_low_stock_returns_products_below_min_stock(self):
        response = self.client.get("/api/products/low-stock/")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)  # no pagination
        names = [p["name"] for p in response.data]
        self.assertIn("Pepsi", names)  # stock=5 < min_stock=10
        self.assertNotIn("Coca Cola", names)
        self.assertNotIn("Agua Mineral", names)

    def test_low_stock_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/products/low-stock/")
        self.assertEqual(response.status_code, 401)


class ProductBarcodeLookupTest(BaseProductTest):
    def test_lookup_by_barcode_returns_product(self):
        response = self.client.get("/api/products/lookup-barcode/?barcode=123456789")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Coca Cola")

    def test_lookup_by_barcode_returns_404_for_unknown(self):
        response = self.client.get("/api/products/lookup-barcode/?barcode=000000000")
        self.assertEqual(response.status_code, 404)

    def test_lookup_by_barcode_requires_barcode_param(self):
        response = self.client.get("/api/products/lookup-barcode/")
        self.assertEqual(response.status_code, 400)
        self.assertIn("barcode", str(response.data).lower())

    def test_lookup_by_barcode_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/products/lookup-barcode/?barcode=123456789")
        self.assertEqual(response.status_code, 401)