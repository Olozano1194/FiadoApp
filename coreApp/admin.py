from django.contrib import admin
from .models import Category, Product, Client, Sale, SaleItem, FiadoPayment


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'stock', 'min_stock', 'category']
    list_filter = ['category']
    search_fields = ['name', 'barcode']


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'credit_limit', 'current_debt']
    search_fields = ['name', 'phone']


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'total', 'payment_method', 'status', 'created_at']
    list_filter = ['status', 'payment_method']


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ['sale', 'product', 'quantity', 'unit_price', 'subtotal']


@admin.register(FiadoPayment)
class FiadoPaymentAdmin(admin.ModelAdmin):
    list_display = ['client', 'amount', 'date']
    list_filter = ['date']
