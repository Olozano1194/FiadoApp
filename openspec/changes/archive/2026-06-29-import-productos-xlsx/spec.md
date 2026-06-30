# Spec: Importación Masiva de Productos desde XLSX

## Resumen

Agregar importación masiva de productos vía XLSX con matching por ID→barcode→nombre+categoría, creación automática de categorías, validación por fila, y reporte de resultados. Incluye endpoint de descarga de plantilla.

---

## Domain: Product Import

### Requirement: Import Endpoint

The system SHALL expose `POST /api/import/products/` accepting `multipart/form-data` with a `file` field containing an `.xlsx` file.

#### Scenario: Valid file processed successfully

- GIVEN a valid `.xlsx` file with 3 rows of new products
- WHEN the user POSTs the file
- THEN the system returns 200 with JSON `{ created: 3, updated: 0, errors: [] }`

#### Scenario: Empty file rejected

- GIVEN an `.xlsx` file with headers only (no data rows)
- WHEN the user POSTs the file
- THEN the system returns 400 with error `"El archivo no contiene datos"`

#### Scenario: Non-XLSX format rejected

- GIVEN a `.csv` file renamed to `.xlsx`
- WHEN the user POSTs the file
- THEN the system returns 400 with error about invalid format

### Requirement: XLSX Column Mapping

The system SHALL accept columns in any order. Required: `Nombre`, `Precio Venta`. Optional: `ID`, `Categoría`, `Costo`, `Stock`, `Stock Mínimo`, `Código Barras`, `Descripción`. Extra columns ignored without error.

#### Scenario: Missing required column

- GIVEN an XLSX missing the `Precio Venta` column
- WHEN the user POSTs the file
- THEN the system returns 400 listing missing required columns

#### Scenario: Extra columns tolerated

- GIVEN an XLSX with `Nombre`, `Precio Venta`, `ColumnaExtra`
- WHEN the system processes the file
- THEN processing proceeds normally, `ColumnaExtra` is ignored

### Requirement: Field Validation

The system SHALL validate each row's fields before processing.

| Field | Rule |
|-------|------|
| Nombre | Required, non-empty, max 200 chars |
| Precio Venta | Required, positive number |
| Costo | Optional, number >= 0, default 0 |
| Stock | Optional, integer >= 0, default 0 |
| Stock Mínimo | Optional, integer >= 0, default 10 |
| Código Barras | Optional, string, max 100 chars |
| Descripción | Optional, string |

#### Scenario: Invalid price in one row

- GIVEN a file with row 1 valid, row 2 with `Precio Venta = -5`
- WHEN the system processes the file
- THEN row 1 is created, row 2 reports error `"Precio Venta debe ser un número positivo"`

#### Scenario: Empty product name

- GIVEN a row where `Nombre` is blank
- WHEN the system processes the file
- THEN that row reports error `"Nombre es requerido"`

### Requirement: Product Matching

The system SHALL match incoming rows using priority: (1) ID → find by PK, update if found, error if not; (2) Barcode → find by barcode, update if found; (3) Name + Category → find by name (case-insensitive) + category, update if found; (4) No match → create new product.

#### Scenario: Update by ID

- GIVEN product ID=5 exists
- WHEN a row has `ID=5` with updated price
- THEN the product is updated, response includes `updated: 1`

#### Scenario: Update by barcode

- GIVEN product with barcode "123456" (ID=10) exists
- WHEN a row has `Código Barras=123456`, no ID
- THEN product ID=10 is updated

#### Scenario: Create new product

- GIVEN no product matches the row's ID, barcode, or name+category
- WHEN the system processes the row
- THEN a new product is created

#### Scenario: ID not found

- GIVEN no product with ID=999
- WHEN a row has `ID=999`
- THEN that row reports error `"Producto con ID 999 no encontrado"`

### Requirement: Category Auto-Creation

The system SHALL automatically create categories that do not exist via `Category.objects.get_or_create(name=...)`.

#### Scenario: New category created

- GIVEN no category "Lácteos" exists
- WHEN a row has `Categoría=Lácteos`
- THEN a new Category is created and assigned

#### Scenario: Existing category reused

- GIVEN category "Bebidas" exists
- WHEN a row has `Categoría=Bebidas`
- THEN the existing category is assigned, no duplicate

### Requirement: Barcode Duplicate Detection Within File

The system SHALL detect duplicate barcodes within the same XLSX and report errors on BOTH duplicate rows. Neither row is created or updated.

#### Scenario: Two rows share same barcode

- GIVEN rows 3 and 7 both have `Código Barras=ABC123`
- WHEN the system processes the file
- THEN both rows report error `"Código Barras duplicado en el archivo"`

### Requirement: Error Accumulation

The system SHALL process all rows even when errors occur. Errors SHALL NOT halt the batch.

#### Scenario: Multiple errors across rows

- GIVEN a 10-row file, rows 2, 5, 8 have errors
- WHEN the system processes the file
- THEN rows 1,3,4,6,7,9,10 are processed; response has 3 error entries

### Requirement: Frontend Import Flow

The SettingsPage SHALL show "Importar Productos (XLSX)" button. Click opens hidden `.xlsx` file input. On selection, confirmation modal shows filename. On confirm, POST via FormData with loading indicator. On response, toast shows summary. If errors, expandible detail section.

#### Scenario: Successful import toast

- GIVEN user selects valid `.xlsx` and confirms
- WHEN POST returns `{ created: 5, updated: 2, errors: [] }`
- THEN toast displays `"Creados: 5 | Actualizados: 2 | Errores: 0"`

#### Scenario: Import with errors shows detail

- GIVEN POST returns errors for 2 rows
- WHEN response received
- THEN toast shows summary and expandible section lists each error with row + message

---

## Domain: Data Export

### Requirement: Template Download Endpoint

The system SHALL expose `GET /api/import/products/template/` returning `.xlsx` with header row only: `ID`, `Nombre`, `Categoría`, `Precio Venta`, `Costo`, `Stock`, `Stock Mínimo`, `Código Barras`, `Descripción`. Styled: header bg #003527, white bold, auto-width, freeze A2.

#### Scenario: Download template

- GIVEN the user requests the template
- WHEN GET `/api/import/products/template/` is called
- THEN response is `.xlsx` with 9 header columns, no data rows

### Requirement: Product Export

The system SHALL expose `GET /api/export/products/` returning all products as styled `.xlsx` matching template column format.

#### Scenario: Export existing products

- GIVEN 15 products exist
- WHEN user requests product export
- THEN `.xlsx` returned with 15 data rows + header

### Requirement: Styled XLSX Response

All XLSX exports/templates SHALL use `_build_xlsx_response` for consistent styling: header bg #003527, white bold, auto-width, freeze A2.

#### Scenario: Consistent styling

- GIVEN any export or template endpoint
- WHEN XLSX is generated
- THEN headers have bg #003527, white bold font, auto-sized columns, freeze A2
