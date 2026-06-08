# Generated manually — fix products with empty string barcode that violate UNIQUE constraint
# When the frontend sends barcode="" for products with barcode=NULL, Django stores ""
# instead of NULL, breaking the UNIQUE constraint for subsequent edits.
# This migration converts "" back to NULL for all products.

from django.db import migrations
from django.db.models import Value


def fix_empty_barcodes(apps, schema_editor):
    Product = apps.get_model('coreApp', 'Product')
    # SQLite treats '' and NULL differently in UNIQUE constraints.
    # Convert all empty-string barcodes back to proper NULL.
    Product.objects.filter(barcode='').update(barcode=None)


class Migration(migrations.Migration):

    dependencies = [
        ('coreApp', '0002_alter_product_image'),
    ]

    operations = [
        migrations.RunPython(fix_empty_barcodes, reverse_code=migrations.RunPython.noop),
    ]
