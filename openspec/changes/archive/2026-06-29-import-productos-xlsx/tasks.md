# Tasks: Importación Masiva de Productos desde XLSX

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300–420 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Backend) → PR 2 (Frontend) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend: imports.py + routes | PR 1 | Base: main; tests + views + urls |
| 2 | Frontend: API functions + SettingsPage UI | PR 2 | Base: PR 1 branch; depends on PR 1 |

## Phase 1: Backend Foundation

- [x] 1.1 Create `coreApp/views/imports.py` with imports (APIView, Response, openpyxl, Product, Category, _build_xlsx_response), IMPORT_COLUMNS constant, and helper functions: `_validate_row(row, headers)`, `_match_product(row)`, `_detect_duplicate_barcodes(rows)` (~70 lines)
- [x] 1.2 Create `ImportProductsTemplateView(APIView)` with `get()` — build Workbook with 9 headers, return via `_build_xlsx_response` (~20 lines)
- [x] 1.3 Create `ImportProductsView(APIView)` with `post()` — validate file exists & .xlsx, read headers, check required columns, pre-scan barcodes, iterate rows calling helpers, accumulate errors, return `{ created, updated, errors }` (~80 lines)

## Phase 2: Backend Routes

- [x] 2.1 Modify `coreApp/views/__init__.py` — add `from .imports import ImportProductsView, ImportProductsTemplateView` and append to `__all__` (~3 lines)
- [x] 2.2 Modify `coreApp/urls.py` — add `api/import/products/` (POST) and `api/import/products/template/` (GET) routes with `IsAuthenticated` permission (~10 lines)

## Phase 3: Frontend API

- [x] 3.1 Modify `frontend/src/api/settings.api.ts` — add `importProducts(file: File)` sending FormData via POST, and `downloadImportTemplate()` as GET blob (~25 lines)

## Phase 4: Frontend UI

- [x] 4.1 Modify `frontend/src/pages/SettingsPage.tsx` — add "Importar Productos (XLSX)" button next to export section, hidden `<input type="file" accept=".xlsx">`, confirmation modal (reuse existing pattern), loading state, toast on response, expandible error detail section (~100 lines)
