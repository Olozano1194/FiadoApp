# Design: POS Production Hardening

## Technical Approach

Four independent features fixing production gaps in the POS. Feature 1 is a one-line catch fix. Feature 2 adds a cancel-sale backend action inside `transaction.atomic()`. Feature 3 reuses the existing `PaymentModal` triggered from `PaymentBar`. Feature 4 is a new frontend page that merges two existing API calls into a timeline.

## Architecture Decisions

### Decision: Feature 1 — Error Propagation Strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Extract `error.response?.data` in catch | Minimal change, backend already sends the message | **Chosen** |
| Add a custom axios interceptor for validation errors | Over-engineered for one use case | Rejected |
| Create a store-level error enum | Adds abstraction layer for no benefit | Rejected |

**Rationale**: `SaleCreateSerializer.create()` already raises `serializers.ValidationError` with the full message (lines 120-128). DRF renders this as `{ detail: "..." }` in the response body. The catch block in `saleStore.ts` just needs to extract it.

### Decision: Feature 2 — Cancel Endpoint Architecture

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `@action(detail=True)` on `SaleViewSet` | Follows existing DRF pattern, clean URL | **Chosen** |
| Standalone `APIView` | More boilerplate, no benefit over action | Rejected |
| Soft-delete with `is_active` flag | Already have `Status.CANCELLED`, no new field needed | Rejected |

**Rationale**: The `Sale` model already has `Status.CANCELLED`. A DRF `@action(detail=True)` auto-generates `POST /api/sales/{id}/cancel/`. The atomic transaction wraps stock restore + debt reduction.

### Decision: Feature 3 — Quick Payment Integration

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Reuse existing `PaymentModal` component | Zero new API, zero new component, already works | **Chosen** |
| New inline payment form in `PaymentBar` | Duplicate logic, maintenance cost | Rejected |
| New `/fiado-payments/quick` endpoint | Over-engineered for same operation | Rejected |

**Rationale**: `PaymentModal` already accepts a `client` prop, calls `paymentsApi.createPayment()`, and fires `onSuccess`. We just mount it from `PaymentBar` when a CREDIT client is selected.

### Decision: Feature 4 — Client-Side Merge vs New Backend Endpoint

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Client-side `Promise.all` + merge | No backend change, reuse existing endpoints | **Chosen** |
| New `/api/clients/{id}/history` endpoint | Extra backend code, serializes same data twice | Rejected |

**Rationale**: User decision — frontend merges 2 existing calls (`/sales/history/?client_id=N` + `/fiado-payments/?client=N`). No new backend work.

### Decision: Feature 2 — FiadoPayments Linked to Cancelled Sales

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Leave `FiadoPayment.sale` FK as-is | Payments represent real cash collected, historically accurate | **Chosen** |
| Nullify `FiadoPayment.sale` FK on cancel | Loses audit trail, misleading about payment origin | Rejected |

**Rationale**: User explicit decision. A payment against a credit sale is real money — cancelling the sale doesn't un-collect the payment.

## Data Flow

### Feature 1 — Error Propagation

```
SaleCreateSerializer ValidationError
  → DRF response: { detail: "El cliente ha excedido..." }
  → axios catch: error.response.data.detail
  → saleStore: set({ error: message })
  → PaymentBar: toast.error(error)
```

### Feature 2 — Sale Cancellation

```
Cancel button click
  → Confirmation dialog (window.confirm or custom)
  → POST /api/sales/{id}/cancel/
  → SaleViewSet.cancel: transaction.atomic()
    → Verify status == COMPLETED → CANCELLED
    → For each SaleItem: product.stock += quantity
    → If CREDIT + client: client.current_debt -= sale.total
  → Response 200
  → Refresh sales table (refetch or optimistic update)
```

### Feature 3 — Quick Fiado Payment

```
CREDIT client selected in PaymentBar
  → "Registrar abono" button appears
  → Click → mount PaymentModal(client={selectedClient})
  → User fills amount → POST /api/fiado-payments/
  → FiadoPaymentViewSet.perform_create: client.current_debt -= amount
  → onSuccess → fetchClients() → debt updates in UI
```

### Feature 4 — Client History Timeline

```
Navigate to /clientes/:id/historial
  → ClientHistoryPage mounts
  → Promise.all([
      getSalesHistory(1, 100, clientId),
      getPayments(clientId)
    ])
  → Merge into unified array: [{ type: 'sale'|'payment', date, ... }]
  → Sort by date descending
  → Render timeline
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `coreApp/views/sales.py` | Modify | Add `cancel` action with `transaction.atomic()` |
| `coreApp/urls.py` | Modify | No change needed — `@action` auto-registers |
| `frontend/src/stores/saleStore.ts` | Modify | Fix `completeSale()` catch to extract `error.response?.data` |
| `frontend/src/components/pos/PaymentBar.tsx` | Modify | Add "Registrar abono" button for CREDIT clients |
| `frontend/src/pages/SalesHistoryPage.tsx` | Modify | Add "Acciones" column with cancel button |
| `frontend/src/pages/ClientsPage.tsx` | Modify | Add "Historial" link per client row |
| `frontend/src/pages/ClientHistoryPage.tsx` | Create | New unified timeline page |
| `frontend/src/api/sales.api.ts` | Modify | Add `cancelSale(id)` function |
| `frontend/src/App.tsx` | Modify | Add route `/clientes/:id/historial` |

## Interfaces / Contracts

### Feature 2 — Cancel Endpoint

```
POST /api/sales/{id}/cancel/
Authorization: Bearer <token>

Response 200:
{ "detail": "Venta cancelada correctamente" }

Response 400:
{ "detail": "Solo se pueden cancelar ventas completadas" }

Response 404:
{ "detail": "No found." }
```

### Feature 4 — Timeline Item Shape

```typescript
type TimelineItem =
  | { type: 'sale'; id: number; date: string; total: string; payment_method: string; items?: SaleItem[] }
  | { type: 'payment'; id: number; date: string; amount: string; notes?: string };
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `completeSale` error extraction | Mock axios error with response.data.detail |
| Integration | Cancel action: stock restore, debt reduce | DRF test client: create sale → cancel → assert product.stock, client.current_debt |
| Integration | Cancel action: already cancelled | Assert 400 response |
| E2E | Cancel flow from SalesHistoryPage | Playwright: click cancel → confirm → verify row status changes |
| E2E | Quick payment from PaymentBar | Playwright: select CREDIT client → click abono → submit → verify debt |

## Migration / Rollout

No migration required. `Sale.Status.CANCELLED` already exists. No new models or fields.

## Open Questions

- [ ] Cancel button UX: `window.confirm()` or custom confirmation dialog? (Project uses `window.confirm` elsewhere — follow existing pattern.)
- [ ] Feature 4 page size: should `getSalesHistory` call use `page_size=100` (fetch all) or keep pagination? (Recommend 100 for typical client history size.)
