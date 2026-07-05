# POS Production Hardening — Combined Spec

## Feature 1: Credit Limit Error Propagation

### Requirement: Credit Limit Error Propagation

The frontend MUST propagate the backend credit-limit error message to the user when a CREDIT sale exceeds the client's credit limit.

The system SHALL extract `error.response?.data` from the axios error in `saleStore.completeSale()` and display it via the toast notification in `PaymentBar`.

#### Scenario: Credit limit exceeded shows backend message

- GIVEN a CREDIT client with `current_debt` near `credit_limit`
- WHEN the user completes a sale that would exceed the credit limit
- THEN the backend returns a 400 with message "El cliente ha excedido su límite de crédito..."
- AND the frontend displays that exact message in a toast error notification
- AND the sale is NOT created

#### Scenario: Non-credit-limit error shows backend message

- GIVEN a sale that fails for a reason OTHER than credit limit (e.g. stock shortage)
- WHEN the backend returns a 400 with a different error
- THEN the frontend displays the backend's error message if available
- AND falls back to "Error al procesar la venta" if no message is present

#### Scenario: Network error shows generic message

- GIVEN the backend is unreachable
- WHEN `completeSale()` fails with a network error
- THEN the frontend displays "Error al procesar la venta"

**Edge Cases**: Backend returns error as string (display directly); returns `{ items: "..." }` (display nested message); `error.response` is undefined (fall back to generic).

---

## Feature 2: Sale Cancellation

### Requirement: Cancel Sale Endpoint

The system SHALL expose a POST endpoint at `/api/sales/{id}/cancel/` that transitions a COMPLETED sale to CANCELLED status. The operation MUST be wrapped in `transaction.atomic()`.

#### Scenario: Cancel a CREDIT sale

- GIVEN a sale with `status=COMPLETED`, `payment_method=CREDIT`, and a linked client
- WHEN POST `/api/sales/{id}/cancel/` is called
- THEN `sale.status` = `CANCELLED`
- AND each `SaleItem.product.stock` is incremented by `SaleItem.quantity`
- AND `client.current_debt` is decremented by `sale.total`

#### Scenario: Cancel a CASH sale

- GIVEN a sale with `status=COMPLETED` and `payment_method=CASH`
- WHEN POST `/api/sales/{id}/cancel/` is called
- THEN `sale.status` = `CANCELLED`, stock is restored, `client.current_debt` is NOT modified

#### Scenario: Sale already cancelled → 400 "La venta ya está cancelada"

#### Scenario: Sale not found → 404

#### Scenario: Sale in PENDING status → 400 (only COMPLETED can be cancelled)

#### Scenario: Client was deleted (SET_NULL)

- GIVEN a CREDIT sale where `sale.client` is NULL
- WHEN cancelled
- THEN stock is restored, debt adjustment is skipped, status = CANCELLED

#### Scenario: FiadoPayments remain linked (user decision)

- GIVEN a CREDIT sale with linked `FiadoPayment` records
- WHEN cancelled
- THEN `FiadoPayment.sale` FK is NOT cleared; payments stay in history

### Requirement: Cancel Button in Sales History

The frontend SHALL display a cancel button in `SalesHistoryPage` for each COMPLETED sale, with a confirmation dialog.

#### Scenario: Cancel button visible → confirmation dialog → success refreshes list

#### Scenario: Cancel failure → error toast, list unchanged

**Edge Cases**: Concurrent cancels prevented by `transaction.atomic()`; 0-item sales handled; `SaleItem.product` uses `PROTECT` (can't be deleted).

---

## Feature 3: Quick Fiado Payment

### Requirement: Quick Payment Button in PaymentBar

The system SHALL display a "Registrar abono" button in `PaymentBar` when a CREDIT client is selected. It SHALL open the existing `PaymentModal` pre-filled with that client.

#### Scenario: Button visible only when CREDIT client selected

#### Scenario: Click opens PaymentModal with client pre-selected

#### Scenario: Payment success refreshes client debt in store and closes modal

**Edge Cases**: Debt=0 still shows button; API errors handled by interceptor; modal close without payment = no state change.

---

## Feature 4: Client Transaction History

### Requirement: Client History Page

The system SHALL provide `/clientes/:id/historial` showing a unified timeline from `GET /api/sales/history/?client_id=N` and `GET /api/fiado-payments/?client=N`.

#### Scenario: Page displays client info (name, debt, credit_limit, last payment)

#### Scenario: Unified timeline merges sales + payments sorted by date (newest first)

#### Scenario: Client with only sales or only payments → no errors for empty side

#### Scenario: Client not found → "Cliente no encontrado"

### Requirement: Link from Clients Page

The ClientsPage action column SHALL include a history link navigating to `/clientes/:id/historial`.

**Edge Cases**: Paginated API results; partial API failures (one endpoint errors, other succeeds); both fail → combined error state.
