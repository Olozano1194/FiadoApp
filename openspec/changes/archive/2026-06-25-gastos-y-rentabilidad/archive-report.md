# Archive Report: gastos-y-rentabilidad

**Status:** ARCHIVED  
**Date:** 2026-06-25  
**Verification:** PASS

---

## Que se implemento?

Sistema de gastos (CRUD completo) y calculo de rentabilidad (utilidad bruta, margen de ganancia) integrado en Reportes y Dashboard.

### Componentes creados

- `coreApp/views/expenses.py` -- ExpenseViewSet con paginacion y filtro por fecha
- `coreApp/models.py` -- Expense model con TextChoices de categorias
- `coreApp/serializers.py` -- ExpenseSerializer
- `frontend/src/stores/expenseStore.ts` -- Store Zustand para gastos
- `frontend/src/api/expenses.api.ts` -- API de gastos
- `frontend/src/models/expense.ts` -- Types de gastos
- `frontend/src/components/ui/ExpenseModal.tsx` -- Modal de creacion/edicion de gastos
- `frontend/src/components/sections/reportes/MetricsSection.tsx` -- Tarjeta de utilidad bruta
- `frontend/src/components/sections/CardsSection.tsx` -- Tarjeta de ganancia del dia

### Componentes modificados

- `coreApp/views/reports.py` -- Profit por dia, profit en summary, top product por profit
- `coreApp/views/dashboard.py` -- ganancia_dia en DashboardStatsView
- `coreApp/admin.py` -- Expense registrado en admin
- `coreApp/urls.py` -- Ruta /api/expenses/
- `frontend/src/models/report.ts` -- Tipos de profit/margin/expenses
- `frontend/src/models/dashboard.ts` -- ganancia_dia type
- `frontend/src/pages/ReportPage.tsx` -- Pestana de gastos con tabla + modal

## Decisiones clave

| Decision | Alternativa | Por que |
|---|---|---|
| Expense como tab en ReportPage | Pagina separada | Desktop app, toda la info en un solo lugar |
| Categorias como TextChoices | Modelo separado | Categorias estaticas, no requieren CRUD |
| Profit con costos actuales | cost_at_sale | MVP rapido, se muestra aviso en UI |
| Profit en ReportStatsView | Endpoint separado | Una sola request para todo |

## Issues conocidos

- Profit puede dar negativo si hay gastos sin ventas en el periodo (comportamiento esperado)
- Los costos de producto usan el valor actual, no el historico al momento de la venta

## Verificacion

| Test | Resultado |
|------|-----------|
| TypeScript compile | PASS (3 pre-existing errors no relacionados) |
| Django check | PASS |
| Manual: CRUD gastos via UI | PASS |
| Manual: Utilidad Bruta en Reportes | PASS |
| Manual: Ganancia del dia en Dashboard | PASS |
