## Exploration: Exportar Gastos a XLSX

### Current State

El sistema exporta Clientes, Productos y Ventas a XLSX desde la página de Ajustes (`SettingsPage.tsx`). Cada export es un `APIView` en `coreApp/views/exports.py` que genera un Workbook de openpyxl, lo pasa por `_build_xlsx_response()` (en `helpers.py`) y retorna un HttpResponse. El frontend llama a funciones tipo `exportClients()` desde `settings.api.ts` con `responseType: 'blob'` y descarga via `triggerDownload()`.

El modelo `Expense` existe con campos `amount`, `description`, `category` (choices), `date`, `created_at`. El `ExpenseViewSet` ya soporta filtros `date_from`/`date_to`.

**No hay página de gastos en el frontend** — el routing (`App.tsx`) no incluye una ruta para Expenses. La única interacción con gastos desde el frontend se hace a través del ViewSet (API CRUD). No hay una página dedicada donde poner un botón de export.

### Affected Areas

- `coreApp/views/exports.py` — agregar `ExportExpensesView` (nueva clase APIView)
- `coreApp/views/__init__.py` — exportar `ExportExpensesView`
- `coreApp/urls.py` — agregar ruta `/api/export/expenses/`
- `frontend/src/api/settings.api.ts` — agregar función `exportExpenses()`
- `frontend/src/pages/SettingsPage.tsx` — agregar botón en la grilla de exports (sección "Exportar Datos")

### Approaches

1. **Agregar a SettingsPage (recomendado)**
   - Mismo patrón exacto que clientes/productos/ventas
   - Botón en la misma grilla de exports en SettingsPage
   - Ajustar el grid a `sm:grid-cols-4` o mantener `sm:grid-cols-3` y ponerlo debajo
   - Pros: consistente, no requiere nueva página, mismo flujo de UX
   - Cons: la grilla actual es `sm:grid-cols-3` con 3 items; al agregar un 4to hay que decidir layout
   - Effort: Bajo

2. **Crear página de gastos y poner export ahí**
   - Requeriría nueva página + ruta + layout
   - Desvío enorme para una feature simple
   - Effort: Alto (no justificado)

### Campos del XLSX Propuestos

| Header (español)  | Campo Modelo        | Notas                          |
|-------------------|---------------------|--------------------------------|
| ID                | `expense.id`        |                                |
| Fecha             | `expense.date`      | `strftime("%Y-%m-%d")`         |
| Categoría         | `expense.get_category_display()` | Display name, no raw value |
| Descripción       | `expense.description`|                                |
| Monto             | `str(expense.amount)`| Como string, consistente con exports existentes |
| Creado            | `expense.created_at` | `strftime("%Y-%m-%d %H:%M")`  |

Orden lógico: Fecha, Categoría, Descripción, Monto, ID, Creado — pero el patrón existente arranca con ID. Seguir el mismo orden que los otros exports: **ID, Fecha, Categoría, Descripción, Monto, Creado**.

### Filtros

**Soportar `date_from`/`date_to` desde el inicio.** El `ExpenseViewSet.get_queryset()` ya filtra por `date__gte`/`date__lte`. El `ExportSalesView` ya implementa este patrón. Cuesta casi cero replicarlo y da mucho valor.

### Categoría

Usar `expense.get_category_display()` — igual que `sale.get_payment_method_display()` y `sale.get_status_display()` en ExportSalesView. Así el usuario ve "Alquiler" en vez de "RENT".

### Recommendation

**Opción 1 (directa).** Implementar siguiendo el patrón exacto:

1. Backend: `ExportExpensesView` en `exports.py`, 40-50 líneas, copiar estructura de `ExportSalesView` adaptando modelo y headers
2. URL: `/api/export/expenses/` con name `export-expenses`
3. Frontend: `exportExpenses()` en `settings.api.ts` → `triggerDownload(data, 'gastos.xlsx')`
4. UI: Botón en SettingsPage dentro de la sección "Exportar Datos". La grilla actual es `sm:grid-cols-3`. Opciones:
   - Cambiar a `sm:grid-cols-4` (los botones se vuelven más angostos)
   - O agregar una segunda fila: dejar los 3 existentes y poner Gastos abajo con un `sm:col-span-3` o similar
   - Recomiendo **`sm:grid-cols-4`** — es el approach más limpio y los botones tienen padding interno suficiente

### Riesgos

- **Cambio de layout del grid**: si se cambia a `sm:grid-cols-4`, verificar que no se vea mal en pantallas chicas. El grid actual usa `grid-cols-1 sm:grid-cols-3` — cambiarlo a `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` sería más seguro para responsive.
- **Consistencia de naming**: el filename debe ser `gastos.xlsx` siguiendo el patrón `clientes.xlsx`, `productos.xlsx`, `ventas.xlsx`.
- **Orden de registros**: el modelo `Expense` tiene `ordering = ['-date', '-created_at']`, usar `Expense.objects.all().order_by('-date', '-created_at')` para consistencia con el ViewSet.

### Ready for Proposal

**Yes.** La implementación es straight-forward, el patrón está claramente definido, no hay ambigüedad técnica. Se puede pasar a `sdd-propose` directamente.