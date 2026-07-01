import io
import os
import tempfile

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from openpyxl import Workbook
from rest_framework.test import APIClient

from coreApp.models import Category, Product


def _build_xlsx(headers, rows):
    """Create an in-memory .xlsx workbook and return a SimpleUploadedFile."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Productos"
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return SimpleUploadedFile(
        "test_import.xlsx", buf.read(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


class ImportBaseTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="testuser", password="testpass"
        )
        cls.category = Category.objects.create(name="Bebidas")

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _post(self, xlsx_file, preview=False):
        url = "/api/import/products/"
        if preview:
            url += "?preview=true"
        return self.client.post(url, {"file": xlsx_file}, format="multipart")


class ImportProductsTest(ImportBaseTest):
    def test_import_creates_products(self):
        headers = ["Nombre", "Precio Venta", "Categoría", "Stock"]
        rows = [
            ["Gaseosa Cola", "2500", "Bebidas", "10"],
            ["Jugo Naranja", "3000", "Bebidas", "5"],
        ]
        response = self._post(_build_xlsx(headers, rows))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["created"], 2)
        self.assertEqual(response.data["updated"], 0)
        self.assertEqual(Product.objects.count(), 2)

    def test_import_updates_existing_product(self):
        Product.objects.create(
            name="Gaseosa Cola", price=2000, category=self.category
        )
        headers = ["Nombre", "Precio Venta"]
        rows = [["Gaseosa Cola", "3000"]]
        response = self._post(_build_xlsx(headers, rows))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["updated"], 1)
        self.assertEqual(response.data["created"], 0)
        product = Product.objects.get(name="Gaseosa Cola")
        self.assertEqual(product.price, 3000)

    def test_import_matches_by_barcode(self):
        Product.objects.create(
            name="Gaseosa Cola",
            price=2000,
            barcode="7701234567890",
            category=self.category,
        )
        headers = ["Nombre", "Precio Venta", "Código Barras"]
        rows = [["Coca-Cola", "3500", "7701234567890"]]
        response = self._post(_build_xlsx(headers, rows))
        self.assertEqual(response.data["updated"], 1)
        product = Product.objects.get(barcode="7701234567890")
        self.assertEqual(product.name, "Coca-Cola")

    def test_import_rejects_missing_required_column(self):
        headers = ["Nombre"]  # missing Precio Venta
        rows = [["Test"]]
        response = self._post(_build_xlsx(headers, rows))
        self.assertEqual(response.status_code, 400)
        self.assertIn("Faltan columnas", str(response.data))

    def test_import_rejects_empty_file(self):
        headers = ["Nombre", "Precio Venta"]
        rows = []  # no data rows
        response = self._post(_build_xlsx(headers, rows))
        self.assertEqual(response.status_code, 400)

    def test_import_rejects_invalid_price(self):
        headers = ["Nombre", "Precio Venta"]
        rows = [["Test", "no-es-un-numero"]]
        response = self._post(_build_xlsx(headers, rows))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["errors"]), 1)
        self.assertIn("Precio Venta", response.data["errors"][0]["message"])

    def test_import_rejects_wrong_format(self):
        response = self.client.post(
            "/api/import/products/",
            {"file": io.BytesIO(b"not an excel file")},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Formato inválido", str(response.data))

    def test_import_requires_auth(self):
        self.client.force_authenticate(user=None)
        headers = ["Nombre", "Precio Venta"]
        rows = [["Test", "1000"]]
        response = self._post(_build_xlsx(headers, rows))
        self.assertEqual(response.status_code, 401)


class ImportPreviewTest(ImportBaseTest):
    def test_preview_returns_counts_without_persisting(self):
        headers = ["Nombre", "Precio Venta", "Stock"]
        rows = [
            ["Producto A", "1000", "10"],
            ["Producto B", "2000", "5"],
        ]
        response = self._post(_build_xlsx(headers, rows), preview=True)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("preview"))
        self.assertEqual(response.data["created"], 2)
        self.assertEqual(response.data["updated"], 0)
        self.assertEqual(Product.objects.count(), 0)

    def test_preview_reports_errors_without_persisting(self):
        headers = ["Nombre", "Precio Venta"]
        rows = [
            ["Valid", "1000"],
            ["", "2000"],  # invalid: empty name
        ]
        response = self._post(_build_xlsx(headers, rows), preview=True)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("preview"))
        self.assertEqual(len(response.data["errors"]), 1)
        self.assertEqual(Product.objects.count(), 0)

    def test_preview_does_not_create_categories(self):
        headers = ["Nombre", "Precio Venta", "Categoría"]
        rows = [["Nuevo Prod", "5000", "Categoria Nueva Preview"]]
        response = self._post(_build_xlsx(headers, rows), preview=True)
        self.assertEqual(response.status_code, 200)
        # Categoría no debe crearse en preview
        self.assertFalse(
            Category.objects.filter(name="Categoria Nueva Preview").exists()
        )


class ImportDuplicateBarcodeTest(ImportBaseTest):
    def test_import_reports_duplicate_barcodes(self):
        headers = ["Nombre", "Precio Venta", "Código Barras"]
        rows = [
            ["Producto A", "1000", "7700000000001"],
            ["Producto B", "2000", "7700000000001"],  # duplicate barcode
        ]
        response = self._post(_build_xlsx(headers, rows))
        # Ambas filas tienen el mismo código de barras → ambos reportan error
        self.assertEqual(len(response.data["errors"]), 2)
        self.assertIn("Código Barras duplicado", response.data["errors"][0]["message"])


class ImportTemplateTest(ImportBaseTest):
    def test_template_download_returns_xlsx(self):
        response = self.client.get("/api/import/products/template/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get("Content-Type"),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
