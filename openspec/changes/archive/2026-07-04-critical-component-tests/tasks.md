# Tasks: Component Test Suite

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 700–900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Mock factories | PR 1 | base: main; 4 files in `src/test/mocks/` |
| 2 | P1 tests (CartPanel, PaymentBar, LoginPage, ProtectedRoute) | PR 2 | base: PR 1 branch; depends on mocks |
| 3 | P2 tests (SideBar, ProductSearch) | PR 3 | base: PR 2 branch; depends on mocks |

## Phase 1: Mock Infrastructure

- [x] 1.1 Create `frontend/src/test/mocks/saleStoreMock.ts` — `createMockSaleStore(overrides?)` factory returning `MockSaleStore` with cart, payment, completeSale, vi.fn() methods
- [x] 1.2 Create `frontend/src/test/mocks/authStoreMock.ts` — `createMockAuthStore(overrides?)` factory returning `MockAuthStore` with login, isAuthenticated, error, isLoading
- [x] 1.3 Create `frontend/src/test/mocks/storeConfigStoreMock.ts` — `createMockStoreConfigStore(overrides?)` factory returning `MockStoreConfig` with config, fetchConfig
- [x] 1.4 Create `frontend/src/test/mocks/index.ts` — barrel re-export of all mock factories

## Phase 2: P1 POS Tests

- [x] 2.1 Create `frontend/src/components/pos/CartPanel.test.tsx` — vi.mock saleStore + toast; tests: empty state, item display (1 + 3 items), quantity +/-, stock limit disable, remove, clear, totals/profit colors (spec scenarios 1–12)
- [x] 2.2 Create `frontend/src/components/pos/PaymentBar.test.tsx` — vi.mock saleStore + toast; tests: toggle efectivo/credito, cash change calc, credit client select, submit disabled (empty cart, insufficient cash, no client), loading spinner, success toast (spec scenarios 1–10)

## Phase 3: P1 Auth Tests

- [x] 3.1 Create `frontend/src/pages/LoginPage.test.tsx` — vi.mock authStore + storeConfigStore + toast; tests: store name config/fallback, form validation (empty user/pass), valid submit, success redirect, error toast, loading state, error banner, auth redirect, password toggle, error cleanup on unmount (spec scenarios 1–14)
- [x] 3.2 Create `frontend/src/components/auth/ProtectedRoute.test.tsx` — vi.mock authStore; tests: unauthenticated redirects to /login, authenticated renders children, authenticated renders Outlet (spec scenarios 1–3)

## Phase 4: P2 Tests

- [x] 4.1 Create `frontend/src/components/layout/SideBar.test.tsx` — vi.mock storeConfigStore + renderWithRouter; tests: all 7 nav links with paths, active highlight per route, store name config/fallback, subtitle, fetchConfig on mount (spec scenarios 1–13)
- [x] 4.2 Create `frontend/src/components/pos/ProductSearch.test.tsx` — vi.mock productStore (if exists) or render standalone; tests: search input captures text, category filter visible (spec scenarios 1–2)
