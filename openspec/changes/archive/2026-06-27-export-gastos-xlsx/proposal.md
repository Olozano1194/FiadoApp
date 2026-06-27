# Proposal: Exportar Gastos a XLSX

## Intent

Agregar exportación de gastos (Expense) a XLSX desde la página de Ajustes, siguiendo el patrón exacto de los exports existentes (Clientes, Productos, Ventas). Actualmente los gastos solo se consultan vía API, no hay forma de descargarlos como planilla.

## Scope

### In Scope
- Backend: `ExportExpensesView` en `coreApp/views/exports.py`
- Ruta: `/api/export/expenses/` en `coreApp/urls.py`
- Frontend: función `exportExpenses()` en `settings.api.ts`
- UI: botón en SettingsPage dentro de la grilla "Exportar Datos"
- Ajuste responsive del grid: `grid-cols-1 sm:grid-cols-2 md:grid-col-4`
- Filtros `date_from`/`date_to` igual que ExportSalesView

### Out of Scope
- Página dedicada de gastos (no existe ni se justifica para solo un botón de export)
- Traducciones o i18n (el resto de exports están en español)
- Tests unitarios (los exports existentes tampoco tienen)

## Capabilities

### New Capabilities
- `data-export`: se extiende para cubrir expenses (misma capability que clientes/productos/ventas)

### Modified Capabilities
- Ninguna

## Approach

1. Agregar clase `ExportExpensesView(APIView)` en `exports.py` siguiendo el molde de `ExportSalesView`
2. Columnas: ID, Fecha (`date`), Categoría (`get_category_display()`), Descripción, Monto (`amount`), Creado (`created_at`)
3. Soportar query params `date_from`/`date_to` filtrando por `Expense.date`
4. Orden: `-date, -created_at` (consistente con el ViewSet)
5. Registrar en `urls.py` como `/api/export/expenses/`
6. Frontend: `exportExpenses()` → GET blob → `triggerDownload(data, 'gastos.xlsx')`
7. Botón en SettingsPage, ajustar grid de `sm:grid-cols-3` a `sm:grid-cols-2 md:grid-cols-4`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `coreApp/views/exports.py` | Modified | Agregar `ExportExpensesView` (~40 líneas) |
| `coreApp/views/__init__.py` | Modified | Exportar `ExportExpensesView` |
| `coreApp/urls.py` | Modified | Ruta `/api/export/expenses/` |
| `frontend/src/api/settings.api.ts` | Modified | Función `exportExpenses()` |
| `frontend/src/pages/SettingsPage.tsx` | Modified | Botón + ajuste de grid |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Grid responsive se ve mal en mobile | Baja | Usar `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` — fallback seguro |
| Nombre de archivo inconsistente | Baja | Usar `gastos.xlsx` siguiendo el patrón existente |

## Rollback Plan

Revertir cambios en los 5 archivos. El cambio es puramente aditivo (no modifica comportamiento existente), así que basta con borrar la nueva view, la ruta, la función, y el botón.

## Dependencies

- Ninguna. openpyxl ya está en las dependencias del proyecto.

## Success Criteria

- [ ] GET `/api/export/expenses/` descarga un archivo XLSX válido
- [ ] El XLSX contiene las columnas esperadas con datos reales
- [ ] `?date_from=` y `?date_to=` filtran correctamente
- [ ] El botón en SettingsPage descarga `gastos.xlsx`
- [ ] `tsc --noEmit` pasa sin errores nuevos
- [ ] `python manage.py check` pasa sin errores