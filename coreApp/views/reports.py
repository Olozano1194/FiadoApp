from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import F, Sum
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

        # Profit calculation and day grouping
        sales_with_items = sales_qs.prefetch_related("items__product")
        gross_profit = Decimal("0.00")
        day_groups = defaultdict(list)
        for sale in sales_with_items:
            for item in sale.items.all():
                cost = item.product.cost or Decimal("0")
                gross_profit += (item.unit_price - cost) * item.quantity
            day_groups[sale.created_at.date()].append(sale)

        # Expenses in range
        expenses = (
            Expense.objects.filter(date__gte=report_start, date__lte=report_end).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        # Top products
        top_products = (
            SaleItem.objects.filter(sale__in=sales_qs)
            .values("product__name")
            .annotate(total_qty=Sum("quantity"), total_revenue=Sum(F("unit_price") * F("quantity")))
            .order_by("-total_revenue")[:10]
        )

        # Build week_days
        num_days = (report_end - report_start).days + 1
        day_names_es = ["lunes", "martes", "mi\u00e9rcoles", "jueves", "viernes", "s\u00e1bado", "domingo"]

        week_days = []
        for i in range(num_days):
            day = report_start + timedelta(days=i)
            day_sales = day_groups.get(day, [])
            day_total = sum(s.total for s in day_sales) if day_sales else Decimal("0.00")
            day_count = len(day_sales)

            # Top product for this day
            product_qty = defaultdict(int)
            product_revenue = defaultdict(Decimal)
            for sale in day_sales:
                for item in sale.items.all():
                    product_qty[item.product.name] += item.quantity
                    product_revenue[item.product.name] += item.subtotal

            top_product = None
            if product_qty:
                best_name = max(product_qty, key=product_qty.get)
                top_product = {
                    "name": best_name,
                    "units": product_qty[best_name],
                    "revenue": float(product_revenue[best_name]),
                }

            week_days.append({
                "date": day.isoformat(),
                "day_name": day_names_es[day.weekday()],
                "total": float(day_total),
                "count": day_count,
                "top_product": top_product,
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
                "image": product_obj.image.url if product_obj and product_obj.image else None,
            }

        profit = float(gross_profit - expenses)
        total_sales_float = float(total_sales)
        profit_margin = round((profit / total_sales_float * 100), 1) if total_sales_float > 0 else 0.0
        avg_per_day = round(total_week / num_days, 2)

        return Response({
            "week_days": week_days,
            "summary": {
                "total_week": float(total_sales),
                "change_vs_last_week": change_vs_last_week,
                "avg_per_day": avg_per_day,
            },
            "fiado_pending": {
                "total": float(fiado_total),
                "client_count": fiado_client_count,
            },
            "top_product": top_product,
            "profit": profit,
            "profit_margin": profit_margin,
            "expenses_total": float(expenses),
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
