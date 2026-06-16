# Tasks: Codebase Audit — Technical Debt Cleanup

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~220-280 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Pagination

- [x] 1.1 Create shared `StandardPagination` class in `coreApp/pagination.py` (page_size=20, page_size_query_param)
- [x] 1.2 Add `pagination_class = StandardPagination` to `ClientViewSet`, `ProductViewSet`, `ExpenseViewSet`, `FiadoPaymentViewSet`
- [x] 1.3 Add `pagination_class = StandardPagination` to `CashClosureViewSet`
- [x] 1.4 Update frontend list views (ClientsPage, ProductsPage, etc.) to handle paginated `results` wrapper — already done in SaleViewSet.history pattern, replicate

## Phase 2: Dead Imports & Commented Code

- [x] 2.1 Remove `from itertools import chain` and `Count` from `coreApp/views.py`
- [x] 2.2 Remove `from rest_framework import serializers` from `coreApp/views.py`
- [x] 2.3 Remove `AuthChangePasswordRateThrottle` from `coreApp/urls.py`
- [x] 2.4 Remove `import sys` from `config/settings.py`
- [x] 2.5 Remove unused `import React from 'react'` in `Footer.tsx`
- [x] 2.6 Remove commented-out console.logs and state blocks in `LoginPage.tsx`, `ClientsPage.tsx`, `SideBar.tsx`

## Phase 3: FormatCurrency Consolidation

- [x] 3.1 Create `frontend/src/utils/format.ts` with single `formatCurrency` export
- [x] 3.2 Update all 15+ components to import from `utils/format.ts` instead of defining inline

## Phase 4: Type Safety & Config

- [x] 4.1 Fix `any` types in `ProductsPage.tsx` — proper indexed access with `keyof ProductFormData`
- [x] 4.2 Fix `catch (error: any)` — use `axios.isAxiosError()` in `ProductsPage.tsx`
- [x] 4.3 Replace hardcoded `HEALTH_CHECK_URL` in `App.tsx` with import from axios config
- [x] 4.4 Replace `print()` with `logger.info()` in `backup_utils.py`

## Phase 5: Error Handling Improvements

- [x] 5.1 Add visible error state + toast to `productStore.ts` (replace silent catch)
- [x] 5.2 Add visible error state + toast to `clientStore.ts`
- [x] 5.3 Add visible error state + toast to `saleStore.ts`
- [x] 5.4 Add error toast to `CategoryFilterSection.tsx` (replace `.catch(() => {})`)

## Phase 6: Remaining Cleanup (Medium/Low)

- [x] 6.1 Fix `read_only_fields` in `CashClosureSerializer` — explicit field list
- [x] 6.2 Rename CSV→XLSX labels in `SettingsPage.tsx`
- [x] 6.3 Add `HOST`/`PORT` env var support in `backend_server.py`
- [x] 6.4 Remove `"use no memo"` directive from `Table.tsx` if unused
- [-] 6.5 Remove `import { type JSX }` from `SplashScreen.tsx` if redundant — **SKIPPED**: `JSX.Element` usado como return type
- [x] 6.6 Create `.env.example` at project root — **pre-existing**
