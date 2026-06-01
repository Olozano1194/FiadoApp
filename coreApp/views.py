from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, F
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
from itertools import chain
from .models import Category, Product, Client, Sale, SaleItem, FiadoPayment
from .serializers import (
    CategorySerializer, ProductSerializer, ClientSerializer,
    SaleSerializer, SaleItemSerializer, FiadoPaymentSerializer,
    SaleCreateSerializer
)


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


class DashboardStatsView(APIView):
    def get(self, request):
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)

        today_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        today_end = today_start + timedelta(days=1)
        yesterday_start = timezone.make_aware(datetime.combine(yesterday, datetime.min.time()))
        yesterday_end = yesterday_start + timedelta(days=1)

        ventas_hoy = Sale.objects.filter(
            created_at__range=(today_start, today_end),
            status='COMPLETED'
        ).aggregate(total=Sum('total'))['total'] or Decimal('0.00')

        ventas_ayer = Sale.objects.filter(
            created_at__range=(yesterday_start, yesterday_end),
            status='COMPLETED'
        ).aggregate(total=Sum('total'))['total'] or Decimal('0.00')

        if ventas_ayer > 0:
            cambio = ((ventas_hoy - ventas_ayer) / ventas_ayer) * 100
            cambio_vs_ayer = f"{cambio:+.1f}"
        else:
            cambio_vs_ayer = "0.0"

        fiado_total = Client.objects.aggregate(total=Sum('current_debt'))['total'] or Decimal('0.00')
        clientes_fiado = Client.objects.filter(current_debt__gt=0).count()
        productos_bajo = Product.objects.filter(stock__lt=F('min_stock')).count()

        return Response({
            'ventas_dia': f"{ventas_hoy:.2f}",
            'cambio_vs_ayer': cambio_vs_ayer,
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
        ).values('product__name').annotate(
            units_sold=Sum('quantity'),
            revenue=Sum('subtotal')
        ).order_by('-units_sold').first()

        fiado_total = Client.objects.aggregate(total=Sum('current_debt'))['total'] or Decimal('0.00')
        fiado_client_count = Client.objects.filter(current_debt__gt=0).count()

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
            'top_product': {
                'name': top_product['product__name'],
                'units_sold': top_product['units_sold'],
                'revenue': float(top_product['revenue']),
            } if top_product else None,
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