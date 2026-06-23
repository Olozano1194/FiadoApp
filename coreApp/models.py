from django.conf import settings
from django.db import models
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=10)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products'
    )
    barcode = models.CharField(max_length=100, unique=True, null=True, blank=True)
    image = models.ImageField(upload_to='productos/', max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Client(models.Model):
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    current_debt = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Sale(models.Model):
    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Efectivo'
        CREDIT = 'CREDIT', 'Fiado'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pendiente'
        COMPLETED = 'COMPLETED', 'Completada'
        CANCELLED = 'CANCELLED', 'Cancelada'

    client = models.ForeignKey(
        Client, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(
        max_length=10, choices=PaymentMethod.choices, default=PaymentMethod.CASH
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.COMPLETED
    )
    notes = models.TextField(blank=True, null=True)
    cash_received = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    change_given = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"Venta #{self.id} - {self.created_at.strftime('%d/%m/%Y')}"


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='sale_items')
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"


class FiadoPayment(models.Model):
    client = models.ForeignKey(
        Client, on_delete=models.CASCADE, related_name='payments', null=True, blank=True
    )
    sale = models.ForeignKey(
        Sale, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Pago ${self.amount} - {self.date.strftime('%d/%m/%Y')}"


class Expense(models.Model):
    class Category(models.TextChoices):
        RENT = 'RENT', 'Alquiler'
        SERVICES = 'SERVICES', 'Servicios'
        INVENTORY = 'INVENTORY', 'Reposición de Inventario'
        SALARY = 'SALARY', 'Sueldos'
        TAXES = 'TAXES', 'Impuestos'
        MARKETING = 'MARKETING', 'Marketing'
        MAINTENANCE = 'MAINTENANCE', 'Mantenimiento'
        OTHER = 'OTHER', 'Varios'

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=Category.choices)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.get_category_display()} - ${self.amount}"


class BackupConfig(models.Model):
    enabled = models.BooleanField(default=True)
    frequency_hours = models.IntegerField(default=24)
    max_backups = models.IntegerField(default=10)
    last_backup = models.DateTimeField(null=True, blank=True)
    backup_folder = models.CharField(max_length=512, default="")
    supabase_enabled = models.BooleanField(default=False)
    supabase_bucket = models.CharField(max_length=128, default='fiadoapp-backups')
    installation_uuid = models.CharField(max_length=36, unique=True, blank=True, default='')
    max_remote_backups = models.PositiveIntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuración de Backup"
        verbose_name_plural = "Configuración de Backup"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_singleton(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f"BackupConfig (enabled={self.enabled})"


class CashClosure(models.Model):
    date = models.DateField(unique=True, default=timezone.localdate)
    total_sales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cash_sales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    credit_sales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sales_count = models.IntegerField(default=0)
    fiado_payments = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    expenses = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_profit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    expected_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    counted_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discrepancy = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        verbose_name = "Cierre de Caja"
        verbose_name_plural = "Cierres de Caja"

    def __str__(self):
        return f"Cierre {self.date} — Efectivo: ${self.counted_cash}"
