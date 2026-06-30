from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from coreApp.models import Expense


class BaseExpenseTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="testuser", password="testpass"
        )
        cls.today = date.today()
        cls.yesterday = cls.today - timedelta(days=1)

        cls.expense1 = Expense.objects.create(
            amount=Decimal("500"),
            description="Arriendo local",
            category="RENT",
            date=cls.today,
        )
        cls.expense2 = Expense.objects.create(
            amount=Decimal("200"),
            description="Compra de mercadería",
            category="SUPPLIES",
            date=cls.today,
        )
        cls.expense3 = Expense.objects.create(
            amount=Decimal("100"),
            description="Pasaje",
            category="TRANSPORT",
            date=cls.yesterday,
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)


class ExpenseListTest(BaseExpenseTest):
    def test_list_returns_paginated_expenses(self):
        response = self.client.get("/api/expenses/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 3)

    def test_list_orders_by_date_desc_then_created_desc(self):
        response = self.client.get("/api/expenses/")
        results = response.data["results"]
        # Today's expenses come before yesterday's
        self.assertEqual(results[0]["date"], self.today.isoformat())
        self.assertEqual(results[1]["date"], self.today.isoformat())
        self.assertEqual(results[2]["date"], self.yesterday.isoformat())

    def test_list_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/expenses/")
        self.assertEqual(response.status_code, 401)


class ExpenseDateFilterTest(BaseExpenseTest):
    def test_filter_by_date_from(self):
        response = self.client.get(f"/api/expenses/?date_from={self.today}")
        results = response.data["results"]
        self.assertEqual(len(results), 2)
        for exp in results:
            self.assertGreaterEqual(exp["date"], self.today.isoformat())

    def test_filter_by_date_to(self):
        response = self.client.get(f"/api/expenses/?date_to={self.yesterday}")
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.expense3.id)

    def test_filter_by_date_range(self):
        response = self.client.get(
            f"/api/expenses/?date_from={self.yesterday}&date_to={self.today}"
        )
        results = response.data["results"]
        self.assertEqual(len(results), 3)

    def test_filter_with_no_matches_returns_empty(self):
        future = self.today + timedelta(days=365)
        response = self.client.get(f"/api/expenses/?date_from={future}")
        results = response.data["results"]
        self.assertEqual(len(results), 0)


class ExpenseCreateTest(BaseExpenseTest):
    def test_create_expense_returns_201(self):
        data = {
            "amount": "300.00",
            "description": "Luz",
            "category": "SERVICES",
            "date": self.today,
        }
        response = self.client.post("/api/expenses/", data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Expense.objects.count(), 4)

    def test_create_expense_requires_amount_and_category(self):
        response = self.client.post(
            "/api/expenses/", {"description": "Solo descripción"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_create_expense_requires_auth(self):
        self.client.force_authenticate(user=None)
        data = {
            "amount": "100.00",
            "description": "Test",
            "category": "OTHER",
            "date": self.today,
        }
        response = self.client.post("/api/expenses/", data, format="json")
        self.assertEqual(response.status_code, 401)


class ExpenseUpdateDeleteTest(BaseExpenseTest):
    def test_update_expense(self):
        data = {"amount": "600.00", "description": "Arriendo actualizado"}
        response = self.client.patch(
            f"/api/expenses/{self.expense1.id}/", data, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.expense1.refresh_from_db()
        self.assertEqual(self.expense1.amount, Decimal("600"))

    def test_delete_expense_returns_204(self):
        response = self.client.delete(f"/api/expenses/{self.expense3.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Expense.objects.count(), 2)

    def test_update_nonexistent_returns_404(self):
        response = self.client.patch("/api/expenses/999/", {"amount": "100"}, format="json")
        self.assertEqual(response.status_code, 404)