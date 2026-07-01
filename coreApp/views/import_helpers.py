from collections import defaultdict
from decimal import Decimal, InvalidOperation

from django.db import IntegrityError

from ..models import Category, Product


IMPORT_COLUMNS = {
    "required": ["Nombre", "Precio Venta"],
    "optional": ["ID", "Categoría", "Costo", "Stock", "Stock Mínimo", "Código Barras", "Descripción"],
}


# ---------------------------------------------------------------------------
# Cell extraction helpers
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


# ---------------------------------------------------------------------------
# Row validation
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Product matching
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Barcode duplicate detection
# ---------------------------------------------------------------------------

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
# Extract values + persist
# ---------------------------------------------------------------------------

def _extract_and_persist(row, col_map, product, preview):
    """Extract values from *row* and create or update the product.

    Returns
    -------
    dict
        ``{"action": "created" | "updated" | None, "error": str | None}``
    """
    nombre = _get_str(row, col_map, "Nombre") or ""

    price = _parse_decimal(_get_raw(row, col_map, "Precio Venta")) or Decimal("0")

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

    # Category lookup (preview evita crear categorías nuevas)
    cat_name = _get_str(row, col_map, "Categoría")
    category = None
    if cat_name:
        if preview:
            category = Category.objects.filter(name=cat_name).first()
        else:
            category, _ = Category.objects.get_or_create(name=cat_name)

    if preview:
        return {"action": "updated" if product else "created", "error": None}

    # ---- Persist ----
    try:
        if product is not None:
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
            return {"action": "updated", "error": None}
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
            return {"action": "created", "error": None}
    except IntegrityError:
        return {
            "action": None,
            "error": "Error de base de datos al guardar "
            "el producto (posible código de barras duplicado)",
        }