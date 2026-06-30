# Product Import Specification

## Purpose

Bulk import/update products from XLSX files via a POST endpoint, with row-level matching, validation, category auto-creation, and structured result reporting.

## Requirements

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

The system SHALL accept columns in any order. Required columns: `Nombre`, `Precio Venta`. Optional: `ID`, `Categoría`, `Costo`, `Stock`, `Stock Mínimo`, `Código Barras`, `Descripción`. Extra columns SHALL be ignored without error.

#### Scenario: Missing required column

- GIVEN an XLSX missing the `Precio Venta` column
- WHEN the user POSTs the file
- THEN the system returns 400 with error listing the missing required columns

#### Scenario: Extra columns tolerated

- GIVEN an XLSX with columns `Nombre`, `Precio Venta`, `ColumnaExtra`
- WHEN the user POSTs the file
- THEN the file processes normally, ignoring `ColumnaExtra`

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

- GIVEN a file with row 1 valid and row 2 with `Precio Venta = -5`
- WHEN the system processes the file
- THEN row 1 is created, row 2 reports error `"Precio Venta debe ser un número positivo"`, and the response includes `errors: [{ row: 2, message: "..." }]`

#### Scenario: Empty product name

- GIVEN a row where `Nombre` is blank
- WHEN the system processes the file
- THEN that row reports error `"Nombre es requerido"`

### Requirement: Product Matching

The system SHALL match incoming rows to existing products using this priority:

1. **ID provided** → find by PK. If found → update. If not found → report error.
2. **Barcode provided** → find by barcode. If found → update that product.
3. **Name + Category** → find by name (case-insensitive) and category. If found → update.
4. **No match** → create new product.

#### Scenario: Update by ID

- GIVEN a product with ID=5 exists in BD
- WHEN a row has `ID=5` with updated price
- THEN the product is updated, response includes `updated: 1`

#### Scenario: Update by barcode

- GIVEN a product with barcode "123456" exists (ID=10)
- WHEN a row has `Código Barras=123456` and no ID
- THEN product ID=10 is updated

#### Scenario: Create new product

- GIVEN no product matches the row's ID, barcode, or name+category
- WHEN the system processes the row
- THEN a new product is created with the provided fields

#### Scenario: ID not found in database

- GIVEN no product with ID=999 exists
- WHEN a row has `ID=999`
- THEN that row reports error `"Producto con ID 999 no encontrado"`

### Requirement: Category Auto-Creation

The system SHALL automatically create categories that do not exist in the database.

#### Scenario: New category created

- GIVEN no category named "Lácteos" exists
- WHEN a row has `Categoría=Lácteos`
- THEN a new Category is created and assigned to the product

#### Scenario: Existing category reused

- GIVEN a category "Bebidas" exists
- WHEN a row has `Categoría=Bebidas`
- THEN the existing category is assigned, no duplicate created

### Requirement: Barcode Duplicate Detection Within File

The system SHALL detect duplicate barcodes within the same XLSX file and report errors on BOTH duplicate rows.

#### Scenario: Two rows share same barcode

- GIVEN rows 3 and 7 both have `Código Barras=ABC123`
- WHEN the system processes the file
- THEN both rows 3 and 7 report error `"Código Barras duplicado en el archivo"`, neither is created/updated

### Requirement: Error Accumulation

The system SHALL process all rows even when errors occur. Errors SHALL NOT halt the batch. The response SHALL list all errors with row number and message.

#### Scenario: Multiple errors across rows

- GIVEN a file with 10 rows, rows 2, 5, and 8 have validation errors
- WHEN the system processes the file
- THEN rows 1,3,4,6,7,9,10 are processed, response has `errors` array with 3 entries

### Requirement: Frontend Import Flow

The SettingsPage SHALL display an "Importar Productos (XLSX)" button. Clicking it opens a hidden file input for `.xlsx`. On file selection, a confirmation modal shows the filename. On confirm, the file is POSTed via FormData with a loading indicator. On response, a toast shows the summary. If errors exist, an expandible detail section lists them.

#### Scenario: Successful import shows toast

- GIVEN the user selects a valid `.xlsx` and confirms
- WHEN the POST returns `{ created: 5, updated: 2, errors: [] }`
- THEN a toast displays `"Creados: 5 | Actualizados: 2 | Errores: 0"`

#### Scenario: Import with errors shows detail

- GIVEN the POST returns errors for 2 rows
- WHEN the response is received
- THEN the toast shows summary and an expandible section lists each error with row number and message
