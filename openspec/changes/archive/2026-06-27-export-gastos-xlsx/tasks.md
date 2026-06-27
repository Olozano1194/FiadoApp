# Tasks: Exportar Gastos a XLSX

## Metadata
- **Change**: export-gastos-xlsx
- **Estimated lines**: ~80-100 changed
- **Risk**: Low
- **Review Workload Forecast**: ~100 lines — well under 400 budget

## Task List

### Task 1: Backend — ExportExpensesView ✅
**Files**: `coreApp/views/exports.py`, `coreApp/views/__init__.py`, `coreApp/urls.py`

- [x] En `coreApp/views/exports.py`, agregar `ExportExpensesView(APIView)`:
  - Importar `Expense` desde `..models`
  - Método `get(self, request)`:
    - Crear Workbook de openpyxl
    - Headers: `["ID", "Fecha", "Categoría", "Descripción", "Monto", "Creado"]`
    - Queryset: `Expense.objects.all().order_by("-date", "-created_at")`
    - Soportar `date_from`/`date_to` filtrando por `Expense.date`
    - Mostrar categoría con `get_category_display()`
    - Formatear fechas: `date.strftime("%Y-%m-%d")`, `created_at.strftime("%Y-%m-%d %H:%M")`
    - Monto como string (consistente con otros exports)
    - Retornar `_build_xlsx_response(wb, "gastos.xlsx")`
- [x] En `coreApp/views/__init__.py`, agregar `ExportExpensesView` al import desde `.exports` y a `__all__`
- [x] En `coreApp/urls.py`:
  - Agregar `ExportExpensesView` al import de `coreApp.views`
  - Agregar `path('api/export/expenses/', ExportExpensesView.as_view(), name='export-expenses')`

### Task 2: Frontend — API function ✅
**File**: `frontend/src/api/settings.api.ts`

- [x] Agregar función `exportExpenses`:
  ```typescript
  export const exportExpenses = async () => {
    const response = await api.get('/export/expenses/', { responseType: 'blob' });
    triggerDownload(response.data, 'gastos.xlsx');
  };
  ```

### Task 3: Frontend — Botón en SettingsPage ✅
**File**: `frontend/src/pages/SettingsPage.tsx`

- [x] Encontrar la sección "Exportar Datos" con el grid de botones
- [x] Agregar botón para gastos después del de ventas, con mismo estilo y patrón
- [x] Ajustar el grid responsive:
  - Actual: `grid-cols-1 sm:grid-cols-3`
  - Nuevo: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`
- [x] Manejar estado `exporting` para "gastos" con el mismo patrón que los otros

### Task 4: Verificación ✅
- [x] `python manage.py check` — sin errores
- [x] `tsc --noEmit` — sin errores nuevos
- [ ] Probar manualmente:
  - GET `/api/export/expenses/` → descarga XLSX válido
  - GET `/api/export/expenses/?date_from=2026-06-01&date_to=2026-06-27` → filtrado
  - Botón en SettingsPage descarga `gastos.xlsx`