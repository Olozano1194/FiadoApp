from django.db import transaction
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Sum, F
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
from itertools import chain
from .models import Category, Product, Client, Sale, SaleItem, FiadoPayment, Expense, CashClosure
from .serializers import (
    CategorySerializer, ProductSerializer, ClientSerializer,
    SaleSerializer, SaleItemSerializer, FiadoPaymentSerializer,
    SaleCreateSerializer, ExpenseSerializer,
    CashClosureSerializer, CashClosureCreateSerializer
)


class HealthCheckView(APIView):
    """Public health check endpoint for Tauri splash screen polling."""
    permission_classes = [AllowAny]
    authentication_classes = []  # no auth needed

    def get(self, request):
        return Response({'status': 'ok'}, status=status.HTTP_200_OK)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    @action(detail=False, url_path='low-stock')
    def low_stock(self, request):
        products = Product.objects.filter(stock__lt=F('min_stock'))
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

    def get_queryset(self):
        queryset = Client.objects.all()
        debt = self.request.query_params.get('debt')
        if debt and debt.lower() == 'true':
            queryset = queryset.filter(current_debt__gt=0)
        return queryset


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return SaleCreateSerializer
        return SaleSerializer

    @action(detail=False)
    def recent(self, request):
        limit = int(request.query_params.get('limit', 10))
        sales = Sale.objects.filter(status='COMPLETED').select_related('client').order_by('-created_at')[:limit]
        data = []
        for sale in sales:
            data.append({
                'id': sale.id,
                'cliente': sale.client.name if sale.client else '—',
                'hora': timezone.localtime(sale.created_at).strftime('%I:%M %p'),
                'estado': {
                    'COMPLETED': 'Completada',
                    'PENDING': 'Pendiente',
                    'CANCELLED': 'Cancelada'
                }.get(sale.status, sale.status),
                'total': f"{sale.total:.2f}"
            })
        return Response(data)


    @action(detail=False)
    def history(self, request):
        """Listado paginado de todas las ventas para el historial."""
        paginator = PageNumberPagination()
        paginator.page_size = 15
        paginator.page_size_query_param = 'page_size'
        paginator.max_page_size = 100
        sales = Sale.objects.all().select_related('client').order_by('-created_at')
        page = paginator.paginate_queryset(sales, request)
        data = []
        for sale in page:
            data.append({
                'id': sale.id,
                'cliente': sale.client.name if sale.client else '—',
                'fecha': timezone.localtime(sale.created_at).strftime('%d/%m/%Y'),
                'hora': timezone.localtime(sale.created_at).strftime('%I:%M %p'),
                'metodo_pago': 'Efectivo' if sale.payment_method == 'CASH' else 'Fiado',
                'estado': {
                    'COMPLETED': 'Completada',
                    'PENDING': 'Pendiente',
                    'CANCELLED': 'Cancelada'
                }.get(sale.status, sale.status),
                'total': f"{sale.total:.2f}"
            })
        return paginator.get_paginated_response(data)


class FiadoPaymentViewSet(viewsets.ModelViewSet):
    queryset = FiadoPayment.objects.all()
    serializer_class = FiadoPaymentSerializer

    def perform_create(self, serializer):
        payment = serializer.save()
        if payment.client:
            client = payment.client
            if payment.amount > client.current_debt:
                payment.delete()
                raise serializers.ValidationError(
                    f"El pago ({payment.amount}) no puede exceder la deuda actual ({client.current_debt})"
                )
            client.current_debt -= payment.amount
            if client.current_debt < Decimal('0.00'):
                client.current_debt = Decimal('0.00')
            client.save(update_fields=['current_debt'])

    @action(detail=False)
    def today(self, request):
        today = timezone.localdate()
        today_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        today_end = today_start + timedelta(days=1)
        payments = FiadoPayment.objects.filter(
            date__range=(today_start, today_end)
        )
        total = payments.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        return Response({
            'total': f"{total:.2f}",
            'count': payments.count(),
        })


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer


class CashClosureViewSet(viewsets.ModelViewSet):
    queryset = CashClosure.objects.all()
    serializer_class = CashClosureSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return CashClosureCreateSerializer
        return CashClosureSerializer

    @action(detail=False, methods=['get'])
    def preview(self, request):
        today = timezone.localdate()
        today_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        today_end = today_start + timedelta(days=1)

        if CashClosure.objects.filter(date=today).exists():
            return Response(
                {'detail': 'Ya existe un cierre para hoy'},
                status=status.HTTP_409_CONFLICT
            )

        cash_sales = Sale.objects.filter(
            created_at__range=(today_start, today_end),
            status='COMPLETED',
            payment_method='CASH'
        ).aggregate(total=Sum('total'))['total'] or Decimal('0.00')

        credit_sales = Sale.objects.filter(
            created_at__range=(today_start, today_end),
            status='COMPLETED',
            payment_method='CREDIT'
        ).aggregate(total=Sum('total'))['total'] or Decimal('0.00')

        total_sales = cash_sales + credit_sales

        sales_count = Sale.objects.filter(
            created_at__range=(today_start, today_end),
            status='COMPLETED'
        ).count()

        fiado_payments = FiadoPayment.objects.filter(
            date__range=(today_start, today_end)
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        expenses = Expense.objects.filter(
            date=today
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        today_sales = Sale.objects.filter(
            created_at__range=(today_start, today_end),
            status='COMPLETED'
        ).prefetch_related('items__product')

        net_profit = Decimal('0.00')
        for sale in today_sales:
            for item in sale.items.all():
                cost = item.product.cost or Decimal('0')
                net_profit += (item.unit_price - cost) * item.quantity

        expected_cash = cash_sales + fiado_payments - expenses

        return Response({
            'date': today.isoformat(),
            'total_sales': f"{total_sales:.2f}",
            'cash_sales': f"{cash_sales:.2f}",
            'credit_sales': f"{credit_sales:.2f}",
            'sales_count': sales_count,
            'fiado_payments': f"{fiado_payments:.2f}",
            'expenses': f"{expenses:.2f}",
            'net_profit': f"{net_profit:.2f}",
            'expected_cash': f"{expected_cash:.2f}",
        })

    def create(self, request, *args, **kwargs):
        today = timezone.localdate()

        with transaction.atomic():
            closure_qs = CashClosure.objects.select_for_update().filter(date=today)
            if closure_qs.exists():
                return Response(
                    {'detail': 'Ya existe un cierre para hoy'},
                    status=status.HTTP_409_CONFLICT
                )

            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)

        output_serializer = CashClosureSerializer(instance=serializer.instance)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DashboardStatsView(APIView):
    def get(self, request):
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)

        today_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        today_end = today_start + timedelta(days=1)
        yesterday_start = timezone.make_aware(datetime.combine(yesterday, datetime.min.time()))
        yesterday_end = yesterday_start + timedelta(days=1)

        ventas_hoy_qs = Sale.objects.filter(
            created_at__range=(today_start, today_end),
            status='COMPLETED'
        )
        ventas_hoy = ventas_hoy_qs.aggregate(total=Sum('total'))['total'] or Decimal('0.00')

        ventas_ayer = Sale.objects.filter(
            created_at__range=(yesterday_start, yesterday_end),
            status='COMPLETED'
        ).aggregate(total=Sum('total'))['total'] or Decimal('0.00')

        if ventas_ayer > 0:
            cambio = ((ventas_hoy - ventas_ayer) / ventas_ayer) * 100
            cambio_vs_ayer = f"{cambio:+.1f}"
        else:
            cambio_vs_ayer = "0.0"

        # ── Ganancia del día ──
        ganancia_dia = Decimal('0.00')
        for sale in ventas_hoy_qs.prefetch_related('items__product'):
            for item in sale.items.all():
                cost = item.product.cost if item.product.cost else Decimal('0')
                ganancia_dia += (item.unit_price - cost) * item.quantity

        # ── Gastos del día ──
        gastos_hoy = Expense.objects.filter(
            date=today
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        fiado_total = Client.objects.aggregate(total=Sum('current_debt'))['total'] or Decimal('0.00')
        clientes_fiado = Client.objects.filter(current_debt__gt=0).count()
        productos_bajo = Product.objects.filter(stock__lt=F('min_stock')).count()

        return Response({
            'ventas_dia': f"{ventas_hoy:.2f}",
            'cambio_vs_ayer': cambio_vs_ayer,
            'ganancia_dia': f"{ganancia_dia:.2f}",
            'gastos_hoy': f"{gastos_hoy:.2f}",
            'margen_dia': float(ganancia_dia / ventas_hoy * 100) if ventas_hoy > 0 else 0,
            'fiado_pendiente_total': f"{fiado_total:.2f}",
            'clientes_fiado_pendiente': clientes_fiado,
            'productos_stock_bajo': productos_bajo,
        })


class SearchView(APIView):
    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'products': [], 'clients': []})

        products = Product.objects.filter(name__icontains=q)[:5]
        clients = Client.objects.filter(name__icontains=q)[:5]

        return Response({
            'products': ProductSerializer(products, many=True).data,
            'clients': ClientSerializer(clients, many=True).data,
        })


DAY_NAMES = {0: "lun", 1: "mar", 2: "mié", 3: "jue", 4: "vie", 5: "sáb", 6: "dom"}


def get_week_range(date_str=None):
    if date_str:
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        date = dt.date()
    else:
        date = timezone.localdate()
    monday = date - timedelta(days=date.weekday())
    week_start = timezone.make_aware(datetime.combine(monday, datetime.min.time()))
    week_end = week_start + timedelta(days=7)
    return week_start, week_end, monday


class ReportStatsView(APIView):
    def get(self, request):
        week_param = request.query_params.get('week')

        try:
            week_start, week_end, monday = get_week_range(week_param)
        except ValueError:
            return Response(
                {'detail': 'Invalid date format. Use YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        week_days = []
        total_week = Decimal('0.00')

        for i in range(7):
            day_date = monday + timedelta(days=i)
            day_start = timezone.make_aware(datetime.combine(day_date, datetime.min.time()))
            day_end = day_start + timedelta(days=1)

            day_sales = Sale.objects.filter(
                created_at__range=(day_start, day_end),
                status='COMPLETED'
            )

            day_total = day_sales.aggregate(total=Sum('total'))['total'] or Decimal('0.00')
            day_count = day_sales.count()
            total_week += day_total

            day_top = SaleItem.objects.filter(
                sale__in=day_sales
            ).values('product__name').annotate(
                units=Sum('quantity'),
                revenue=Sum('subtotal')
            ).order_by('-units').first()

            week_days.append({
                'date': day_date.isoformat(),
                'day_name': DAY_NAMES[i],
                'total': float(day_total),
                'count': day_count,
                'top_product': {
                    'name': day_top['product__name'],
                    'units': day_top['units'],
                    'revenue': float(day_top['revenue']),
                } if day_top else None,
            })

        prev_start = week_start - timedelta(days=7)
        prev_total = Sale.objects.filter(
            created_at__range=(prev_start, week_start),
            status='COMPLETED'
        ).aggregate(total=Sum('total'))['total'] or Decimal('0.00')

        if prev_total > 0:
            change_vs_last_week = round(float(((total_week - prev_total) / prev_total) * 100), 1)
        elif total_week > 0:
            change_vs_last_week = 100.0
        else:
            change_vs_last_week = 0.0

        avg_per_day = float(total_week / 7)

        week_sales = Sale.objects.filter(
            created_at__range=(week_start, week_end),
            status='COMPLETED'
        )

        top_product = SaleItem.objects.filter(
            sale__in=week_sales
        ).values('product').annotate(
            units_sold=Sum('quantity'),
            revenue=Sum('subtotal')
        ).order_by('-units_sold').first()

        fiado_total = Client.objects.aggregate(total=Sum('current_debt'))['total'] or Decimal('0.00')
        fiado_client_count = Client.objects.filter(current_debt__gt=0).count()

        if top_product:
            product = Product.objects.get(id=top_product['product'])
            top_product_data = {
                'name': product.name,
                'units_sold': top_product['units_sold'],
                'revenue': float(top_product['revenue']),
                'image': request.build_absolute_uri(product.image.url) if product.image else None,
            }
        else:
            top_product_data = None

        total_profit = Decimal('0.00')
        for sale in week_sales:
            items = SaleItem.objects.filter(sale=sale).select_related('product')
            for item in items:
                cost = item.product.cost if item.product.cost else Decimal('0')
                profit = (item.unit_price - cost) * item.quantity
                total_profit += profit

        profit_margin = (total_profit / total_week * 100) if total_week > 0 else Decimal('0')

        week_expenses = Expense.objects.filter(
            date__range=(monday, monday + timedelta(days=7))
        )
        expenses_total = week_expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        return Response({
            'week_days': week_days,
            'summary': {
                'total_week': float(total_week),
                'change_vs_last_week': change_vs_last_week,
                'avg_per_day': avg_per_day,
            },
            'fiado_pending': {
                'total': float(fiado_total),
                'client_count': fiado_client_count,
            },
            'top_product': top_product_data,
            'profit': float(total_profit),
            'profit_margin': float(profit_margin),
            'expenses_total': float(expenses_total),
        })


class RecentActivityView(APIView):
    def get(self, request):
        try:
            limit = int(request.query_params.get('limit', 10))
        except (ValueError, TypeError):
            limit = 10
        limit = min(limit, 50)

        sales = Sale.objects.filter(
            status='COMPLETED'
        ).select_related('client').order_by('-created_at')[:limit]

        payments = FiadoPayment.objects.select_related('client').order_by('-date')[:limit]

        STATUS_MAP = {
            'COMPLETED': 'Completado',
            'PENDING': 'Pendiente',
            'CANCELLED': 'Cancelado',
        }

        sale_items = []
        for s in sales:
            created = timezone.localtime(s.created_at)
            sale_items.append({
                'id': s.id,
                'concept': 'Venta',
                'client_name': s.client.name if s.client else '—',
                'type': s.payment_method,
                'amount': f"{s.total:.2f}",
                'status': STATUS_MAP.get(s.status, s.status),
                'date': created.strftime('%Y-%m-%d'),
                'time': created.strftime('%H:%M'),
                '_sort': created,
            })

        payment_items = []
        for p in payments:
            p_date = timezone.localtime(p.date)
            payment_items.append({
                'id': p.id,
                'concept': 'Pago Fiado',
                'client_name': p.client.name if p.client else '—',
                'type': 'PAYMENT',
                'amount': f"{p.amount:.2f}",
                'status': 'Registrado',
                'date': p_date.strftime('%Y-%m-%d'),
                'time': p_date.strftime('%H:%M'),
                '_sort': p_date,
            })

        combined = sorted(
            chain(sale_items, payment_items),
            key=lambda x: x['_sort'],
            reverse=True
        )[:limit]

        for item in combined:
            del item['_sort']

        return Response(combined)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {'detail': 'old_password y new_password son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(old_password):
            return Response(
                {'detail': 'La contraseña actual no es correcta'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8:
            return Response(
                {'detail': 'La nueva contraseña debe tener al menos 8 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response({'detail': 'Contraseña actualizada correctamente'})


from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, numbers


def _build_xlsx_response(filename: str, headers: list[str], rows: list[list]):
    """Helper que construye un XLSX estilizado y devuelve un HttpResponse."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Datos"

    # ── Estilos ──────────────────────────────────────────
    header_font = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
    header_fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center")
    cell_font = Font(name="Calibri", size=11)
    cell_alignment = Alignment(vertical="center")
    thin_border = Border(
        left=Side(style="thin", color="D1D5DB"),
        right=Side(style="thin", color="D1D5DB"),
        top=Side(style="thin", color="D1D5DB"),
        bottom=Side(style="thin", color="D1D5DB"),
    )

    # ── Header ─────────────────────────────────────────
    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = thin_border

    # ── Filas ──────────────────────────────────────────
    for row_idx, row_data in enumerate(rows, 2):
        for col_idx, value in enumerate(row_data, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.font = cell_font
            cell.alignment = cell_alignment
            cell.border = thin_border

    # ── Ancho automático (con un límite razonable) ─────
    for col_cells in ws.columns:
        max_len = 0
        col_letter = col_cells[0].column_letter
        for cell in col_cells:
            try:
                length = len(str(cell.value or ""))
                if length > max_len:
                    max_len = length
            except Exception:
                pass
        ws.column_dimensions[col_letter].width = min(max_len + 3, 50)

    # ── Freeze pane ────────────────────────────────────
    ws.freeze_panes = "A2"

    # ── Response ───────────────────────────────────────
    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    wb.save(response)
    return response


class ExportClientsView(APIView):
    def get(self, request):
        headers = [
            "ID", "Nombre", "Teléfono", "Email", "Dirección",
            "Límite de Crédito", "Deuda Actual", "Creado",
        ]
        rows = [
            [
                c.id, c.name, c.phone or "", c.email or "", c.address or "",
                c.credit_limit, c.current_debt,
                c.created_at.strftime("%d/%m/%Y") if c.created_at else "",
            ]
            for c in Client.objects.all()
        ]
        return _build_xlsx_response("clientes.xlsx", headers, rows)


class ExportProductsView(APIView):
    def get(self, request):
        headers = [
            "ID", "Nombre", "Categoría", "Precio", "Costo",
            "Stock", "Stock Mínimo", "Código de Barras", "Creado",
        ]
        rows = [
            [
                p.id, p.name, p.category.name if p.category else "",
                p.price, p.cost, p.stock, p.min_stock,
                p.barcode or "",
                p.created_at.strftime("%d/%m/%Y") if p.created_at else "",
            ]
            for p in Product.objects.select_related("category").all()
        ]
        return _build_xlsx_response("productos.xlsx", headers, rows)


class ExportSalesView(APIView):
    def get(self, request):
        headers = [
            "ID", "Cliente", "Fecha", "Hora", "Método de Pago",
            "Estado", "Total", "Notas",
        ]
        rows = [
            [
                s.id,
                s.client.name if s.client else "—",
                timezone.localtime(s.created_at).strftime("%d/%m/%Y"),
                timezone.localtime(s.created_at).strftime("%I:%M %p"),
                "Efectivo" if s.payment_method == "CASH" else "Fiado",
                dict(Sale.Status.choices).get(s.status, s.status),
                s.total,
                s.notes or "",
            ]
            for s in Sale.objects.select_related("client").all()
        ]
        return _build_xlsx_response("ventas.xlsx", headers, rows)