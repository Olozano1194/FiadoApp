# Exploration: Frontend Testing Infrastructure for FiadoApp

## Current State

The frontend (React 19 + TypeScript 6 + Vite 8 + Zustand 5) has **zero frontend test infrastructure** beyond bare dependencies:

| Aspect | Current State |
|--------|---------------|
| **Test runner** | Vitest 4.1.9 installed, **no test script** in `package.json` |
| **Test env** | jsdom 29 installed, **no Vitest config** (no `test` block in `vite.config.ts`) |
| **Setup file** | `frontend/src/test/setup.ts` — only imports `@testing-library/jest-dom/vitest` |
| **Testing Library** | `@testing-library/react 16`, `@testing-library/user-event 14` installed |
| **Existing tests** | 2 utility tests: `format.test.ts` (4 cases) and `toastStyles.test.ts` (2 cases) |
| **API mocking** | None — no MSW, no axios mock, no test adapter |
| **Tauri mocks** | None — `@tauri-apps/plugin-store` used in `authStore.ts` via dynamic lazy import |
| **Test wrappers** | None — no custom render, no router wrapper, no store reset utilities |

### Architecture Discovered

1. **9 Zustand stores** — all follow the same pattern: `create<T>((set, get) => ({ ... }))` with async actions that toggle `loading`/`error` state. Essential pattern: `try { set({ loading: true }); ...; set({ data, loading: false }) } catch { set({ error, loading: false }) }`.

2. **13 API modules** — each exports pure functions that call the shared `api` instance from `axios.config.ts`. No class instances, no DI. The axios instance has interceptors for token refresh + error handling.

3. **Tauri usage** — Only `authStore.ts` uses `@tauri-apps/plugin-store` via a **lazy singleton dynamic import** with `localStorage` fallback. `axios.config.ts` reads tokens directly from `localStorage` (not plugin-store). This means the Tauri dependency is isolated to ONE file and has a built-in browser fallback.

4. **Router usage** — `react-router-dom v7` with `BrowserRouter` wrapping the entire app. Components use `useNavigate`, `useLocation`, `Link`, `Outlet`, `Navigate`. Pages and LayoutAdmin consume these.

5. **External deps in components** — `react-hot-toast`, `react-hook-form`, `@headlessui/react`, `@tanstack/react-table`, `react-icons`. Most components call stores directly via hooks (no prop drilling).

6. **No path aliases** — all imports are relative (`../../stores/...`, `../api/...`).

## Affected Areas

### Infrastructure (new files to create)

- `frontend/vite.config.ts` — add `test` block (or new `vitest.config.ts`)
- `frontend/src/test/test-utils.tsx` — custom render with router wrapper + store reset
- `frontend/src/test/mocks/tauri-plugin-store.ts` — mock for `@tauri-apps/plugin-store`
- `frontend/src/test/mocks/fileMock.js` — static file stub (if needed for Vite assets)
- `frontend/package.json` — add `test`, `test:run`, `test:coverage` scripts

### Test Files to Create (by priority tier)

| Tier | Target | Files | Est. Tests |
|------|--------|-------|------------|
| 0 | Utils (expand) | `format.test.ts`, `toastStyles.test.ts` | 5-8 more cases |
| 1 | Zustand Stores | 9 store test files | 40-60 tests |
| 2 | API modules | 13 API test files | 35-50 tests |
| 3 | Simple components | ~8 component test files | 25-35 tests |
| 4 | Complex components | ~8 component test files | 40-60 tests |
| 5 | Pages (integration) | ~5 page test files | 20-30 tests |
| **Total** | | **~35-40 test files** | **165-245 tests** |

### Specific Store Patterns Observed

| Store | Async Actions | Tauri Dep? | toast Dep? | Lines |
|-------|--------------|------------|------------|-------|
| `authStore` | 3 (login, logout, restoreSession) | **YES** | No | 178 |
| `productStore` | 5 (fetch, lowStock, create, update, delete) | No | Yes | 76 |
| `clientStore` | 5 (fetch, debtors, create, update, delete) | No | Yes | 76 |
| `saleStore` | 6 (fetch, recent, create, addToCart, remove, complete) + 4 sync | No | Yes | 146 |
| `dashboardStore` | 2 (stats, recentSales) | No | No | 33 |
| `reportStore` | 2 (stats, activity) + 3 sync | No | No | 95 |
| `closureStore` | 2 (preview, create) | No | No | 61 |
| `expenseStore` | 4 (fetch, create, update, delete) | No | Yes | 64 |
| `storeConfigStore` | 2 (fetch, update) | No | No | 39 |

### Component Complexity

| Component | Stores Used | Router Deps | External Libs | Complexity |
|-----------|-------------|-------------|---------------|------------|
| `ProtectedRoute` | authStore | Navigate, Outlet | None | Simple |
| `BarcodeInput` | saleStore (addToCart) | None | react-icons, toast | Medium |
| `CartPanel` | saleStore (6 selectors) | None | react-icons, formatCurrency | Medium-High |
| `PaymentBar` | saleStore (10+ selectors) | None | toast, formatCurrency, ClientSelect | High |
| `ProductModal` | None (props-driven) | None | react-hook-form | Medium |
| `ProductsSection` | productStore, saleStore | None | formatCurrency, ProductImage | Medium |
| `SideBar` | storeConfig | Link, useLocation | react-icons | Medium |
| `LoginPage` | authStore, storeConfig | useNavigate | react-hook-form, toast | High |

## Approaches

### 1. Mocking Strategy

**Option A: vi.mock for stores + MSW for components**

Mock at the unit level for store/api tests (vi.mock), use MSW for component integration tests.

| Aspect | Detail |
|--------|--------|
| Pros | Best separation — stores test state logic in isolation, components test rendered behavior with real-ish network |
| Cons | Two mocking systems to maintain; MSW adds setup complexity |
| Effort | High (initial setup) |

**Option B: vi.mock everything (no MSW)**

Mock axios at the module level for ALL tests. Components test with pre-mocked API responses.

| Aspect | Detail |
|--------|--------|
| Pros | Single mocking approach; simpler setup; matches project's current zero-infrastructure state |
| Cons | Component tests don't verify real HTTP behavior; mock maintenance grows with each API change |
| Effort | Medium (one-time setup + per-test mocks) |

**Option C: MSW only (no vi.mock for API)**

Use MSW for ALL tests — intercept HTTP at the network level.

| Aspect | Detail |
|--------|--------|
| Pros | Tests exercise real axios behavior (interceptors, refresh, errors); one approach for everything |
| Cons | Higher setup cost; store tests need MSW server running; overkill for pure state logic |
| Effort | High (MSW setup + handlers for 13 API modules) |

**Recommendation: Option B (vi.mock) as Phase 1, add MSW as Phase 2 if needed.**

Rationale: The project has 0 test infrastructure. Starting with `vi.mock` for axios + Tauri gets fast coverage where it matters most (stores + API logic). MSW can be added later for critical flow integration tests.

### 2. Tauri Plugin-Store Mocking

`authStore.ts` imports `@tauri-apps/plugin-store` via dynamic `import()` inside a lazy singleton. Three options:

**Option A: Global `vi.mock('@tauri-apps/plugin-store')` in setup**

```ts
vi.mock('@tauri-apps/plugin-store', () => {
  const mockStore = {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  };
  return {
    Store: { load: vi.fn(() => Promise.resolve(mockStore)) },
  };
});
```

| Aspect | Detail |
|--------|--------|
| Pros | Global — all tests get it automatically; mirrors the `Store.load()` API |
| Cons | Mock is always loaded even for tests that don't need it |
| Effort | Low |

**Option B: Let it fall through to localStorage**

The lazy singleton already falls back to `null` when `@tauri-apps/plugin-store` import fails (line 35: `catch { _store = null; }`). Tests can run without mocking — they'll use `localStorage` which jsdom provides.

| Aspect | Detail |
|--------|--------|
| Pros | Zero mocking for Tauri; uses existing fallback; tests localStorage behavior too |
| Cons | Relies on the import actually failing; if Vitest resolves the module, it may throw or hang |
| Effort | None (if it works) |

**Recommendation: Option A** — the global mock is safer because Vitest may resolve the module. It's 10 lines and covers all authStore tests.

### 3. Store Test Pattern

All 9 stores follow the same architecture — a single test pattern works universally:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProductStore } from '../productStore';
import * as productsApi from '../../api/products.api';

vi.mock('../../api/products.api');

beforeEach(() => {
  vi.clearAllMocks();
  useProductStore.setState({ products: [], loading: false, error: null, selected: null, lowStockProducts: [] });
});

describe('useProductStore', () => {
  describe('fetchProducts', () => {
    it('sets products on success', async () => {
      const mockProducts = [{ id: 1, name: 'Test', price: '1000', ... }];
      vi.mocked(productsApi.getProducts).mockResolvedValue({ data: { results: mockProducts } } as any);
      await useProductStore.getState().fetchProducts();
      expect(useProductStore.getState().products).toEqual(mockProducts);
      expect(useProductStore.getState().loading).toBe(false);
    });

    it('sets error on failure', async () => {
      vi.mocked(productsApi.getProducts).mockRejectedValue(new Error('Network'));
      await useProductStore.getState().fetchProducts();
      expect(useProductStore.getState().error).toBe('Error al cargar productos');
      expect(useProductStore.getState().loading).toBe(false);
    });

    it('sets loading state', () => {
      // Can also test that loading is true during the async operation
    });
  });
});
```

Key insight: Zustand stores outside React components are just objects with methods — no `render()` needed. `useXStore.getState()` + `useXStore.setState()` are the testing primitives.

### 4. API Module Test Pattern

```typescript
import { describe, it, expect, vi } from 'vitest';
import api from '../axios.config';
import * as productsApi from '../products.api';

vi.mock('../axios.config', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('products.api', () => {
  it('getProducts calls api.get with correct URL', () => {
    productsApi.getProducts(50);
    expect(api.get).toHaveBeenCalledWith('/products/?page_size=50');
  });

  it('createProduct sends FormData', () => {
    const data = { name: 'Test', price: '1000', stock: 10, min_stock: 2 };
    productsApi.createProduct(data);
    expect(api.post).toHaveBeenCalledWith(
      '/products/',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  });
});
```

### 5. Component Test Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuthStore } from '../../stores/authStore';

// Mock the store directly
beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: false, isLoading: false, user: null });
});

const renderWithRouter = (component: React.ReactElement) =>
  render(<MemoryRouter>{component}</MemoryRouter>);

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    renderWithRouter(<ProtectedRoute />);
    // ... assert <Navigate> behavior
  });

  it('renders loading state', () => {
    useAuthStore.setState({ isLoading: true });
    renderWithRouter(<ProtectedRoute />);
    expect(screen.getByText('Verificando sesión...')).toBeInTheDocument();
  });

  it('renders outlet when authenticated', () => {
    useAuthStore.setState({ isAuthenticated: true, user: { id: 1, username: 'admin', email: 'a@b.com' } });
    renderWithRouter(<ProtectedRoute />);
    // ... assert Outlet renders
  });
});
```

## Recommendation

### Recommended Test Infrastructure

```
frontend/src/test/
├── setup.ts                        # Existing — keep as-is
├── test-utils.tsx                  # Custom render with Router + providers
├── mocks/
│   ├── tauri-plugin-store.ts       # Mock for @tauri-apps/plugin-store (auto-loaded)
│   └── fileMock.js                 # Stub for image imports
└── vitest.config.ts                # (or extend vite.config.ts)
```

**`test-utils.tsx`** — provides:
- `renderWithRouter(ui, { initialEntries })` — wraps with `MemoryRouter`
- `renderWithProviders(ui, { ... })` — future extensibility (theme providers, etc.)
- `createMockStore(initialState)` — factory to set Zustand state before renders

**Vitest config additions to `vite.config.ts`**:
```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/setup.ts'],
  include: ['src/**/*.{test,spec}.{ts,tsx}'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov', 'html'],
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['src/**/*.test.*', 'src/test/**', 'src/types/**'],
  },
}
```

**`package.json` scripts**:
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage",
"test:ui": "vitest --ui"
```

### Recommended Priority Order

```
Phase 1 (Foundation) — Tier 0-1
├── package.json scripts
├── vitest config
├── test-utils.tsx
├── Tauri plugin-store mock
├── Expand existing utility tests (format, toastStyles)
└── All 9 store tests (authStore, productStore, clientStore, saleStore, etc.)

Phase 2 (API Layer) — Tier 2
├── All 13 API module tests
│   └── Focus: request URL formatting, FormData construction, error passthrough

Phase 3 (Components) — Tier 3-4
├── Simple: ProtectedRoute, BarcodeInput, ErrorBoundary, ProductImage
├── Medium: CartPanel, SideBar, ClientsModal, ExpenseModal
└── Complex: PaymentBar, ProductsSection, ProductModal, SaleReceipt

Phase 4 (Integration) — Tier 5
├── Critical pages: LoginPage, PosPage
└── Key flows: auth → protected route → data load → interaction
```

### Test Conventions

| Convention | Decision |
|------------|----------|
| File naming | `*.test.ts` (pure logic) / `*.test.tsx` (components) |
| Test location | `__tests__/` dir next to source (follows existing `utils/__tests__/` pattern) |
| describe/it style | `describe('ModuleName', () => { describe('methodName', () => { it('does X', ...) })})` |
| Store reset | `beforeEach` → `useStore.setState(initialState)` |
| API mocking | `vi.mock('../../api/foo.api')` per test file |
| Component render | Import `renderWithRouter` from `test-utils` |
| User interaction | `userEvent` from `@testing-library/user-event` |
| Toast mocking | `vi.mock('react-hot-toast')` where needed |
| `import { render, screen } from '@testing-library/react'` | Direct, not through test-utils (fine to have both available) |

### File Creation / Modification Estimate

| File | Action | Est. Lines |
|------|--------|------------|
| `package.json` | Modify (add 4 scripts) | +6 |
| `vite.config.ts` | Modify (add test block) | +15 |
| `src/test/test-utils.tsx` | Create | +30 |
| `src/test/mocks/tauri-plugin-store.ts` | Create | +15 |
| `src/utils/__tests__/format.test.ts` | Modify (expand) | +20 |
| `src/utils/__tests__/toastStyles.test.ts` | Modify (expand) | +10 |
| `src/stores/__tests__/authStore.test.ts` | Create | +120 |
| `src/stores/__tests__/productStore.test.ts` | Create | +100 |
| `src/stores/__tests__/clientStore.test.ts` | Create | +100 |
| `src/stores/__tests__/saleStore.test.ts` | Create | +150 |
| `src/stores/__tests__/dashboardStore.test.ts` | Create | +50 |
| `src/stores/__tests__/reportStore.test.ts` | Create | +80 |
| `src/stores/__tests__/closureStore.test.ts` | Create | +80 |
| `src/stores/__tests__/expenseStore.test.ts` | Create | +90 |
| `src/stores/__tests__/storeConfigStore.test.ts` | Create | +50 |
| `src/api/__tests__/*.test.ts` (13 files) | Create | ~50-200 each |
| `src/components/**/*.test.tsx` (~16 files) | Create | ~50-150 each |
| `src/pages/__tests__/*.test.tsx` (~5 files) | Create | ~60-100 each |
| **Total new** | **~45 files** | **~3000-4500 lines** |

## Risks

1. **Tauri plugin-store mock fragility** — if `@tauri-apps/plugin-store` API changes, the mock breaks. Mitigation: keep mock minimal (only mock what authStore actually uses: `Store.load()`, `.get()`, `.set()`, `.remove()`).

2. **react-hook-form in component tests** — forms using `useForm` need special handling. The `register()` prop spreads create complex mock requirements. Mitigation: wrap form components with test harness or test at the integration level.

3. **Zustand v5 API differences** — Zustand v5 changed some APIs. Confirm `useStore.getState()` and `useStore.setState()` work as expected before writing store tests. Test one store manually first.

4. **TailwindCSS v4 + jsdom** — Tailwind generates CSS at build time via Vite plugin. jsdom won't have Tailwind classes resolved, so `toHaveStyle()` and class-based assertions won't work as expected. Mitigation: test behavior, not CSS classes. Use `toBeInTheDocument()`, `toHaveValue()`, `toHaveTextContent()`, etc.

5. **Dynamic import in authStore** — the `await import('@tauri-apps/plugin-store')` pattern may behave differently under Vitest. The global mock should intercept this before the dynamic import resolves. If Vitest resolves node_modules before mock applies, the `catch` fallback will activate — which may be fine (tests use localStorage path).

6. **Coverage thresholds** — setting a high coverage threshold too early will cause CI failures. Start with 0% threshold and increase incrementally.

## Ready for Proposal

**Yes**. The exploration is thorough enough to move to `sdd-propose` and `sdd-design`. The codebase patterns are consistent (9 stores follow the same pattern, 13 API modules follow the same pattern), which makes the testing approach repetitive and predictable — ideal for templated test generation.

### What the orchestrator should tell the user

> We explored the full FiadoApp frontend codebase. All 9 Zustand stores, 13 API modules, 20+ components, and 11 pages are mapped. The testing strategy is clear:
> - **Mocking**: `vi.mock` for Axios at the module level (no MSW for now — keep infrastructure minimal)
> - **Tauri**: Single global mock for `@tauri-apps/plugin-store` in setup
> - **Stores**: Test via `getState()/setState()` — no rendering needed, pure state logic
> - **Components**: Custom `renderWithRouter` wrapper, mock stores directly
> - **Priority**: Utils → Stores → API → Components → Pages
> - **Effort**: ~35-45 test files, ~3000-4500 lines total
>
> The exploration artifact is at `openspec/changes/frontend-tests/exploration.md`.
