from datetime import datetime, timedelta
from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from coreApp.models import (
    CashClosure,
    Sale,
    SaleItem,
    Product,
    Category,
    FiadoPayment,
    Expense,
)


class CashClosureModelTest(TestCase):
    def test_str_returns_formatted_string(self):
        closure = CashClosure.objects.create(
            date=timezone.localdate(),
            counted_cash=Decimal("100.00"),
        )
        expected = f"Cierre {closure.date} — Efectivo: $100.00"
        self.assertEqual(str(closure), expected)

    def test_ordering_by_date_descending(self):
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)
        day_before = yesterday - timedelta(days=1)

        c1 = CashClosure.objects.create(date=today, counted_cash=Decimal("10"))
        c2 = CashClosure.objects.create(date=yesterday, counted_cash=Decimal("20"))
        c3 = CashClosure.objects.create(date=day_before, counted_cash=Decimal("30"))

        closures = list(CashClosure.objects.all())
        self.assertEqual(closures[0], c1)
        self.assertEqual(closures[1], c2)
        self.assertEqual(closures[2], c3)


class BaseClosureTest(TestCase):
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
            stock=100,
            category=cls.category,
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _create_sale(self, payment_method, total, status="COMPLETED"):
        sale = Sale.objects.create(
            total=total,
            payment_method=payment_method,
            status=status,
        )
        SaleItem.objects.create(
            sale=sale,
            product=self.product,
            quantity=1,
            unit_price=total,
            subtotal=total,
        )
        return sale


class CashClosurePreviewTest(BaseClosureTest):
    def test_preview_with_no_data_returns_zeros(self):
        response = self.client.get("/api/cash-closures/preview/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_sales"], "0.00")
        self.assertEqual(response.data["cash_sales"], "0.00")
        self.assertEqual(response.data["credit_sales"], "0.00")
        self.assertEqual(response.data["sales_count"], 0)
        self.assertEqual(response.data["fiado_payments"], "0.00")
        self.assertEqual(response.data["expenses"], "0.00")
        self.assertEqual(response.data["net_profit"], "0.00")
        self.assertEqual(response.data["expected_cash"], "0.00")
        self.assertEqual(response.data["date"], timezone.localdate().isoformat())

    def test_preview_with_cash_and_credit_sales(self):
        self._create_sale("CASH", Decimal("1000"))
        self._create_sale("CASH", Decimal("500"))
        self._create_sale("CREDIT", Decimal("300"))

        response = self.client.get("/api/cash-closures/preview/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_sales"], "1800.00")
        self.assertEqual(response.data["cash_sales"], "1500.00")
        self.assertEqual(response.data["credit_sales"], "300.00")
        self.assertEqual(response.data["sales_count"], 3)

    def test_preview_with_expenses(self):
        self._create_sale("CASH", Decimal("1000"))
        Expense.objects.create(
            amount=Decimal("200"),
            description="Test expense",
            category="OTHER",
            date=timezone.localdate(),
        )

        response = self.client.get("/api/cash-closures/preview/")
        self.assertEqual(response.data["expenses"], "200.00")
        self.assertEqual(response.data["expected_cash"], "800.00")

    def test_preview_with_fiado_payments(self):
        self._create_sale("CASH", Decimal("1000"))
        FiadoPayment.objects.create(amount=Decimal("300"))

        response = self.client.get("/api/cash-closures/preview/")
        self.assertEqual(response.data["fiado_payments"], "300.00")
        self.assertEqual(response.data["expected_cash"], "1300.00")

    def test_preview_excludes_non_completed_sales(self):
        self._create_sale("CASH", Decimal("1000"), status="PENDING")
        self._create_sale("CASH", Decimal("500"), status="CANCELLED")

        response = self.client.get("/api/cash-closures/preview/")
        self.assertEqual(response.data["total_sales"], "0.00")
        self.assertEqual(response.data["sales_count"], 0)

    def test_preview_excludes_sales_from_other_days(self):
        sale = self._create_sale("CASH", Decimal("1000"))
        yesterday = timezone.localdate() - timedelta(days=1)
        yesterday_start = timezone.make_aware(
            datetime.combine(yesterday, datetime.min.time())
        )
        Sale.objects.filter(id=sale.id).update(created_at=yesterday_start)

        response = self.client.get("/api/cash-closures/preview/")
        self.assertEqual(response.data["total_sales"], "0.00")

    def test_preview_returns_409_if_closure_exists_today(self):
        CashClosure.objects.create(
            date=timezone.localdate(), counted_cash=Decimal("0")
        )

        response = self.client.get("/api/cash-closures/preview/")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.data["detail"], "Ya existe un cierre para hoy"
        )

    def test_preview_net_profit_calculation(self):
        self._create_sale("CASH", Decimal("1000"))
        self._create_sale("CASH", Decimal("500"))

        response = self.client.get("/api/cash-closures/preview/")
        self.assertEqual(response.data["net_profit"], "1380.00")

    def test_preview_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/cash-closures/preview/")
        self.assertEqual(response.status_code, 401)


class CashClosureCreateTest(BaseClosureTest):
    def test_create_closure_returns_201(self):
        self._create_sale("CASH", Decimal("1000"))

        response = self.client.post(
            "/api/cash-closures/",
            {"counted_cash": "1000.00"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.data["date"], timezone.localdate().isoformat()
        )
        self.assertEqual(response.data["cash_sales"], "1000.00")
        self.assertEqual(response.data["expected_cash"], "1000.00")
        self.assertEqual(response.data["counted_cash"], "1000.00")
        self.assertEqual(response.data["discrepancy"], "0.00")
        self.assertEqual(response.data["created_by"], self.user.id)

    def test_create_closure_with_notes(self):
        self._create_sale("CASH", Decimal("500"))

        response = self.client.post(
            "/api/cash-closures/",
            {"counted_cash": "500.00", "notes": "cierre normal"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["notes"], "cierre normal")

    def test_create_closure_with_all_fields(self):
        self._create_sale("CASH", Decimal("1000"))
        FiadoPayment.objects.create(amount=Decimal("200"))
        Expense.objects.create(
            amount=Decimal("150"),
            description="Test",
            category="OTHER",
            date=timezone.localdate(),
        )

        response = self.client.post(
            "/api/cash-closures/",
            {"counted_cash": "1000.00", "notes": "cierre completo"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["expected_cash"], "1050.00")
        self.assertEqual(response.data["discrepancy"], "-50.00")
        self.assertEqual(response.data["notes"], "cierre completo")

    def test_create_closure_persists_to_db(self):
        self._create_sale("CASH", Decimal("1000"))

        self.client.post(
            "/api/cash-closures/",
            {"counted_cash": "1050.00"},
            format="json",
        )

        closure = CashClosure.objects.get(date=timezone.localdate())
        self.assertEqual(closure.counted_cash, Decimal("1050.00"))
        self.assertEqual(closure.discrepancy, Decimal("50.00"))
        self.assertEqual(closure.created_by, self.user)

    def test_duplicate_closure_returns_409(self):
        self._create_sale("CASH", Decimal("500"))

        r1 = self.client.post(
            "/api/cash-closures/",
            {"counted_cash": "500.00"},
            format="json",
        )
        self.assertEqual(r1.status_code, 201)

        r2 = self.client.post(
            "/api/cash-closures/",
            {"counted_cash": "500.00"},
            format="json",
        )
        self.assertEqual(r2.status_code, 409)
        self.assertEqual(
            r2.data["detail"], "Ya existe un cierre para hoy"
        )

    def test_discrepancy_zero_when_counted_equals_expected(self):
        self._create_sale("CASH", Decimal("1000"))

        response = self.client.post(
            "/api/cash-closures/",
            {"counted_cash": "1000.00"},
            format="json",
        )
        self.assertEqual(response.data["discrepancy"], "0.00")

    def test_discrepancy_positive_when_counted_exceeds_expected(self):
        self._create_sale("CASH", Decimal("1000"))

        response = self.client.post(
            "/api/cash-closures/",
            {"counted_cash": "1100.00"},
            format="json",
        )
        self.assertEqual(response.data["discrepancy"], "100.00")

    def test_discrepancy_negative_when_counted_less_than_expected(self):
        self._create_sale("CASH", Decimal("1000"))

        response = self.client.post(
            "/api/cash-closures/",
            {"counted_cash": "900.00"},
            format="json",
        )
        self.assertEqual(response.data["discrepancy"], "-100.00")

    def test_create_closure_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            "/api/cash-closures/",
            {"counted_cash": "100.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)
