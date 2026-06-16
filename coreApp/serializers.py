from collections import Counter
from datetime import datetime, timedelta
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Category, Product, Client, Sale, SaleItem, FiadoPayment, Expense, CashClosure


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        return token


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at',)

    def get_is_low_stock(self, obj):
        return obj.stock < obj.min_stock


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ('current_debt',)


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SaleItem
        fields = '__all__'
        read_only_fields = ['sale', 'subtotal']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True, default='—')

    class Meta:
        model = Sale
        fields = '__all__'


class SaleCreateSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)

    class Meta:
        model = Sale
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items')

        with transaction.atomic():
            sale = Sale.objects.create(**validated_data)

            # items_data has product as Product instance (resolved by PrimaryKeyRelatedField)
            product_ids = [item['product'].id for item in items_data]
            products = Product.objects.select_for_update().filter(id__in=product_ids)
            product_map = {p.id: p for p in products}

            # Validar stock contra cantidad TOTAL por producto
            # (evita bypass si el mismo producto se agrega 2 veces al carrito)
            product_counts = Counter(item['product'].id for item in items_data)
            for product_id, total_qty in product_counts.items():
                product = product_map.get(product_id)
                if not product:
                    raise serializers.ValidationError(
                        {'items': f"Product {product_id} not found"}
                    )
                if product.stock < total_qty:
                    raise serializers.ValidationError(
                        {'items': f"Insufficient stock for {product.name}: "
                                  f"{product.stock} available, {total_qty} requested"}
                    )

            for item in items_data:
                product = product_map[item['product'].id]
                subtotal = item['quantity'] * item['unit_price']
                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=item['quantity'],
                    unit_price=item['unit_price'],
                    subtotal=subtotal,
                )
                product.stock -= item['quantity']
                product.save(update_fields=['stock'])

            if sale.payment_method == 'CREDIT' and sale.client_id:
                client = Client.objects.select_for_update().get(pk=sale.client_id)
                if client.current_debt + sale.total > client.credit_limit:
                    raise serializers.ValidationError(
                        f"El cliente ha excedido su límite de crédito. "
                        f"Deuda actual: {client.current_debt}, "
                        f"Límite: {client.credit_limit}, "
                        f"Total venta: {sale.total}"
                    )
                client.current_debt += sale.total
                client.save(update_fields=['current_debt'])

        return sale


class FiadoPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FiadoPayment
        fields = '__all__'
        read_only_fields = ('date',)


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('created_at',)


class CashClosureSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashClosure
        fields = '__all__'
        read_only_fields = (
            'id', 'date',
            'total_sales', 'cash_sales', 'credit_sales', 'sales_count',
            'fiado_payments', 'expenses', 'net_profit',
            'expected_cash', 'discrepancy',
            'created_by', 'created_at',
        )


class CashClosureCreateSerializer(serializers.Serializer):
    counted_cash = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    notes = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        today = timezone.localdate()
        today_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        today_end = today_start + timedelta(days=1)

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
        counted_cash = validated_data['counted_cash']
        discrepancy = counted_cash - expected_cash

        closure, _ = CashClosure.objects.update_or_create(
            date=today,
            defaults={
                'total_sales': total_sales,
                'cash_sales': cash_sales,
                'credit_sales': credit_sales,
                'sales_count': sales_count,
                'fiado_payments': fiado_payments,
                'expenses': expenses,
                'net_profit': net_profit,
                'expected_cash': expected_cash,
                'counted_cash': counted_cash,
                'discrepancy': discrepancy,
                'notes': validated_data.get('notes', ''),
                'created_by': validated_data.get('created_by'),
            },
        )
        return closure