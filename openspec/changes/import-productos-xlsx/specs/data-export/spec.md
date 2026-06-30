# Data Export Specification

## Purpose

Export system data as styled XLSX files and provide a blank template for product import.

## Requirements

### Requirement: Template Download Endpoint

The system SHALL expose `GET /api/import/products/template/` returning an `.xlsx` file with header row only (no data). Headers: `ID`, `Nombre`, `Categoría`, `Precio Venta`, `Costo`, `Stock`, `Stock Mínimo`, `Código Barras`, `Descripción`. The file SHALL be styled with header background #003527, white bold text, auto-width columns, and freeze pane at A2.

#### Scenario: Download template

- GIVEN the user requests the template
- WHEN GET `/api/import/products/template/` is called
- THEN the response is an `.xlsx` file with the 9 header columns and no data rows

### Requirement: Product Export

The system SHALL expose `GET /api/export/products/` returning all products as a styled `.xlsx` file with columns matching the template format.

#### Scenario: Export existing products

- GIVEN 15 products exist in the database
- WHEN the user requests product export
- THEN an `.xlsx` is returned with 15 data rows plus the header row

### Requirement: Styled XLSX Response

All XLSX exports and templates SHALL use the shared `_build_xlsx_response` helper for consistent styling: header background #003527, white bold text, auto-width columns, freeze pane at A2.

#### Scenario: Consistent styling across exports

- GIVEN any export or template endpoint
- WHEN the XLSX is generated
- THEN headers have background #003527, white bold font, columns auto-sized, and freeze pane at A2
