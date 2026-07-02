# Tasks: Frontend Testing Infrastructure

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 3000–4500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation + Stores) → PR 2 (API) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + 9 store tests | PR 1 | Config, test-utils, setup, expanded util tests, all store tests. Base: feature/frontend-tests (tracker) |
| 2 | 13 API module tests | PR 2 | Independent of PR 1. Base: main or PR 1 |

## Phase 1: Foundation (Infrastructure)

- [x] 1.1 Add `test`, `test:run`, `test:coverage` scripts to `frontend/package.json`
- [x] 1.2 Add `include` pattern and `coverage` config to `frontend/vitest.config.ts`
- [x] 1.3 Add global `@tauri-apps/plugin-store` mock to `frontend/src/test/setup.ts`
- [x] 1.4 Create `frontend/src/test/test-utils.tsx` with `renderWithRouter` (MemoryRouter wrapper)
- [x] 1.5 Expand `frontend/src/utils/__tests__/format.test.ts` — add negative, large number, NaN edge cases
- [x] 1.6 Expand `frontend/src/utils/__tests__/toastStyles.test.ts` — add missing style variants
- [x] 1.7 Verify: `npm test` runs setup + expanded util tests without errors

## Phase 2: Store Tests (9 Zustand Stores)

- [x] 2.1 Create `frontend/src/stores/__tests__/authStore.test.ts` — login/logout/restoreSession, Tauri mock + localStorage fallback, JWT decode
- [x] 2.2 Create `frontend/src/stores/__tests__/productStore.test.ts` — fetchProducts, fetchLowStock, create/update/delete, toast on error
- [x] 2.3 Create `frontend/src/stores/__tests__/clientStore.test.ts` — CRUD loading→success→error per action
- [x] 2.4 Create `frontend/src/stores/__tests__/closureStore.test.ts` — fetchPreview/createClosure
- [x] 2.5 Create `frontend/src/stores/__tests__/dashboardStore.test.ts` — fetchStats/fetchRecentSales
- [x] 2.6 Create `frontend/src/stores/__tests__/expenseStore.test.ts` — CRUD actions
- [x] 2.7 Create `frontend/src/stores/__tests__/reportStore.test.ts` — report fetch actions
- [x] 2.8 Create `frontend/src/stores/__tests__/saleStore.test.ts` — sale CRUD actions
- [x] 2.9 Create `frontend/src/stores/__tests__/storeConfigStore.test.ts` — config fetch/update
- [x] 2.10 Verify: all 9 store test files pass via `npm test`

## Phase 3: API Module Tests (13 Modules)

- [x] 3.1 Create `frontend/src/api/__tests__/auth.api.test.ts` — login/refresh/verify URLs and payloads
- [x] 3.2 Create `frontend/src/api/__tests__/cash-closure.api.test.ts` — preview/create URLs
- [x] 3.3 Create `frontend/src/api/__tests__/categories.api.test.ts` — CRUD URLs
- [x] 3.4 Create `frontend/src/api/__tests__/clients.api.test.ts` — CRUD URLs
- [x] 3.5 Create `frontend/src/api/__tests__/dashboard.api.test.ts` — stats/recent URLs
- [x] 3.6 Create `frontend/src/api/__tests__/expenses.api.test.ts` — CRUD URLs
- [x] 3.7 Create `frontend/src/api/__tests__/fiado-payments.api.test.ts` — payment URLs
- [x] 3.8 Create `frontend/src/api/__tests__/products.api.test.ts` — CRUD + FormData + image handling
- [x] 3.9 Create `frontend/src/api/__tests__/reports.api.test.ts` — report URLs
- [x] 3.10 Create `frontend/src/api/__tests__/sales.api.test.ts` — CRUD + history URLs
- [x] 3.11 Create `frontend/src/api/__tests__/search.api.test.ts` — search URLs
- [x] 3.12 Create `frontend/src/api/__tests__/settings.api.test.ts` — settings URLs
- [x] 3.13 Verify: all 13 API test files pass via `npm test`

## Phase 4: Final Verification

- [x] 4.1 Run `npm test` — all tests pass (23 test files, 181 tests)
- [x] 4.2 Run `npm run test:coverage` — produces output without errors
- [x] 4.3 Confirm no production code changes — only test files + config additions
