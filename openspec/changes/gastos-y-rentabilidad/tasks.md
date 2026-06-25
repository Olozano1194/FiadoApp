# Tasks: Gastos y Rentabilidad

## Phase 1: Backend Foundation
- [x] 1.1 `coreApp/models.py` -- Add Expense model: TextChoices (RENT/SERVICES/INVENTORY/SALARY/TAXES/MARKETING/MAINTENANCE/OTHER), amount(Decimal), description, date(DateField), created_by(FK User)
- [x] 1.2 `python manage.py makemigrations && migrate`
- [x] 1.3 `coreApp/admin.py` -- Register Expense
- [x] 1.4 `coreApp/serializers.py` -- Add ExpenseSerializer (ModelSerializer, fields='__all__')
- [x] 1.5 `coreApp/views.py` -- Add ExpenseViewSet (ModelViewSet, ordering='-date') + date_from/date_to filtering
- [x] 1.6 `coreApp/urls.py` -- router.register('expenses', ExpenseViewSet)
- [x] 1.7 `coreApp/views.py` -- ReportStatsView: profit calculation; week_days[].profit, summary.total_profit_week, summary.profit_margin
- [x] 1.8 `coreApp/views.py` -- DashboardStatsView: add ganancia_dia (today's profit for completed sales)

## Phase 2: Frontend Types & API
- [x] 2.1 `models/expense.ts` -- Expense, ExpenseCategory types + EXPENSE_CATEGORIES display map
- [x] 2.2 `api/expenses.api.ts` -- getExpenses, createExpense, updateExpense, deleteExpense (axios pattern)
- [x] 2.3 `stores/expenseStore.ts` -- Zustand store (pattern = categoryStore)
- [x] 2.4 `models/report.ts` -- add profit to DayStats, total_profit_week + profit_margin + total_expenses_week to WeekSummary, profit to TopProduct
- [x] 2.5 `models/dashboard.ts` -- add ganancia_dia: string

## Phase 3: Frontend Components
- [x] 3.1 `components/ui/ExpenseModal.tsx` -- Modal form: amount, description, category dropdown, date picker (pattern = ProductModal)
- [x] 3.2 `pages/ReportPage.tsx` -- Add expense tab: table (date/category/description/amount/actions) + modal integration
- [x] 3.3 `components/sections/reportes/MetricsSection.tsx` -- Add "Utilidad Bruta" card with profit amount + margin %, show profit in top product
- [x] 3.4 `components/sections/CardsSection.tsx` -- Add "Ganancia del dia" card

## Phase 4: Verification
- [x] 4.1 `npx tsc -b` -- TypeScript clean (3 pre-existing errors in ProductsPage.tsx and saleStore.ts)
- [x] 4.2 `python manage.py check` -- Django validation passes
- [x] 4.3 Manual: CRUD expense via UI, verify profit matches manual calc, confirm dashboard reflects today
