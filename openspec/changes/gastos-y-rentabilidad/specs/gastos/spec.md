# Gastos Specification

## Purpose

Full CRUD for daily store expenses (alquiler, servicios, reposición de inventario, sueldos, etc.) integrated into the Reports page.

## Requirements

### R-G1: Expense Model
The system MUST provide an `Expense` model with: `amount` (Decimal, required), `description` (CharField, required), `category` (CharField with TextChoices), `date` (DateField, defaults to today). Categories: `ALQUILER`, `SERVICIOS`, `REPOSICION`, `SUELDOS`, `IMPUESTOS`, `MARKETING`, `MANTENIMIENTO`, `VARIOS`.

#### Scenario: Create expense
- GIVEN the user is authenticated
- WHEN they POST `/api/expenses/` with `{amount: 500000, description: "Alquiler local", category: "ALQUILER", date: "2026-06-01"}`
- THEN the expense is created with id, amount=500000, and returned in the response

### R-G2: Expense CRUD via API
The system MUST expose a ModelViewSet at `/api/expenses/` with standard list/create/update/delete. List MUST sort by date descending by default.

#### Scenario: Edit expense
- GIVEN expense with id=1 exists, amount=500000
- WHEN PATCH `/api/expenses/1/` with `{amount: 550000}`
- THEN amount becomes 550000

#### Scenario: Delete expense
- GIVEN expense with id=1 exists
- WHEN DELETE `/api/expenses/1/`
- THEN expense is removed, GET `/api/expenses/1/` returns 404

#### Scenario: Empty list
- GIVEN no expenses exist
- WHEN GET `/api/expenses/`
- THEN returns empty array `[]`

### R-G3: Expense List in Reports (Backend)
The ReportStatsView MUST include `expenses` — total expenses for the queried week.

#### Scenario: Expenses in weekly stats
- GIVEN 2 expenses totaling $800,000 in the current week
- WHEN GET `/api/reports/stats/`
- THEN response includes `summary.total_expenses_week: 800000`

### R-G4: Pagination & Search (Backend)
Expense list SHOULD support pagination (20 per page) and date range filtering via `?date_from=` and `?date_to=` query params.

### R-G5: Admin Registration
Expense model MUST be registered in Django admin.

### R-G6: Expense UI (Frontend)
The system MUST provide a Gastos section within the Reports page (or a sub-page) with: table (Fecha, Categoría, Descripción, Monto, Acciones), create/edit modal (pattern = ProductModal), and delete with confirmation.

#### Scenario: View expenses
- GIVEN 3 expenses exist in the current week
- WHEN user navigates to Reports > Gastos
- THEN all 3 expenses are displayed in a table sorted by date desc

#### Scenario: Create expense via modal
- GIVEN user is on Gastos section
- WHEN they click "Nuevo Gasto", fill form (amount, description, category), submit
- THEN expense appears in table

### R-G7: Expense Export
Expenses SHOULD be exportable to XLSX (pattern = existing Client/Product/Sale exports).

---

# Rentabilidad Specification (Delta)

## Purpose

Extend existing report views and frontend to show gross profit (Utilidad Bruta) and profit margin.

## MODIFIED Requirements

### R-R1: Profit in Weekly Stats (Backend)
ReportStatsView MUST include per-day and weekly profit. Profit = Σ((SaleItem.unit_price - Product.cost) × SaleItem.quantity) for COMPLETED sales in the period.

#### Scenario: Profit calculation
- GIVEN a day has 1 sale: SaleItem(unit_price=1000, quantity=10), Product(cost=600)
- THEN day profit = (1000-600)×10 = 4000
- AND day total = 10000, margin = 40%

#### Scenario: Product has cost=0
- GIVEN Product.cost = 0 (default)
- WHEN a sale item for that product is sold
- THEN profit = unit_price × quantity (full amount)

### R-R2: ReportStats Response Changes
The response MUST add to `week_days[].profit` (float), `summary.total_profit_week` (float), `summary.profit_margin` (float, percentage). Top product MUST add `profit` field to show which product generated most profit.

#### Scenario: Top product by profit ≠ top by revenue
- GIVEN product A: 10 units × ($2000-$100) = $19000 profit, product B: 5 units × ($5000-$3000) = $10000 profit
- WHEN top product is selected by profit
- THEN top product = product A (even if product B has higher revenue)

### R-R3: Dashboard Profit (Backend)
DashboardStatsView MUST add `ganancia_dia` (string, formatted) — profit for today's COMPLETED sales.

#### Scenario: Dashboard shows daily profit
- GIVEN today's sales have total profit of $350,000
- WHEN GET `/api/dashboard/stats/`
- THEN response includes `"ganancia_dia": "350000.00"`

### R-R4: Profit UI — MetricsSection (Frontend)
MetricsSection MUST show a "Utilidad Bruta" card: weekly profit amount, margin %, and trend vs last week.

#### Scenario: Profit card renders
- GIVEN ReportStats returns total_profit_week=4000000, profit_margin=35.5
- WHEN MetricsSection renders
- THEN user sees "Utilidad Bruta: $4,000,000 (35.5%)" with trend indicator

### R-R5: Profit UI — WeeklyChartCard (Frontend)
WeeklyChartCard SHOULD overlay profit vs revenue as a dual-line chart (or stacked bar) for the week.

### R-R6: Profit UI — Dashboard (Frontend)
CardsSection MUST display a "Ganancia del día" card showing today's profit.

#### Scenario: Dashboard profit card
- GIVEN DashboardStats returns ganancia_dia="450000.00"
- WHEN CardsSection renders
- THEN user sees "Ganancia del día: $450,000"

### R-R7: Profit UI — Top Product (Frontend)
TopProduct display in MetricsSection SHOULD show profit alongside revenue, and SHOULD be sorted by profit (not units).
