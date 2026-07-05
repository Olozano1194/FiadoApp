from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Count, ExpressionWrapper, F, Sum, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Client, Expense, FiadoPayment, Product, Sale, SaleItem
from .helpers import get_week_range


class ReportStatsView(APIView):
    def get(self, request):
        today = timezone.localdate()
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        week_str = request.query_params.get("week")

        if week_str:
            week_start, week_end = get_week_range(week_str)
            range_start, range_end = week_start, week_end
            report_start = week_start.date()
            report_end = (week_end - timedelta(days=1)).date()
        elif date_from and date_to:
            range_end = timezone.make_aware(
                datetime.combine(datetime.strptime(date_to, "%Y-%m-%d").date(), datetime.max.time())
            )
            range_start = timezone.make_aware(
                datetime.combine(
                    datetime.strptime(date_from, "%Y-%m-%d").date(), datetime.min.time()
                )
            )
            report_start = range_start.date()
            report_end = range_end.date()
        else:
            range_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
            range_end = range_start + timedelta(days=1)
            report_start = today
            report_end = today

        # Sales in range
        sales_qs = Sale.objects.filter(
            created_at__range=(range_start, range_end), status="COMPLETED"
        )
        total_sales = sales_qs.aggregate(total=Sum("total"))["total"] or Decimal("0.00")
        sales_count = sales_qs.count()

        # Profit calculation — single SQL aggregation
        profit_expr = ExpressionWrapper(
            (F("unit_price") - Coalesce(F("cost_at_sale"), Decimal("0.00"))) * F("quantity"),
            output_field=DecimalField(max_digits=10, decimal_places=2),
        )
        gross_profit = (
            SaleItem.objects.filter(sale__in=sales_qs)
            .aggregate(total=Sum(profit_expr))["total"]
            or Decimal("0.00")
        )

        # Expenses in range
        expenses = (
            Expense.objects.filter(date__gte=report_start, date__lte=report_end).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        # Top products sorted by profit (overall)
        top_products = (
            SaleItem.objects.filter(sale__in=sales_qs)
            .values("product__name")
            .annotate(
                total_qty=Sum("quantity"),
                total_revenue=Sum(F("unit_price") * F("quantity")),
                total_profit=Sum(profit_expr),
            )
            .order_by("-total_profit")[:10]
        )

        # ── Python-side day grouping (avoids TruncDate None on SQLite) ──
        sales_with_items = sales_qs.prefetch_related("items__product")

        day_totals: dict[str, Decimal] = defaultdict(Decimal)
        day_counts: dict[str, int] = defaultdict(int)
        day_profits: dict[str, Decimal] = defaultdict(Decimal)
        day_product_agg: dict[str, dict[str, dict]] = defaultdict(
            lambda: defaultdict(lambda: {"units": 0, "revenue": Decimal("0.00")})
        )

        for sale in sales_with_items:
            day_key = timezone.localtime(sale.created_at).date().isoformat()
            day_totals[day_key] += sale.total
            day_counts[day_key] += 1

            for item in sale.items.all():
                unit_price = item.unit_price
                cost = item.cost_at_sale or Decimal("0.00")
                qty = item.quantity
                day_profits[day_key] += (unit_price - cost) * qty

                # Aggregate by product per day
                product_name = (
                    item.product.name if item.product and hasattr(item, "product") else "—"
                )
                day_product_agg[day_key][product_name]["units"] += qty
                day_product_agg[day_key][product_name]["revenue"] += unit_price * qty

        # Pick top product per day (most units sold)
        day_products: dict[str, dict] = {}
        for day_key, products in day_product_agg.items():
            top_name = max(products, key=lambda n: products[n]["units"])
            top = products[top_name]
            day_products[day_key] = {
                "name": top_name,
                "units": top["units"],
                "revenue": float(top["revenue"]),
            }

        # Convert defaultdicts to plain dicts for subsequent read-only access
        day_totals = dict(day_totals)
        day_counts = dict(day_counts)
        day_profits = dict(day_profits)

        # ── Build week_days ─────────────────────────────────────────
        num_days = (report_end - report_start).days + 1
        day_names_es = ["lunes", "martes", "mi\u00e9rcoles", "jueves", "viernes", "s\u00e1bado", "domingo"]

        week_days = []
        for i in range(num_days):
            day = report_start + timedelta(days=i)
            day_key = day.isoformat()
            week_days.append({
                "date": day_key,
                "day_name": day_names_es[day.weekday()],
                "total": float(day_totals.get(day_key, Decimal("0.00"))),
                "count": day_counts.get(day_key, 0),
                "profit": float(day_profits.get(day_key, Decimal("0.00"))),
                "top_product": day_products.get(day_key),
            })

        # Summary
        total_week = sum(d["total"] for d in week_days)
        num_days = len(week_days) or 1

        # Compare with previous same-length period
        period_length = (report_end - report_start).days + 1
        prev_start = report_start - timedelta(days=period_length)
        prev_end = report_start
        prev_range_start = timezone.make_aware(datetime.combine(prev_start, datetime.min.time()))
        prev_range_end = timezone.make_aware(datetime.combine(prev_end, datetime.min.time()))
        prev_total = (
            Sale.objects.filter(
                created_at__range=(prev_range_start, prev_range_end), status="COMPLETED"
            ).aggregate(total=Sum("total"))["total"]
            or Decimal("0.00")
        )
        if prev_total > 0:
            change_vs_last_week = round(float(((total_sales - prev_total) / prev_total) * 100), 1)
        elif total_sales > 0:
            change_vs_last_week = 100.0
        else:
            change_vs_last_week = 0.0

        # Fiado pending
        fiado_total = Client.objects.aggregate(total=Sum("current_debt"))["total"] or Decimal("0.00")
        fiado_client_count = Client.objects.filter(current_debt__gt=0).count()

        # Top product overall
        top_product_data = list(top_products[:1])
        top_product = None
        if top_product_data:
            tp = top_product_data[0]
            product_obj = Product.objects.filter(name=tp["product__name"]).first()
            top_product = {
                "name": tp["product__name"],
                "units_sold": tp["total_qty"],
                "revenue": float(tp["total_revenue"]),
                "profit": float(tp["total_profit"]),
                "image": product_obj.image.url if product_obj and product_obj.image else None,
            }

        total_sales_float = float(total_sales)
        avg_per_day = round(total_week / num_days, 2)

        net_profit_week = gross_profit - expenses
        profit_margin = round((float(net_profit_week) / total_sales_float * 100), 1) if total_sales_float > 0 else 0.0

        return Response({
            "week_days": week_days,
            "summary": {
                "total_week": float(total_sales),
                "change_vs_last_week": change_vs_last_week,
                "avg_per_day": avg_per_day,
                "total_profit_week": float(net_profit_week),
                "profit_margin": profit_margin,
                "total_expenses_week": float(expenses),
            },
            "fiado_pending": {
                "total": float(fiado_total),
                "client_count": fiado_client_count,
            },
            "top_product": top_product,
        })


class RecentActivityView(APIView):
    def get(self, request):
        limit = int(request.query_params.get("limit", 10))

        recent_sales = (
            Sale.objects.filter(status="COMPLETED")
            .order_by("-created_at")
            .select_related("client")[:limit]
        )
        recent_payments = FiadoPayment.objects.all().order_by("-date").select_related("client")[
            :limit
        ]

        activities = []

        for sale in recent_sales:
            activities.append(
                {
                    "id": sale.id,
                    "concept": "Venta",
                    "client_name": sale.client.name if sale.client else "—",
                    "type": "sale",
                    "amount": float(sale.total),
                    "status": "Completado",
                    "date": sale.created_at.strftime("%Y-%m-%d"),
                    "time": sale.created_at.strftime("%H:%M"),
                }
            )

        for payment in recent_payments:
            activities.append(
                {
                    "id": payment.id,
                    "concept": "Pago",
                    "client_name": payment.client.name if payment.client else "—",
                    "type": "payment",
                    "amount": float(payment.amount),
                    "status": "Registrado",
                    "date": payment.date.strftime("%Y-%m-%d"),
                    "time": "12:00",
                }
            )

        activities.sort(key=lambda a: a["date"] + " " + a["time"], reverse=True)

        return Response(activities[:limit])