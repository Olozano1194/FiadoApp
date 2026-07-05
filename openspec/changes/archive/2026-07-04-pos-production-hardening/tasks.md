# Tasks: POS Production Hardening

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~200 (5 + 0 + 65 + 130) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr-default |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Credit Limit Error Propagation (Feature 1) ✅

- [x] 1.1 Fix error extraction in `frontend/src/stores/saleStore.ts` — change `catch` block in `completeSale()` to extract `error.response?.data?.detail || error.response?.data || 'Error al procesar la venta'`
- [x] 1.2 Verify `PaymentBar.tsx` already displays `error` from store via toast (no change needed, confirm current toast.error reads `error` from store)

**Files**: `frontend/src/stores/saleStore.ts`
**Depends on**: None
**Done when**: A 400 credit-limit error from backend shows the backend message in the POS toast, not a generic string.

## Phase 2: Quick Fiado Payment Button (Feature 3) ❌ (Saltada por decisión del usuario)

- [x] ~~2.1-2.4~~ No implementado — el botón en PaymentBar no cuadraba con el flujo POS. Ya existe en ClientsPage.

## Phase 3: Sale Cancellation (Feature 2) ✅

- [x] 3.1 Add `cancel` action to `SaleViewSet` in `coreApp/views/sales.py` — `@action(detail=True, methods=['post'], url_path='cancel')` with `transaction.atomic()`: verify status == COMPLETED, set CANCELLED, restore stock per SaleItem, reduce `client.current_debt` if CREDIT (cap at 0 to prevent negative debt)
- [x] 3.2 Add `cancelSale(id: number)` function to `frontend/src/api/sales.api.ts` — `POST /sales/{id}/cancel/`
- [x] 3.3 ~~Add `cancelSale` action to `frontend/src/stores/saleStore.ts`~~ No needed — SalesHistoryPage calls API directly
- [x] 3.4 Add "Acciones" column with cancel button to `frontend/src/pages/SalesHistoryPage.tsx` — visible only for COMPLETED sales, uses `window.confirm()`, calls `cancelSale`, refreshes list on success, shows toast
- [x] Fix: `SaleHistoryItem` interface and template — field names no coincidían con API (`cliente` → `client_name`, `estado` → `status`, etc.)
- [x] Fix: debt reduction cap at 0 (`max(0, debt - total)`) — evita deuda negativa cuando ya hubo abonos

**Files**: `coreApp/views/sales.py`, `frontend/src/api/sales.api.ts`, `frontend/src/models/sale.ts`, `frontend/src/pages/SalesHistoryPage.tsx`
**Depends on**: None

## Phase 4: Client Full History Page (Feature 4) ✅

- [x] 4.1 Add "Historial" link to actions column in `frontend/src/pages/ClientsPage.tsx` — use `Link` to `/clientes/:id/historial`
- [x] 4.2 Add route `clientes/:id/historial` to `frontend/src/App.tsx` pointing to `ClientHistoryPage`
- [x] 4.3 Create `frontend/src/pages/ClientHistoryPage.tsx` — fetch `getSalesHistory(1, 100, clientId)` + `getPayments(clientId)` via `Promise.all`, merge into timeline sorted by date, render timeline with type/date/amount
- [x] 4.4 Update `getSalesHistory` in `frontend/src/api/sales.api.ts` to accept optional `clientId` parameter for `?client_id=N`

**Files**: `frontend/src/pages/ClientsPage.tsx`, `frontend/src/App.tsx`, `frontend/src/pages/ClientHistoryPage.tsx` (NEW), `frontend/src/api/sales.api.ts`
**Depends on**: None

## Rollback Plan

- **Feature 1**: Revert `saleStore.ts` catch block to original `catch { ... }` — zero impact on other features.
- **Feature 2 (Cancel)**: Remove `cancel` action from `sales.py`, remove `cancelSale` from `sales.api.ts`, remove actions column from `SalesHistoryPage.tsx`.
- **Feature 4 (History)**: Remove `ClientHistoryPage.tsx`, delete route from `App.tsx`, remove link from `ClientsPage.tsx`, revert `getSalesHistory` signature.

Each feature is independently revertable with no cross-dependencies.
