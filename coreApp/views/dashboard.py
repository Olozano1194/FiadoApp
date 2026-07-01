from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Client, Expense, Product, Sale


class DashboardStatsView(APIView):
    def get(self, request):
        today = timezone.localdate()
        today_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        today_end = today_start + timedelta(days=1)

        # Today's sales
        today_sales_qs = Sale.objects.filter(
            created_at__range=(today_start, today_end), status="COMPLETED"
        )
        today_total = today_sales_qs.aggregate(total=Sum("total"))["total"] or Decimal("0.00")

        # Today's expenses
        today_expenses = (
            Expense.objects.filter(date=today).aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )

        # Yesterday's sales for comparison
        yesterday_start = today_start - timedelta(days=1)
        yesterday_end = today_start
        yesterday_total = (
            Sale.objects.filter(
                created_at__range=(yesterday_start, yesterday_end), status="COMPLETED"
            ).aggregate(total=Sum("total"))["total"]
            or Decimal("0.00")
        )

        # cambio_vs_ayer
        if yesterday_total > 0:
            cambio_pct = float(((today_total - yesterday_total) / yesterday_total) * 100)
            cambio_vs_ayer = f"{cambio_pct:+.1f}"
        elif today_total > 0:
            cambio_vs_ayer = "+100.0"
        else:
            cambio_vs_ayer = "0.0"

        # Total clients with debt
        clients_with_debt = Client.objects.filter(current_debt__gt=0).count()
        total_debt = Client.objects.aggregate(total=Sum("current_debt"))["total"] or Decimal("0.00")

        # Low stock count
        low_stock_count = Product.objects.filter(stock__lt=F("min_stock")).count()

        # Net today / ganancia_dia
        net_today = today_total - today_expenses

        # margen_dia
        if today_total > 0:
            margen_dia = round(float((net_today / today_total) * 100), 1)
        else:
            margen_dia = None

        # Weekly sales trend (last 7 days) — single query with TruncDate
        week_ago = today_start - timedelta(days=7)
        daily_totals = {
            row["day"].isoformat(): str(row["total"])
            for row in (
                Sale.objects.filter(
                    created_at__gte=week_ago, status="COMPLETED"
                )
                .annotate(day=TruncDate("created_at"))
                .values("day")
                .annotate(total=Sum("total"))
                .order_by("day")
            )
        }
        weekly_sales = [
            {"date": (today_start - timedelta(days=i)).date().isoformat(), "total": daily_totals.get((today_start - timedelta(days=i)).date().isoformat(), "0.00")}
            for i in range(7)
        ]

        return Response(
            {
                "ventas_dia": str(today_total),
                "gastos_hoy": str(today_expenses),
                "cambio_vs_ayer": cambio_vs_ayer,
                "ganancia_dia": str(net_today),
                "margen_dia": margen_dia,
                "fiado_pendiente_total": str(total_debt),
                "clientes_fiado_pendiente": clients_with_debt,
                "productos_stock_bajo": low_stock_count,
                "weekly_sales": weekly_sales,
            }
        )