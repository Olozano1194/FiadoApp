# Design: Importación Masiva de Productos desde XLSX

## Technical Approach

Backend receives `.xlsx` via `multipart/form-data`, parses rows with openpyxl, matches products using a priority chain (ID → barcode → name+category → create), auto-creates categories, accumulates per-row errors, and returns `{ created, updated, errors }`. A separate template endpoint returns styled headers-only `.xlsx`. Frontend adds a button+modal to SettingsPage reusing the existing confirm-modal pattern from backup restore.

## Architecture Decisions

### Decision: New file `imports.py` instead of extending `exports.py`

**Choice**: Create `coreApp/views/imports.py` with both `ImportProductsView` and `ImportProductsTemplateView`.

**Alternatives**: Add to existing `exports.py` (already 150 lines).

**Rationale**: Imports have different concerns (file upload, validation, matching, error accumulation) vs exports (query → Workbook → response). Separation keeps each file focused. Follows same pattern as `backup.py` (separate from exports).

### Decision: Pre-scan barcodes for in-file duplicate detection

**Choice**: Collect all barcodes from rows into a dict with row indices before processing. Mark both rows as error if duplicate found.

**Alternatives**: Skip in-file detection, let DB unique constraint fail.

**Rationale**: DB constraint gives cryptic error. Pre-scan provides clear "Código Barras duplicado en el archivo" message per spec, and prevents partial processing of conflicting rows.

### Decision: Reuse existing confirm-modal pattern (no new component)

**Choice**: Use the same inline modal pattern already in SettingsPage (lines 424-450).

**Alternatives**: Create a reusable `<ConfirmModal>` component.

**Rationale**: The pattern is 3 lines of JSX. Extracting to a component is premature for this feature. Follows existing codebase convention where each section manages its own modal state.

### Decision: Template endpoint returns headers-only XLSX (no data)

**Choice**: `GET /api/import/products/template/` returns only the header row.

**Alternatives**: Include example rows or empty data rows.

**Rationale**: Spec explicitly requires headers only. Cleanest for user: download → fill → upload.

## Data Flow

```
SettingsPage
  ├─ Click "Importar Productos" → hidden <input type="file" accept=".xlsx"> triggers
  ├─ File selected → set showImportModal(true)
  └─ Confirm → POST FormData → loading → toast(response)

POST /api/import/products/
  ├─ Validate: file exists? Is .xlsx? Has required columns?
  ├─ Pre-scan: collect barcodes, detect in-file duplicates
  ├─ For each row:
  │   ├─ Validate fields (Nombre, Precio Venta, types)
  │   ├─ Match: ID? → Product.objects.get(pk=...) → update or error
  │   ├─ Match: barcode? → Product.objects.filter(barcode=...) → update
  │   ├─ Match: name+category? → Product.objects.filter(name__iexact=...) → update
  │   └─ No match → Category.get_or_create() → Product.objects.create()
  └─ Return { created, updated, errors }

GET /api/import/products/template/
  └─ Build Workbook with 9 headers only → _build_xlsx_response
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `coreApp/views/imports.py` | Create | `ImportProductsView` (POST) + `ImportProductsTemplateView` (GET) |
| `coreApp/views/__init__.py` | Modify | Add imports and `__all__` entries |
| `coreApp/urls.py` | Modify | Add 2 routes under `api/import/` |
| `frontend/src/api/settings.api.ts` | Modify | Add `importProducts()` and `downloadImportTemplate()` |
| `frontend/src/pages/SettingsPage.tsx` | Modify | Add import section with button, hidden file input, modal, loading |

## Interfaces / Contracts

### POST /api/import/products/

**Content-Type**: `multipart/form-data` (field `file`, `.xlsx`)
**Auth**: `IsAuthenticated`

**Request**: FormData with single field `file`

**Response 200**:
```json
{
  "created": 5,
  "updated": 3,
  "errors": [
    {"row": 4, "message": "Precio Venta debe ser un número positivo"},
    {"row": 7, "message": "Código Barras duplicado en el archivo"}
  ]
}
```

**Response 400** (validation failures):
```json
{"detail": "El archivo no contiene datos"}
{"detail": "Formato inválido — se espera un archivo .xlsx"}
{"detail": "Faltan columnas requeridas: Precio Venta, Nombre"}
```

### GET /api/import/products/template/

**Auth**: `IsAuthenticated`
**Response**: `.xlsx` file with 9 header columns, no data rows. Styled via `_build_xlsx_response`.

### Internal: Column mapping constant

```python
IMPORT_COLUMNS = {
    "required": ["Nombre", "Precio Venta"],
    "optional": ["ID", "Categoría", "Costo", "Stock", "Stock Mínimo", "Código Barras", "Descripción"],
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `_validate_row()`, `_match_product()`, `_detect_duplicate_barcodes()` | Standalone functions with mock data |
| Integration | `POST /import/products/` with various XLSX shapes | Django test client + openpyxl Workbook creation |
| Integration | `GET /import/products/template/` | Django test client, verify headers + 0 data rows |
| E2E | Full import flow | Select file → confirm → verify DB + toast |

## Migration / Rollout

No migration required. Purely additive change — new views, new endpoints, new frontend section. No model changes.

## Open Questions

None — all design decisions resolved based on spec, proposal, and codebase analysis.
