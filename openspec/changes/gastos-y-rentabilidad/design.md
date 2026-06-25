# Design: Gastos y Rentabilidad

## Technical Approach

Add `Expense` model + CRUD (ModelViewSet pattern) and embed it as a tab within the existing ReportPage. Extend `ReportStatsView` to compute gross profit from `SaleItem.unit_price - Product.cost` per completed sale. Frontend adds profit cards to MetricsSection and dashboard CardsSection.

## Architecture Decisions

### Decision 1: Expense CRUD — ModelViewSet (existing pattern)
- **Choice**: Same `ModelViewSet` pattern as Category/Product/Client
- **Alternatives**: Separate APIView for each verb
- **Rationale**: Zero new boilerplate — `views.py` adds ~5 lines, `urls.py` adds 1 line. Portfolio matches every existing backend resource.

### Decision 2: Expense tab in ReportPage (no separate page)
- **Choice**: Tab-based section within `/reportes`, no new route or sidebar link
- **Alternatives**: New `GastosPage.tsx` + route + sidebar entry
- **Rationale**: Desktop app — all reporting in one place. Avoids navigation bloat. The table replaces the need for a full page.

### Decision 3: Categories as model CharField choices (no separate model)
- **Choice**: `models.TextChoices` on Expense model (`ALQUILER`, `SERVICIOS`, `REPOSICION`, `SUELDOS`, `IMPUESTOS`, `MARKETING`, `MANTENIMIENTO`, `VARIOS`)
- **Alternatives**: Separate Category model with FK
- **Rationale**: Categories are static, never CRUD'd by user. CharField choices are simpler, no extra admin/list overhead.

### Decision 4: Profit uses current `product.cost`
- **Choice**: `profit = (unit_price - product.cost) * quantity` using current Product.cost
- **Alternatives**: Store `cost_at_sale` on SaleItem at creation time
- **Rationale**: MVP speed. Historical accuracy deferred. UI shows notice: "cálculo basado en costos actuales".

### Decision 5: Profit in ReportStatsView, not separate endpoint
- **Choice**: Add `profit` to `week_days[].profit`, `summary.total_profit_week`, `summary.profit_margin`
- **Alternatives**: `/api/reports/profitability/` separate endpoint
- **Rationale**: Frontend already fetches ReportStats once. One request = all data. No waterfall.

## Data Flow

```
[ReportPage] ──→ reportStore.fetchStats()
                     │
                     ▼
              ReportStatsView.GET()
                     │
                     ├── Day loop: Sale (completed) → Sum total
                     │   └── SaleItem (select_related product) → Sum profit
                     │
                     └── Response: week_days[].profit, summary.total_profit_week
                               │
                               ▼
                      MetricsSection ← profit card
                      WeeklyChartCard ← profit overlay (optional)
```

```
[Expense Tab] ──→ expenseStore.fetchExpenses(date_from, date_to)
                     │
                     ▼
              ExpenseViewSet.list() ──→ ExpenseSerializer
                     │
               [ExpenseModal] ──→ createExpense / updateExpense
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `coreApp/models.py` | Modify | Add `Expense` model with TextChoices categories |
| `coreApp/serializers.py` | Modify | Add `ExpenseSerializer` (ModelSerializer, fields='__all__') |
| `coreApp/views.py` | Modify | Add `ExpenseViewSet` + profit calc in `ReportStatsView` + `ganancia_dia` in `DashboardStatsView` |
| `coreApp/urls.py` | Modify | Register `expenses` route |
| `coreApp/admin.py` | Modify | Register Expense in admin |
| `frontend/src/models/expense.ts` | Create | Expense + ExpenseFormData types + EXPENSE_CATEGORIES map |
| `frontend/src/api/expenses.api.ts` | Create | getExpenses, create, update, delete (standard axios) |
| `frontend/src/stores/expenseStore.ts` | Create | Zustand store (pattern = productStore) |
| `frontend/src/components/ui/ExpenseModal.tsx` | Create | Modal form (pattern = ProductModal) |
| `frontend/src/models/report.ts` | Modify | Add `profit` to DayStats, `total_profit_week`/`profit_margin` to WeekSummary |
| `frontend/src/models/dashboard.ts` | Modify | Add `ganancia_dia: string` |
| `frontend/src/pages/ReportPage.tsx` | Modify | Add ExpenseSection component (table + modal) |
| `frontend/src/components/sections/reportes/MetricsSection.tsx` | Modify | Add "Utilidad Bruta" card |
| `frontend/src/components/sections/CardsSection.tsx` | Modify | Add "Ganancia del día" card |
| `frontend/src/stores/reportStore.ts` | Modify | No changes needed — types flow from models |

## Interfaces / Contracts

```typescript
// expense.ts
export interface Expense {
  id: number; amount: string; description: string;
  category: ExpenseCategory; date: string; created_by?: number; created_at: string;
}
export type ExpenseCategory = 'RENT' | 'SERVICES' | 'INVENTORY' | 'SALARY' | 'TAXES' | 'MARKETING' | 'MAINTENANCE' | 'OTHER';
export const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = { ... };
export interface ExpenseFormData { amount: string; description: string; category: ExpenseCategory; date: string; }

// report.ts — additions to DayStats & WeekSummary
export interface DayStats {
  ...existing
  profit: number;           // NEW
}
export interface WeekSummary {
  ...existing
  total_profit_week: number;  // NEW
  profit_margin: number;      // NEW
}

// dashboard.ts — addition
export interface DashboardStats {
  ...existing
  ganancia_dia: string;     // NEW
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Expense CRUD via API | ModelViewSet standard — manual via DRF Browsable API |
| Integration | Profit calculation matches manual math | Seed Sale + SaleItem + Product(cost), call ReportStatsView, assert profit = (price-cost)*qty |
| Integration | Expense in weekly summary | Create 2 expenses, verify summary.total_expenses_week matches sum |
| Frontend | ExpenseModal renders/submits | Manual — modal pattern is identical to ProductModal |

## Open Questions

- [ ] Profit overlay in WeeklyChartCard — dual chart or stacked bar? Spec says SHOULD, defer to implementation.
- [ ] XLSX export for expenses — pattern exists (`ExportClientsView`), easy to add but scope depends on time
