from datetime import datetime, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from coreApp.models import Category, Client, Expense, Product, Sale, SaleItem


class ReportStatsBaseTest(TestCase):
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
            stock=50,
            category=cls.category,
        )
        cls.client_model = Client.objects.create(
            name="Test Client",
            credit_limit=Decimal("5000"),
            current_debt=Decimal("500"),
        )

        # Create sales on known dates
        today = timezone.localdate()
        two_days_ago = today - timedelta(days=2)

        sale1 = Sale.objects.create(
            total=Decimal("200"),
            payment_method="CASH",
            status="COMPLETED",
            created_at=timezone.make_aware(
                datetime.combine(today, datetime.min.time())
            ),
        )
        SaleItem.objects.create(
            sale=sale1,
            product=cls.product,
            quantity=2,
            unit_price=Decimal("100"),
            subtotal=Decimal("200"),
            cost_at_sale=Decimal("60"),
        )

        # Sale from 2 days ago
        sale2 = Sale.objects.create(
            total=Decimal("300"),
            payment_method="CREDIT",
            status="COMPLETED",
            client=cls.client_model,
            created_at=timezone.make_aware(
                datetime.combine(two_days_ago, datetime.min.time())
            ),
        )
        SaleItem.objects.create(
            sale=sale2,
            product=cls.product,
            quantity=3,
            unit_price=Decimal("100"),
            subtotal=Decimal("300"),
            cost_at_sale=Decimal("60"),
        )

        # Expense today
        Expense.objects.create(
            description="Test expense",
            amount=Decimal("50"),
            date=today,
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)


class ReportStatsTest(ReportStatsBaseTest):
    def test_stats_returns_expected_keys(self):
        response = self.client.get("/api/reports/stats/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("week_days", response.data)
        self.assertIn("summary", response.data)
        self.assertIn("top_product", response.data)

    def test_stats_summary_has_correct_totals(self):
        response = self.client.get("/api/reports/stats/")
        summary = response.data["summary"]
        self.assertGreater(summary["total_week"], 0)
        self.assertIn("total_profit_week", summary)
        self.assertIn("total_expenses_week", summary)
        self.assertEqual(summary["total_expenses_week"], 50.0)
        self.assertIn("profit_margin", summary)

    def test_stats_has_week_days(self):
        response = self.client.get("/api/reports/stats/")
        self.assertGreater(len(response.data["week_days"]), 0)
        day = response.data["week_days"][0]
        self.assertIn("date", day)
        self.assertIn("day_name", day)
        self.assertIn("total", day)
        self.assertIn("count", day)
        self.assertIn("profit", day)

    def test_stats_with_date_range(self):
        today = timezone.localdate()
        two_days_ago = today - timedelta(days=2)
        response = self.client.get(
            "/api/reports/stats/",
            {
                "date_from": two_days_ago.isoformat(),
                "date_to": today.isoformat(),
            },
        )
        self.assertEqual(response.status_code, 200)
        # Should have 3 days in range
        self.assertEqual(len(response.data["week_days"]), 3)

    def test_stats_with_specific_week(self):
        today = timezone.localdate()
        # get_week_range expects %Y-%m-%d for a date within the target week
        response = self.client.get(
            "/api/reports/stats/", {"week": today.isoformat()}
        )
        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.data["week_days"]), 0)

    def test_stats_returns_top_product(self):
        response = self.client.get("/api/reports/stats/")
        top = response.data.get("top_product")
        self.assertIsNotNone(top)
        self.assertIn("name", top)
        self.assertIn("units_sold", top)

    def test_stats_empty_range_returns_zeroes(self):
        last_year = (timezone.localdate() - timedelta(days=400)).isoformat()
        response = self.client.get(
            "/api/reports/stats/",
            {"date_from": last_year, "date_to": last_year},
        )
        self.assertEqual(response.status_code, 200)
        summary = response.data["summary"]
        self.assertEqual(summary["total_week"], 0.0)
        self.assertEqual(summary["total_profit_week"], 0.0)

    def test_stats_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/reports/stats/")
        self.assertEqual(response.status_code, 401)


class ReportRecentActivityTest(ReportStatsBaseTest):
    def test_recent_activity_returns_mixed_activities(self):
        response = self.client.get("/api/reports/recent-activity/")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        self.assertGreater(len(response.data), 0)

    def test_recent_activity_respects_limit(self):
        response = self.client.get("/api/reports/recent-activity/?limit=1")
        self.assertLessEqual(len(response.data), 1)

    def test_recent_activity_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/reports/recent-activity/")
        self.assertEqual(response.status_code, 401)
