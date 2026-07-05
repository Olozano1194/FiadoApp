# POS Component Tests Specification

## Purpose

Behavioral test coverage for POS components (CartPanel, PaymentBar, ProductSearch). Specs define observable behavior: renders, events, state transitions, edge cases. Tests use Vitest + @testing-library/react + jsdom.

## Requirements

### Requirement: CartPanel Empty State

CartPanel SHALL render an empty-state message when the cart has no items.

#### Scenario: Empty cart shows message

- GIVEN the cart is empty
- WHEN CartPanel renders
- THEN "Carrito vacío" text is visible
- AND no product rows exist

### Requirement: CartPanel Item Display

CartPanel SHALL render each cart item with name, price, quantity controls, subtotal, and profit.

#### Scenario: Single item renders all fields

- GIVEN the cart has one item (Product A, price 10000, qty 2)
- WHEN CartPanel renders
- THEN product name "Product A" is visible
- AND price, quantity (2), subtotal, and profit are displayed

#### Scenario: Multiple items render rows

- GIVEN the cart has 3 items
- WHEN CartPanel renders
- THEN 3 item rows exist

### Requirement: CartPanel Quantity Controls

CartPanel SHALL provide +/- buttons that call `updateQuantity` with the correct delta.

#### Scenario: Increment quantity

- GIVEN an item with qty 1 and stock 5
- WHEN the user clicks "+"
- THEN `updateQuantity` is called with qty 2

#### Scenario: Decrement quantity

- GIVEN an item with qty 3
- WHEN the user clicks "-"
- THEN `updateQuantity` is called with qty 2

#### Scenario: + button disabled at stock limit

- GIVEN an item with qty equal to product.stock
- WHEN CartPanel renders
- THEN the "+" button is disabled

### Requirement: CartPanel Remove and Clear

CartPanel SHALL provide per-item remove and a clear-all action.

#### Scenario: Remove single item

- GIVEN the cart has items
- WHEN the user clicks remove on an item
- THEN `removeFromCart` is called with that item's id

#### Scenario: Clear entire cart

- GIVEN the cart has items
- WHEN the user clicks clear cart
- THEN `clearCart` is called

### Requirement: CartPanel Totals

CartPanel SHALL display total, total profit, and margin percentage.

#### Scenario: Totals reflect cart contents

- GIVEN the cart has items with profit > 0
- WHEN CartPanel renders
- THEN total amount, total profit, and margin % are visible
- AND profit color is green (positive)

#### Scenario: Negative profit styled red

- GIVEN the cart has items with profit < 0
- WHEN CartPanel renders
- THEN profit color is red

#### Scenario: All monetary values use formatCurrency

- GIVEN any cart state
- WHEN CartPanel renders
- THEN all price/total values are formatted via formatCurrency

### Requirement: PaymentBar Method Toggle

PaymentBar SHALL toggle between Efectivo and Crédito payment methods.

#### Scenario: Toggle to Efectivo

- GIVEN current method is Crédito
- WHEN user selects Efectivo
- THEN `setPaymentMethod` is called with "efectivo"

#### Scenario: Toggle to Crédito

- GIVEN current method is Efectivo
- WHEN user selects Crédito
- THEN `setPaymentMethod` is called with "credito"

### Requirement: PaymentBar Cash Mode

PaymentBar SHALL show amount-received input and change display in cash mode.

#### Scenario: Cash change calculated

- GIVEN total is 50000 and method is efectivo
- WHEN user enters 60000 in amount received
- THEN change display shows 10000
- AND input is formatted via formatCashInput (Intl.NumberFormat es-CO)

### Requirement: PaymentBar Credit Mode

PaymentBar SHALL show client selection UI in credit mode.

#### Scenario: Credit without client

- GIVEN method is credito and no client selected
- WHEN PaymentBar renders
- THEN "Seleccionar Cliente" button is visible

#### Scenario: Credit with client selected

- GIVEN method is credito and client "Juan" is selected
- WHEN PaymentBar renders
- THEN "Juan" is displayed

#### Scenario: ClientSelect modal opens

- GIVEN method is credito
- WHEN user clicks "Seleccionar Cliente"
- THEN ClientSelect modal opens

### Requirement: PaymentBar Submit Guard

PaymentBar SHALL disable the Complete Sale button when preconditions are not met.

#### Scenario: Cart empty disables button

- GIVEN cart is empty
- WHEN PaymentBar renders
- THEN submit button is disabled

#### Scenario: Cash insufficient disables button

- GIVEN total is 50000 and method is efectivo
- WHEN amount received is 30000
- THEN submit button is disabled

#### Scenario: Credit without client disables button

- GIVEN method is credito and no client selected
- WHEN PaymentBar renders
- THEN submit button is disabled

### Requirement: PaymentBar Submit State

PaymentBar SHALL show loading indicator during submission and toast on success.

#### Scenario: Loading spinner during submission

- GIVEN isSubmitting is true
- WHEN PaymentBar renders
- THEN button shows spinner and "Procesando..."

#### Scenario: Success toast after sale

- GIVEN a successful sale completes
- WHEN PaymentBar processes
- THEN toast.success is shown

### Requirement: ProductSearch Input

ProductSearch SHALL render a search input that captures user queries.

#### Scenario: Search input captures text

- GIVEN ProductSearch renders
- WHEN user types "café"
- THEN search input value is "café"

### Requirement: ProductSearch Category Filter

ProductSearch SHALL display category filter options.

#### Scenario: Category filter visible

- GIVEN ProductSearch renders
- WHEN categories are loaded
- THEN category filter section is visible
