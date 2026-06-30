import json
import os
import sys
import tempfile
from collections import defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.db import IntegrityError
from openpyxl import load_workbook
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Category, Product
from .helpers import _build_xlsx_response


IMPORT_COLUMNS = {
    "required": ["Nombre", "Precio Venta"],
    "optional": ["ID", "Categoría", "Costo", "Stock", "Stock Mínimo", "Código Barras", "Descripción"],
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_str(row, col_map, key):
    """Extract string value from *row* by column name.

    Returns ``None`` when the column is missing, the index is out of range,
    or the cell is empty/blank.
    """
    idx = col_map.get(key)
    if idx is None or idx >= len(row):
        return None
    val = row[idx]
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


def _get_raw(row, col_map, key):
    """Extract the raw cell value (no transformation)."""
    idx = col_map.get(key)
    if idx is None or idx >= len(row):
        return None
    return row[idx]


def _parse_decimal(value):
    """Try to coerce *value* to ``Decimal``, handling comma as decimal separator."""
    if value is None:
        return None
    try:
        return Decimal(str(value).strip().replace(",", "."))
    except (InvalidOperation, ValueError):
        return None


def _validate_row(row, col_map):
    """Validate a single data row.

    Returns a **list** of error messages (empty when the row is valid).
    """
    errors = []

    # -- Nombre (required, ≤ 200) --
    nombre = _get_str(row, col_map, "Nombre")
    if not nombre:
        errors.append("Nombre es requerido")
    elif len(nombre) > 200:
        errors.append("Nombre no puede tener más de 200 caracteres")

    # -- Precio Venta (required, positive) --
    precio_raw = _get_raw(row, col_map, "Precio Venta")
    if precio_raw is None or str(precio_raw).strip() == "":
        errors.append("Precio Venta es requerido")
    else:
        precio = _parse_decimal(precio_raw)
        if precio is None or precio <= 0:
            errors.append("Precio Venta debe ser un número positivo")

    # -- Costo (optional, ≥ 0) --
    costo_raw = _get_raw(row, col_map, "Costo")
    if costo_raw is not None and str(costo_raw).strip() != "":
        costo = _parse_decimal(costo_raw)
        if costo is None:
            errors.append("Costo debe ser un número válido")
        elif costo < 0:
            errors.append("Costo debe ser un número mayor o igual a 0")

    # -- Stock (optional, integer ≥ 0) --
    stock_raw = _get_raw(row, col_map, "Stock")
    if stock_raw is not None and str(stock_raw).strip() != "":
        try:
            stock = int(Decimal(str(stock_raw).strip()))
            if stock < 0:
                errors.append("Stock debe ser un número entero mayor o igual a 0")
        except (InvalidOperation, ValueError, TypeError):
            errors.append("Stock debe ser un número entero válido")

    # -- Stock Mínimo (optional, integer ≥ 0) --
    ms_raw = _get_raw(row, col_map, "Stock Mínimo")
    if ms_raw is not None and str(ms_raw).strip() != "":
        try:
            ms = int(Decimal(str(ms_raw).strip()))
            if ms < 0:
                errors.append("Stock Mínimo debe ser un número entero mayor o igual a 0")
        except (InvalidOperation, ValueError, TypeError):
            errors.append("Stock Mínimo debe ser un número entero válido")

    # -- Código Barras (optional, ≤ 100) --
    barcode = _get_str(row, col_map, "Código Barras")
    if barcode and len(barcode) > 100:
        errors.append("Código Barras no puede tener más de 100 caracteres")

    return errors


def _match_product(row, col_map):
    """Match product by priority: **ID → barcode → name+category**.

    Returns
    -------
    Product
        The matched product instance.
    None
        No match found — caller should create a new product.
    Raises ``ValueError``
        When *ID* is present in the row but no product with that PK exists.
    """
    # 1. Match by ID
    id_raw = _get_raw(row, col_map, "ID")
    if id_raw is not None and str(id_raw).strip() != "":
        try:
            product_id = int(Decimal(str(id_raw).strip()))
        except (InvalidOperation, ValueError, TypeError):
            raise ValueError(f"ID inválido: {id_raw}")
        try:
            return Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            raise ValueError(f"Producto con ID {product_id} no encontrado")

    # 2. Match by barcode
    barcode = _get_str(row, col_map, "Código Barras")
    if barcode:
        try:
            return Product.objects.get(barcode=barcode)
        except Product.DoesNotExist:
            pass

    # 3. Match by name (case-insensitive) + optional category
    nombre = _get_str(row, col_map, "Nombre")
    if nombre:
        qs = Product.objects.filter(name__iexact=nombre)
        cat_name = _get_str(row, col_map, "Categoría")
        if cat_name:
            qs = qs.filter(category__name__iexact=cat_name)
        try:
            return qs.get()
        except (Product.DoesNotExist, Product.MultipleObjectsReturned):
            pass

    # 4. No match — create new
    return None


def _detect_duplicate_barcodes(rows, col_map):
    """Pre-scan *rows* and return the **0‑based indices** of rows whose
    barcode appears more than once inside the file.

    When the *Código Barras* column is absent an empty set is returned.
    """
    barcode_idx = col_map.get("Código Barras")
    if barcode_idx is None:
        return set()

    barcode_map = defaultdict(list)  # barcode → [row_index, …]
    for i, row in enumerate(rows):
        if barcode_idx < len(row):
            val = row[barcode_idx]
            if val is not None and str(val).strip():
                barcode = str(val).strip()
                barcode_map[barcode].append(i)

    duplicates: set[int] = set()
    for indices in barcode_map.values():
        if len(indices) > 1:
            duplicates.update(indices)
    return duplicates


# ---------------------------------------------------------------------------
# Template View  (GET  /api/import/products/template/)
# ---------------------------------------------------------------------------

class ImportProductsTemplateView(APIView):
    """Download an XLSX template with **default products** from the fixture
    so the user can edit prices, costs, stock, etc. before uploading."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from openpyxl import Workbook

        wb = Workbook()
        ws = wb.active
        ws.title = "Productos"

        headers = [
            "ID",
            "Nombre",
            "Categoría",
            "Precio Venta",
            "Costo",
            "Stock",
            "Stock Mínimo",
            "Código Barras",
            "Descripción",
        ]
        ws.append(headers)

        # ── Load fixture products ──────────────────────────────────────
        # Resolve fixture path (same logic as load_initial_data command)
        if getattr(sys, 'frozen', False):
            fixture_path = Path(sys._MEIPASS) / "coreApp" / "fixtures" / "initial_data.json"
        else:
            # imports.py → coreApp/views/ → coreApp/ → coreApp/fixtures/initial_data.json
            fixture_path = (
                Path(__file__).parent.parent
                / "fixtures"
                / "initial_data.json"
            )

        if fixture_path.exists():
            with open(fixture_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Build category PK → name lookup
            fixture_cats = {
                item["pk"]: item["fields"]["name"]
                for item in data
                if item["model"] == "coreApp.category"
            }

            # Append each fixture product as a row
            for item in data:
                if item["model"] != "coreApp.product":
                    continue
                fields = item["fields"]
                cat_name = fixture_cats.get(fields["category"], "")
                ws.append([
                    "",                              # ID (vacío — se creará nuevo)
                    fields["name"],
                    cat_name,
                    fields["price"],
                    fields.get("cost", "0.00"),
                    fields.get("stock", 0),
                    fields.get("min_stock", 10),
                    fields.get("barcode", ""),
                    fields.get("description", ""),
                ])

        return _build_xlsx_response(wb, "plantilla-productos.xlsx")


# ---------------------------------------------------------------------------
# Import View  (POST  /api/import/products/)
# ---------------------------------------------------------------------------

class ImportProductsView(APIView):
    """Accept an ``.xlsx`` file, match/create products, and report results."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"detail": "No se envió ningún archivo"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not file.name.endswith(".xlsx"):
            return Response(
                {"detail": "Formato inválido — se espera un archivo .xlsx"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Write upload to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
            for chunk in file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        try:
            wb = load_workbook(tmp_path)
            ws = wb.active

            # ---- Read headers → build column map ----
            headers_row = next(ws.iter_rows(min_row=1, max_row=1, values_only=True))
            headers = [str(h).strip() if h is not None else "" for h in headers_row]
            col_map = {h: i for i, h in enumerate(headers) if h}

            # Validate required columns are present
            missing = [c for c in IMPORT_COLUMNS["required"] if c not in col_map]
            if missing:
                return Response(
                    {"detail": f"Faltan columnas requeridas: {', '.join(missing)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Collect data rows (row 2 onward)
            all_rows = list(ws.iter_rows(min_row=2, values_only=True))

            # Reject completely empty file
            has_data = any(any(cell is not None for cell in r) for r in all_rows)
            if not has_data:
                return Response(
                    {"detail": "El archivo no contiene datos"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ---- Pre-scan barcode duplicates ----
            duplicate_indices = _detect_duplicate_barcodes(all_rows, col_map)

            created = 0
            updated = 0
            errors: list[dict] = []

            # ---- Process rows ----
            for i, row in enumerate(all_rows):
                # Silently skip completely empty rows
                if all(cell is None for cell in row):
                    continue

                excel_row = i + 2  # 1‑based; row 1 = header
                row_errors: list[str] = []

                # Duplicate barcode check
                if i in duplicate_indices:
                    row_errors.append("Código Barras duplicado en el archivo")

                # Field validation
                row_errors.extend(_validate_row(row, col_map))

                if row_errors:
                    for msg in row_errors:
                        errors.append({"row": excel_row, "message": msg})
                    continue

                # Match product
                try:
                    product = _match_product(row, col_map)
                except ValueError as exc:
                    errors.append({"row": excel_row, "message": str(exc)})
                    continue

                # ---- Extract values ----
                nombre = _get_str(row, col_map, "Nombre") or ""

                price = _parse_decimal(
                    _get_raw(row, col_map, "Precio Venta")
                ) or Decimal("0")

                costo = Decimal("0")
                costo_raw = _get_raw(row, col_map, "Costo")
                if costo_raw is not None and str(costo_raw).strip():
                    costo = _parse_decimal(costo_raw) or Decimal("0")

                stock = 0
                stock_raw = _get_raw(row, col_map, "Stock")
                if stock_raw is not None and str(stock_raw).strip():
                    try:
                        stock = int(Decimal(str(stock_raw).strip()))
                    except (InvalidOperation, ValueError):
                        stock = 0

                min_stock = 10
                ms_raw = _get_raw(row, col_map, "Stock Mínimo")
                if ms_raw is not None and str(ms_raw).strip():
                    try:
                        min_stock = int(Decimal(str(ms_raw).strip()))
                    except (InvalidOperation, ValueError):
                        min_stock = 10

                barcode = _get_str(row, col_map, "Código Barras")
                descripcion = _get_str(row, col_map, "Descripción") or ""

                # Category auto‑creation
                cat_name = _get_str(row, col_map, "Categoría")
                category = None
                if cat_name:
                    category, _ = Category.objects.get_or_create(name=cat_name)

                # ---- Create or Update ----
                try:
                    if product is not None:
                        # Update existing
                        product.name = nombre
                        product.price = price
                        if "Costo" in col_map:
                            product.cost = costo
                        if "Stock" in col_map:
                            product.stock = stock
                        if "Stock Mínimo" in col_map:
                            product.min_stock = min_stock
                        if "Código Barras" in col_map:
                            product.barcode = barcode
                        if "Descripción" in col_map:
                            product.description = descripcion
                        if "Categoría" in col_map:
                            product.category = category
                        product.save()
                        updated += 1
                    else:
                        Product.objects.create(
                            name=nombre,
                            price=price,
                            cost=costo,
                            stock=stock,
                            min_stock=min_stock,
                            barcode=barcode,
                            description=descripcion,
                            category=category,
                        )
                        created += 1
                except IntegrityError:
                    errors.append(
                        {
                            "row": excel_row,
                            "message": "Error de base de datos al guardar "
                            "el producto (posible código de barras duplicado)",
                        }
                    )

            return Response({"created": created, "updated": updated, "errors": errors})

        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)