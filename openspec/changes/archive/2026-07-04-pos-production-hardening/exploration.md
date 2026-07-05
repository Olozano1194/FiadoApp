## Exploration: POS Production Hardening

### Current State

**1. Credit limit enforcement**: Already implemented on the backend in `SaleCreateSerializer.create()` (serializers.py:120-130). When a CREDIT sale is created, it checks `client.current_debt + sale.total > client.credit_limit` and raises a `ValidationError` if exceeded. The `client.current_debt` is then incremented. **However**, the frontend error handling in `saleStore.ts` `completeSale()` catches errors generically (`'Error al procesar la venta'`) and the actual backend error message (e.g., "El cliente ha excedido su límite de crédito...") is swallowed. The PaymentBar component shows `toast.error(error || 'Error...')` but the store never propagates the response body.

**2. Sale cancellation / returns**: No cancellation endpoint exists. The `Sale` model already has a `CANCELLED` status choice. Stock restoration logic would need to be implemented — currently stock is only decremented on sale creation. `FiadoPayment` model has an optional `sale` FK but no cancellation logic exists. The `SalesHistoryPage` table has no action column for cancelling.

**3. Quick fiado payment button in POS**: A `PaymentModal` component already exists at `components/ui/PaymentModal.tsx` and is used in `ClientsPage`. `FiadoPaymentViewSet` has a `perform_create` that already decrements `client.current_debt`. No integration exists in the POS page.

**4. Client full history page**: No dedicated client detail/history page exists. The backend `SaleViewSet.history` action can filter by `?client_id=N` but returns only sales, not payments. The `FiadoPaymentViewSet` supports filtering by `?client=` via DRF's default filtering. There's no combined endpoint for a client's full transaction history.

### Affected Areas

**Backend:**
- `coreApp/serializers.py` — Credit limit validation already exists (line 120-130). No changes needed for feature 1 backend.
- `coreApp/views/sales.py` — Needs new `cancel` action on SaleViewSet (feature 2). May need a `client_history` action or dedicated view (feature 4).
- `coreApp/views/payments.py` — Minor: ensure `FiadoPaymentViewSet` supports filtering by client for feature 4 (already does via DRF default — `?client=`).
- `coreApp/views/clients.py` — May need a `history` action or new endpoint for feature 4.
- `coreApp/urls.py` — New routes for cancel action and client history endpoint.
- `coreApp/models.py` — No model changes needed. Existing `Sale.status` has `CANCELLED`, `FiadoPayment.sale` FK exists.

**Frontend:**
- `frontend/src/stores/saleStore.ts` — Fix error handling to surface backend messages (feature 1). Add `cancelSale` action (feature 2).
- `frontend/src/stores/clientStore.ts` — May need a `fetchClientHistory` action (feature 4).
- `frontend/src/api/sales.api.ts` — Add `cancelSale(id)` (feature 2), optionally `getClientSalesHistory(clientId)` (feature 4).
- `frontend/src/api/clients.api.ts` — Add `getClientHistory(id)` or similar (feature 4).
- `frontend/src/api/fiado-payments.api.ts` — Add `getClientPayments(clientId)` if needed (feature 4).
- `frontend/src/pages/PosPage.tsx` — Integrate quick payment button (feature 3).
- `frontend/src/components/pos/PaymentBar.tsx` — Show credit limit info, quick payment trigger (features 1, 3).
- `frontend/src/pages/SalesHistoryPage.tsx` — Add cancel action column (feature 2).
- `frontend/src/pages/ClientsPage.tsx` — Link to new history page (feature 4).
- `frontend/src/App.tsx` — Add route for client history page (feature 4).
- `frontend/src/models/sale.ts` — May need type updates for cancel payload/response.
- `frontend/src/models/client.ts` — May need type updates for history response.
- `frontend/src/models/fiado-payment.ts` — Already has the needed shape.

**New files:**
- `frontend/src/pages/ClientHistoryPage.tsx` — New page (feature 4).

### Feature-by-Feature Analysis

#### Feature 1: Credit limit enforcement in POS

| Aspect | Detail |
|--------|--------|
| Backend status | ✅ **Already implemented** in `SaleCreateSerializer.create()`. Validation + debt increment exist. |
| Frontend gap | Error message swallowed. `saleStore.completeSale()` catch block sets generic message. |
| Fix | In `completeSale()`, extract error from axios response (`error.response?.data`). `PaymentBar` already reads `error` from store and `toast.error(error)`. |

**Effort**: Very Low (frontend-only fix, ~15 min)

#### Feature 2: Sale cancellation / returns

| Aspect | Detail |
|--------|--------|
| Backend changes needed | New `cancel` action on `SaleViewSet`: verify COMPLETED, restore stock (increment `product.stock` for each SaleItem), reduce `client.current_debt` if CREDIT, set `sale.status = CANCELLED`. Handle FiadoPayment references (sale FK is SET_NULL so no cascade issue, but may want to annotate). |
| Serializer | No new serializer needed; use `SaleSerializer` for response or a custom cancel response. |
| Risk | Must be atomic (single transaction). Must validate sale isn't already CANCELLED. Must handle the case where client was deleted (client FK is SET_NULL). |
| Frontend changes | Add `cancelSale` API call, add cancel button in SalesHistoryPage row, add confirmation dialog, refresh list after cancel. |

**Effort**: Medium

#### Feature 3: Quick fiado payment button in POS

| Aspect | Detail |
|--------|--------|
| Approach A | Add a "Cobrar Fiado" button in `PaymentBar` when a CREDIT client is selected and cart is empty (or always). Opens existing `PaymentModal`. |
| Approach B | Add a floating action button in `PosPage` that opens `PaymentModal` with a client selector. |
| Recommendation | Approach A is simpler and context-aware. When the user selects a CREDIT client in PaymentBar, show a small "Registrar abono" link/button. Opens `PaymentModal` with that client pre-selected. When payment is made, refresh client debt in store. |
| Effort | Low (~1-2 hours). Reuses existing `PaymentModal`, existing `FiadoPaymentViewSet.create`, and existing `ClientSelect`. |

#### Feature 4: Client full history page

| Aspect | Detail |
|--------|--------|
| Approach A | New backend endpoint (`/clients/{id}/history/`) that returns combined sales + payments. Custom serializer. |
| Approach B | Consume existing endpoints from the frontend: `SaleViewSet.history?client_id=N` and `FiadoPaymentViewSet?client=N`. Merge/filter on the client. |
| Recommendation | Approach B is simpler and avoids new backend work. The frontend page calls both endpoints and renders a unified timeline. This is more fragile (two API calls) but zero backend changes. If performance is a concern, Approach A is better. |
| Frontend | New `ClientHistoryPage.tsx`, new route `/clientes/:id/historial`, link from ClientsPage table. |

**Effort**: Medium (Approach B) or Medium-High (Approach A)

### Dependencies Between Features

- Feature 1 (credit limit) is **independent** — frontend-only error fix.
- Feature 2 (cancellation) is **independent** — new backend action + frontend button.
- Feature 3 (quick payment) is **independent** — reuses existing components.
- Feature 4 (client history) is **independent** — new page consuming existing endpoints.

**No blocking dependencies exist between any of the 4 features.** They can be implemented in any order or in parallel.

### Recommended Implementation Order

1. **Feature 1** (frontend error fix only) — smallest change, highest impact for correctness.
2. **Feature 3** (quick payment) — reuses existing code, gives immediate UX improvement.
3. **Feature 2** (cancellation) — new backend action, moderate effort.
4. **Feature 4** (client history) — new page, can be done last or in parallel with 2.

### Risks

- **Feature 2 atomicity**: Sale cancellation must be wrapped in `transaction.atomic()`. If stock restoration fails, the entire cancellation must roll back. Must also handle edge cases like a client that was deleted since the sale (client FK is SET_NULL, so `sale.client` could be None).
- **Feature 2 FiadoPayments**: If FiadoPayments reference the cancelled sale, what happens? Currently `FiadoPayment.sale` is SET_NULL on sale delete, but a cancel is not a delete. Need to decide: leave payments linked (they were real payments) or unlink them. Recommendation: leave them linked but add a note or filter them from "active" reports.
- **Feature 4 data shape**: The `SaleViewSet.history` action currently returns a flat list with translated field names (cliente, fecha, hora, etc.). If consuming from frontend, that's fine. But a combined endpoint would need a unified serializer.
- **Delivery budget**: Sum of all 4 features is ~250-400 lines changed. Likely fits in a single PR, but chained PRs could be used per feature for cleaner review.

### Ready for Proposal

Yes. All 4 features are well-understood, the codebase has been read, and the approach for each is clear. The orchestrator should tell the user:
- Feature 1 backend is already done — only frontend error handling needs fixing
- Features 2-4 have clear implementation paths
- Recommend splitting into a single change (`pos-production-hardening`) with 4 sub-tasks
