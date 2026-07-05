# Design: Component Test Suite

## Technical Approach

Module-level `vi.mock` factories for each Zustand store, with a shared mock state pattern. Tests render real components with `renderWithRouter`, asserting DOM behavior against controlled store state. This matches the existing store test pattern (`useSaleStore.setState(initialState)`) but applied at the component level.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Module-level `vi.mock` vs Zustand mock provider | Mock provider needs wrapper boilerplate; module-level is simpler and matches existing `saleStore.test.ts` pattern | **Module-level `vi.mock`** |
| Separate mock files per store vs single mock index | Separate files keep factories focused and avoid circular deps | **Separate files + index re-export** |
| Integration-style (render real component) vs unit-style (test logic only) | Unit skips DOM/event interactions; integration catches real regressions | **Integration-style** with `renderWithRouter` |
| Mock API layer vs mock stores | Mocking stores isolates component behavior from store internals | **Mock stores** (API layer already tested) |
| Manual toast mock vs silent mock | Silent mock hides toast assertions; manual enables verification | **Manual mock** with `vi.mock('react-hot-toast')` |

## Mock Architecture

Each factory is a function returning the full store interface with overridable defaults:

```ts
// src/test/mocks/saleStoreMock.ts
export const createMockSaleStore = (overrides?: Partial<SaleState>) => ({
  cart: [], removeFromCart: vi.fn(), updateQuantity: vi.fn(),
  clearCart: vi.fn(), getCartTotal: vi.fn().mockReturnValue(0),
  selectedPaymentMethod: 'CASH' as const, ...defaults, ...overrides,
});
```

The `vi.mock` factory instantiates via `createMockSaleStore()` and exposes the mock for spy assertions. Each test can override state via `vi.mocked(useSaleStore).mockReturnValue(mockInstance)` or by calling `mockInstance.cart = [...]`.

**Pattern per store**:
- `saleStoreMock.ts` — saleStore shape (cart, payment, completeSale)
- `authStoreMock.ts` — authStore shape (login, isAuthenticated, error)
- `storeConfigStoreMock.ts` — storeConfigStore shape (config, fetchConfig)
- `index.ts` — barrel re-export

## Test File Structure

```
frontend/src/
├── test/mocks/              ← Store mock factories (NEW)
│   ├── saleStoreMock.ts
│   ├── authStoreMock.ts
│   ├── storeConfigStoreMock.ts
│   └── index.ts
├── components/pos/
│   ├── CartPanel.test.tsx   ← P1
│   ├── PaymentBar.test.tsx  ← P1
│   └── ProductSearch.test.tsx ← P2
├── components/auth/
│   └── ProtectedRoute.test.tsx ← P1
├── components/layout/
│   └── SideBar.test.tsx     ← P2
└── pages/
    └── LoginPage.test.tsx   ← P1
```

## Testing Patterns

**Store mocking** — `vi.mock('../../stores/saleStore')` at file top. The mock factory creates a fresh instance per `beforeEach`.

**Async operations** — `waitFor(() => expect(...))` for store calls that trigger async effects (fetchConfig, login). `userEvent` for click/type interactions.

**Toast** — `vi.mock('react-hot-toast')` with `vi.fn()` per method (`success`, `error`). Assertions via `expect(toast.success).toHaveBeenCalledWith(...)`.

**Router** — `renderWithRouter(<Component />, { route: '/path' })` for components using `Link`, `useNavigate`, `useLocation`. ProtectedRoute needs a nested `<Outlet>` mock.

**Form validation** — `userEvent.type()` + `userEvent.click()` then assert error messages from react-hook-form.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/test/mocks/saleStoreMock.ts` | Create | Mock factory for useSaleStore |
| `src/test/mocks/authStoreMock.ts` | Create | Mock factory for useAuthStore |
| `src/test/mocks/storeConfigStoreMock.ts` | Create | Mock factory for useStoreConfig |
| `src/test/mocks/index.ts` | Create | Barrel re-export |
| `src/components/pos/CartPanel.test.tsx` | Create | CartPanel tests |
| `src/components/pos/PaymentBar.test.tsx` | Create | PaymentBar tests |
| `src/pages/LoginPage.test.tsx` | Create | LoginPage tests |
| `src/components/auth/ProtectedRoute.test.tsx` | Create | ProtectedRoute tests |
| `src/components/layout/SideBar.test.tsx` | Create | SideBar tests |
| `src/components/pos/ProductSearch.test.tsx` | Create | ProductSearch tests |

## Interfaces / Contracts

Mock factories must implement these interfaces (from `src/stores/`):

```ts
// SaleStore mock — subset used by tested components
interface MockSaleStore {
  cart: CartItem[];
  selectedPaymentMethod: 'CASH' | 'CREDIT';
  selectedClient: Client | null;
  isSubmitting: boolean;
  cashReceived: number;
  change: number;
  error: string | null;
  removeFromCart: MockFn;
  updateQuantity: MockFn;
  clearCart: MockFn;
  getCartTotal: MockFn<number>;
  setPaymentMethod: MockFn;
  setCashReceived: MockFn;
  completeSale: MockFn;
  setSelectedClient: MockFn;
}

// AuthStore mock — subset
interface MockAuthStore {
  login: MockFn;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  setError: MockFn;
}

// StoreConfig mock — subset
interface MockStoreConfig {
  config: StoreConfig | null;
  fetchConfig: MockFn;
}
```

## Data Flow (Test Lifecycle)

    beforeEach()
      ├── Reset store state (setState to defaults)
      ├── vi.clearAllMocks()
      └── Create fresh mock instances

    Test body
      ├── renderWithRouter(<Component />, { route })
      ├── userEvent interactions (click, type, etc.)
      └── Assert: DOM content + mock function calls

## Migration / Rollout

No migration required. Tests are additive — no production code changes. Mock factories in `src/test/mocks/` are test-only infrastructure.

## Open Questions

None. All design decisions resolved against existing codebase patterns.
