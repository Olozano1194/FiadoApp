from django.contrib import admin
from .models import Category, Product, Client, Sale, SaleItem, FiadoPayment, CashClosure, Expense, StoreConfig


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


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['date', 'category', 'description', 'amount', 'created_at']
    list_filter = ['category', 'date']
    search_fields = ['description']


@admin.register(CashClosure)
class CashClosureAdmin(admin.ModelAdmin):
    list_display = ['date', 'total_sales', 'expected_cash', 'counted_cash', 'discrepancy', 'created_by', 'created_at']
    search_fields = ['date']
    list_filter = ['date']


@admin.register(StoreConfig)
class StoreConfigAdmin(admin.ModelAdmin):
    list_display = ['store_name']
