from collections import Counter
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Category, Product, Client, Sale, SaleItem, FiadoPayment


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

            if sale.payment_method == 'CREDIT' and sale.client:
                client = sale.client
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