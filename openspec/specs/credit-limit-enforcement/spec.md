# Credit Limit Enforcement Specification

## Purpose

Ensure the POS frontend surfaces backend credit-limit validation errors to the user during checkout, instead of silently swallowing them.

## Requirements

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

## Edge Cases

| Case | Behavior |
|------|----------|
| Backend returns error as string (not object) | Extract and display the string directly |
| Backend returns error as `{ items: "..." }` | Display the nested message |
| `error.response` is undefined | Fall back to generic message |
