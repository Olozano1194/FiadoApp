# Design: Frontend Testing Infrastructure

## Technical Approach

Add Vitest-based testing for 9 Zustand stores and 13 API modules using `vi.mock` for module-level mocking. No MSW — mocks are scoped per test file. Stores tested via `getState()`/`setState()` (no DOM). API modules tested by mocking `axios.config` default export. Global Tauri `@tauri-apps/plugin-store` mock in setup file with `localStorage` fallback for `authStore`.

## Architecture Decisions

### Mock Strategy: vi.mock (not MSW)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `vi.mock` per module | Simple, no extra deps, fine for pure-unit store/API tests | ✅ Chosen |
| MSW | Better for integration/E2E, adds setup complexity, proposal explicitly excludes it | ❌ Rejected |

**Rationale**: Stores and API modules are thin wrappers — `vi.mock` is sufficient and matches existing test style (no MSW anywhere in project).

### Store Test Pattern

All stores (except `authStore`) follow identical async action pattern:
1. `set({ loading: true, error: null })`
2. Call API function
3. On success: `set({ data: ..., loading: false })`
4. On error: `set({ loading: false, error: '...' })` + optional `toast.error()`

Test structure per store:
```ts
vi.mock('../../api/{module}.api');
vi.mock('react-hot-toast');

beforeEach(() => {
  vi.clearAllMocks();
  useStore.setState(initialState);
});

it('fetchXxx: sets loading then data on success', async () => { ... });
it('fetchXxx: sets error on failure', async () => { ... });
```

**authStore special handling**: Mock `@tauri-apps/plugin-store` globally (setup file). `login`/`logout`/`restoreSession` all hit localStorage via `getStore()` — the global mock returns `null`, so localStorage fallback is exercised. Mock `authApi` functions. Test token decode via JWT fixture.

### API Module Test Pattern

Each API module imports `api` from `axios.config`. Mock the entire module:
```ts
vi.mock('../axios.config', () => ({ default: { get: vi.fn(), post: vi.fn(), ... } }));
```
Test: correct URL, correct HTTP method, correct payload/headers (FormData for products).

### Tauri Mock Approach

Global `vi.mock('@tauri-apps/plugin-store', ...)` in `src/test/setup.ts` returning `{ Store: { load: vi.fn().mockResolvedValue(null) } }`. This forces `authStore`'s `getStore()` to fall through to `localStorage` path — which is what jsdom provides.

## Data Flow

    Test file → vi.mock(api module) → mock returns → store action calls API → assert store state
    Test file → vi.mock(react-hot-toast) → suppress toast.side effects

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/package.json` | Modify | Add `test`, `test:run`, `test:coverage` scripts |
| `frontend/vitest.config.ts` | Modify | Add `include` pattern and `coverage` config |
| `frontend/src/test/setup.ts` | Modify | Add global `@tauri-apps/plugin-store` mock |
| `frontend/src/test/test-utils.tsx` | Create | `renderWithRouter` wrapper (MemoryRouter) |
| `frontend/src/utils/__tests__/format.test.ts` | Modify | Add edge cases (negative, large numbers) |
| `frontend/src/utils/__tests__/toastStyles.test.ts` | Modify | Add missing style variants |
| `frontend/src/stores/__tests__/authStore.test.ts` | Create | login/logout/restoreSession |
| `frontend/src/stores/__tests__/productStore.test.ts` | Create | 5 async actions |
| `frontend/src/stores/__tests__/clientStore.test.ts` | Create | 5 async actions |
| `frontend/src/stores/__tests__/closureStore.test.ts` | Create | fetchPreview/createClosure |
| `frontend/src/stores/__tests__/dashboardStore.test.ts` | Create | fetchStats/fetchRecentSales |
| `frontend/src/stores/__tests__/expenseStore.test.ts` | Create | CRUD actions |
| `frontend/src/stores/__tests__/reportStore.test.ts` | Create | report fetch actions |
| `frontend/src/stores/__tests__/saleStore.test.ts` | Create | sale CRUD actions |
| `frontend/src/stores/__tests__/storeConfigStore.test.ts` | Create | config fetch/update |
| `frontend/src/api/__tests__/auth.api.test.ts` | Create | login/refresh/verify URLs |
| `frontend/src/api/__tests__/cash-closure.api.test.ts` | Create | preview/create URLs |
| `frontend/src/api/__tests__/categories.api.test.ts` | Create | CRUD URLs |
| `frontend/src/api/__tests__/clients.api.test.ts` | Create | CRUD URLs |
| `frontend/src/api/__tests__/dashboard.api.test.ts` | Create | stats/recent URLs |
| `frontend/src/api/__tests__/expenses.api.test.ts` | Create | CRUD URLs |
| `frontend/src/api/__tests__/fiado-payments.api.test.ts` | Create | payment URLs |
| `frontend/src/api/__tests__/products.api.test.ts` | Create | CRUD + FormData URLs |
| `frontend/src/api/__tests__/reports.api.test.ts` | Create | report URLs |
| `frontend/src/api/__tests__/sales.api.test.ts` | Create | CRUD + history URLs |
| `frontend/src/api/__tests__/search.api.test.ts` | Create | search URLs |
| `frontend/src/api/__tests__/settings.api.test.ts` | Create | settings URLs |

## Interfaces / Contracts

```ts
// src/test/test-utils.tsx
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

export function renderWithRouter(
  ui: React.ReactElement,
  { route = '/', ...options }: RenderOptions & { route?: string } = {}
) {
  return render(
    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>,
    options
  );
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Utils | Edge cases for formatCurrency, toastStyles | Expand existing tests |
| Stores (8 standard) | loading→success, loading→error per async action | Mock API module, assert `getState()` |
| Store (authStore) | login/logout/restoreSession + token persistence | Mock authApi + global Tauri mock |
| API (13 modules) | Correct URL, method, payload, headers | Mock axios.config default export |
| API (products) | FormData construction, image handling | Verify FormData entries |

## Migration / Rollout

No migration required. Purely additive — no production code changes. All test files live in `__tests__/` directories. Scripts added to `package.json` are additive.

## Open Questions

- None — all patterns verified against actual codebase.
