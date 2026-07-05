# Sale Cancellation Specification

## Purpose

Allow cancelling completed sales with atomic restoration of stock and client debt adjustment.

## Requirements

### Requirement: Cancel Sale Endpoint

The system SHALL expose a POST endpoint at `/api/sales/{id}/cancel/` that transitions a COMPLETED sale to CANCELLED status.

The operation MUST be wrapped in `transaction.atomic()` to ensure all-or-nothing behavior.

#### Scenario: Cancel a CREDIT sale

- GIVEN a sale with `status=COMPLETED` and `payment_method=CREDIT` and a linked client
- WHEN POST `/api/sales/{id}/cancel/` is called
- THEN `sale.status` is set to `CANCELLED`
- AND for each `SaleItem`, `product.stock` is incremented by `SaleItem.quantity`
- AND `client.current_debt` is decremented by `sale.total`
- AND the response returns 200 with the updated sale

#### Scenario: Cancel a CASH sale

- GIVEN a sale with `status=COMPLETED` and `payment_method=CASH`
- WHEN POST `/api/sales/{id}/cancel/` is called
- THEN `sale.status` is set to `CANCELLED`
- AND stock is restored for each item
- AND `client.current_debt` is NOT modified (CASH sales don't affect debt)

#### Scenario: Sale already cancelled

- GIVEN a sale with `status=CANCELLED`
- WHEN POST `/api/sales/{id}/cancel/` is called
- THEN the response returns 400 with error "La venta ya está cancelada"

#### Scenario: Sale not found

- GIVEN no sale with the given ID exists
- WHEN POST `/api/sales/{id}/cancel/` is called
- THEN the response returns 404

#### Scenario: Sale in PENDING status

- GIVEN a sale with `status=PENDING`
- WHEN POST `/api/sales/{id}/cancel/` is called
- THEN the response returns 400 with error indicating only COMPLETED sales can be cancelled

#### Scenario: Client was deleted (SET_NULL)

- GIVEN a COMPLETED CREDIT sale where `sale.client` is NULL (client was deleted)
- WHEN POST `/api/sales/{id}/cancel/` is called
- THEN stock is restored
- AND debt adjustment is skipped (no client to adjust)
- AND `sale.status` is set to `CANCELLED`

#### Scenario: FiadoPayments remain linked

- GIVEN a COMPLETED CREDIT sale with linked `FiadoPayment` records
- WHEN POST `/api/sales/{id}/cancel/` is called
- THEN the `FiadoPayment.sale` foreign key is NOT cleared
- AND the payments remain visible in the client's payment history

### Requirement: Cancel Button in Sales History

The frontend SHALL display a cancel action button in `SalesHistoryPage` for each COMPLETED sale.

#### Scenario: Cancel button visible for COMPLETED sales

- GIVEN the SalesHistoryPage is loaded
- WHEN a sale row has `status=COMPLETED`
- THEN a cancel button is visible in the actions column

#### Scenario: Cancel triggers confirmation dialog

- GIVEN the user clicks the cancel button on a COMPLETED sale
- WHEN the confirmation dialog appears
- THEN the dialog shows the sale ID and asks for confirmation
- AND the sale is NOT cancelled until the user confirms

#### Scenario: Cancel success refreshes list

- GIVEN the user confirms cancellation
- WHEN the API call succeeds
- THEN the sales list is refreshed
- AND a success toast is displayed

#### Scenario: Cancel failure shows error

- GIVEN the user confirms cancellation
- WHEN the API call fails
- THEN an error toast is displayed
- AND the sales list is NOT modified

## Edge Cases

| Case | Behavior |
|------|----------|
| Concurrent cancellation requests | `transaction.atomic()` prevents double-cancel via DB integrity |
| Sale has 0 items (edge case) | Status set to CANCELLED, no stock to restore |
| Product was deleted after sale | `SaleItem.product` uses `PROTECT`, so this cannot happen |
| FiadoPayment.client is NULL | Payment stays linked to sale, no debt adjustment needed |
