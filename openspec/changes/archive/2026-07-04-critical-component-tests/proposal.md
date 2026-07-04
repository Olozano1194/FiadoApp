# Proposal: Component Test Suite

## Intent

182 tests exist — zero for components. Core POS/auth UI flows (cart, payment, login, route guard) lack regression coverage, risking the primary sales workflow. Infrastructure is ready (Vitest, jsdom, @testing-library/react, renderWithRouter).

## Scope

### In Scope
- P1: CartPanel, PaymentBar, LoginPage, ProtectedRoute tests
- P2: SideBar, ProductSearch tests
- Mock factories in `src/test/mocks/` (saleStore, authStore, storeConfigStore)
- Happy path, validation, empty/error/loading states, edge cases

### Out of Scope
- P3: PosPage, BarcodeInput, ClientSelect, SaleReceipt
- Integration, E2E, visual, or a11y tests
- Coverage thresholds or CI changes

## Capabilities

### New Capabilities
- `component-test-pos`: Tests for POS components — cart operations, payment toggle, cash/credit flows, search/barcode/category
- `component-test-auth`: Tests for auth components — login validation, error/success/loading states, route guards, redirects
- `component-test-layout`: Tests for layout components — nav links, active highlighting, store config load

### Modified Capabilities
- None

## Approach

- Vitest + @testing-library/react + jsdom + renderWithRouter (configured)
- Modular `vi.mock` factories per store in `src/test/mocks/`
- Test files colocated: `ComponentName.test.tsx`
- Tests verify behavior (render, events, store integration), not implementation

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/test/mocks/` | New | Store mock factories |
| CartPanel.test.tsx | New | P1 cart tests |
| PaymentBar.test.tsx | New | P1 payment tests |
| LoginPage.test.tsx | New | P1 login tests |
| ProtectedRoute.test.tsx | New | P1 auth route tests |
| SideBar.test.tsx | New | P2 sidebar tests |
| ProductSearch.test.tsx | New | P2 search tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tests coupled to mock store shape | Med | Factory pattern; test behavior, not mock internals |
| Flaky async rendering | Low | Use `waitFor`/`findBy` from testing-library |

## Rollback Plan

Tests are additive — no production code changes. Delete `src/test/mocks/` and all `*.test.tsx` files to revert fully.

## Dependencies

- Vitest v4, @testing-library/react, jsdom (all installed)
- renderWithRouter helper (exists)

## Success Criteria

- [ ] CartPanel: empty state, items, quantity ±, stock limit, totals, profit colors
- [ ] PaymentBar: method toggle, cash change, credit client select, submit disabled, loading spinner
- [ ] LoginPage: validation, success redirect, error, loading UI, password toggle, auth redirect, error cleanup
- [ ] ProtectedRoute: unauthenticated → /login, authenticated → children/Outlet
- [ ] SideBar: all nav links, active highlight, store config
- [ ] ProductSearch: search input, barcode handling, category filter, results