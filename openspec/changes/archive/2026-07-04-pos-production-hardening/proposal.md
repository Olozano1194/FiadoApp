# Proposal: POS Production Hardening

## Intent

The POS handles basic sales but has critical production gaps: credit-limit errors are silently swallowed, sales can't be cancelled, fiado payments require leaving the POS flow, and clients lack a history view. These gaps block production deployment for Colombian tiendas de barrio.

## Scope

### In Scope
1. Surface backend credit-limit errors in the POS frontend (Feature 1)
2. New cancel-sale backend action + frontend cancel button (Feature 2)
3. Quick fiado payment button in POS PaymentBar (Feature 3)
4. Client full transaction history page (Feature 4)

### Out of Scope
- Receipt printing, barcode scanners, multi-user roles
- Mixed cash+credit payments, sale editing
- Email/SMS notifications

## Capabilities

### New Capabilities
- `credit-limit-enforcement`: Frontend surfaces backend credit-validation errors during POS checkout
- `sale-cancellation`: Cancel completed sales — restore stock, adjust client debt, set CANCELLED status
- `fiado-quick-payment`: Register fiado payments from the POS PaymentBar without leaving the checkout
- `client-transaction-history`: Unified sales + payments timeline page per client

### Modified Capabilities
None — all four features are new capabilities.

## Approach

**Feature 1** (frontend-only): Fix `saleStore.completeSale()` catch to extract `error.response?.data` and propagate the real backend message to PaymentBar's `toast.error()`.

**Feature 2**: Backend `SaleViewSet.cancel` action with `transaction.atomic()` — restore stock (increment each SaleItem's product), reduce `client.current_debt` if CREDIT, set `status = CANCELLED`. Frontend cancel button + confirmation dialog in SalesHistoryPage; refresh list after cancel.

**Feature 3**: Add "Registrar abono" button in PaymentBar when CREDIT client is selected. Opens existing `PaymentModal` pre-filled with that client. On payment success, refresh client debt in store.

**Feature 4**: New `ClientHistoryPage.tsx` calling existing `/sales/history/?client_id=` and `/fiado-payments/?client=` endpoints, merged client-side into a unified timeline. New route `/clientes/:id/historial` + link from ClientsPage row.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/stores/saleStore.ts` | Modified | Error handling + cancelSale action |
| `frontend/src/components/pos/PaymentBar.tsx` | Modified | Add quick payment button |
| `frontend/src/pages/SalesHistoryPage.tsx` | Modified | Add cancel action column |
| `frontend/src/pages/ClientsPage.tsx` | Modified | Link to client history |
| `coreApp/views/sales.py` | Modified | New `cancel` action on SaleViewSet |
| `coreApp/urls.py` | Modified | Routes for cancel + history endpoints |
| `frontend/src/pages/ClientHistoryPage.tsx` | New | Client transaction history page |
| `frontend/src/App.tsx` | Modified | Route for client history |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Feature 2 atomicity: partial stock restore | Low | Wrap in `transaction.atomic()` |
| Credits run out mid-implementation | Med | Implement in priority order; ship per-feature |

## Rollback Plan

Per-feature revert: revert individual commits. Feature 2 (cancel) would need a DB script to undo any cancelled sales if rolled back after deployment.

## Dependencies

None — all four features are independent with no blocking dependencies.

## Success Criteria

- [ ] Frontend shows backend credit-limit error message in POS toast
- [ ] Can cancel a COMPLETED sale → stock restored, client debt reduced, status CANCELLED
- [ ] Quick fiado payment button visible in POS PaymentBar when CREDIT client is selected
- [ ] Client history page accessible from ClientsPage, displays sales + payments timeline
