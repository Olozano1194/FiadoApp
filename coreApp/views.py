from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, F
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
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
        sales = Sale.objects.filter(status='COMPLETED').order_by('-created_at')[:limit]
        serializer = self.get_serializer(sales, many=True)
        data = []
        for sale in serializer.data:
            data.append({
                'id': sale['id'],
                'cliente': sale.get('client_name', '—'),
                'hora': timezone.localtime(sale['created_at']).strftime('%I:%M %p'),
                'estado': {
                    'COMPLETED': 'Completada',
                    'PENDING': 'Pendiente',
                    'CANCELLED': 'Cancelada'
                }.get(sale['status'], sale['status']),
                'total': f"{sale['total']:.2f}"
            })
        return Response(data)


class FiadoPaymentViewSet(viewsets.ModelViewSet):
    queryset = FiadoPayment.objects.all()
    serializer_class = FiadoPaymentSerializer


class DashboardStatsView(APIView):
    def get(self, request):
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)

        ventas_hoy = Sale.objects.filter(
            created_at__date=today,
            status='COMPLETED'
        ).aggregate(total=Sum('total'))['total'] or Decimal('0.00')

        ventas_ayer = Sale.objects.filter(
            created_at__date=yesterday,
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
