# Quick Fiado Payment Specification

## Purpose

Allow store owners to register fiado (credit) payments directly from the POS PaymentBar without leaving the checkout flow.

## Requirements

### Requirement: Quick Payment Button in PaymentBar

The system SHALL display a "Registrar abono" button in `PaymentBar` when a CREDIT client is selected.

The button SHALL open the existing `PaymentModal` pre-filled with the selected client.

#### Scenario: Button visible when CREDIT client selected

- GIVEN the user is in the POS with a CREDIT client selected in PaymentBar
- WHEN the PaymentBar renders
- THEN a "Registrar abono" button is visible next to the client selection

#### Scenario: Button hidden when no client selected

- GIVEN the user is in the POS with CREDIT method but no client selected
- WHEN the PaymentBar renders
- THEN the "Registrar abono" button is NOT visible

#### Scenario: Button hidden for CASH method

- GIVEN the user is in the POS with CASH payment method
- WHEN the PaymentBar renders
- THEN the "Registrar abono" button is NOT visible

#### Scenario: Click opens PaymentModal with client

- GIVEN a CREDIT client is selected
- WHEN the user clicks "Registrar abono"
- THEN the `PaymentModal` opens with the client pre-selected
- AND the modal shows the client's current debt

#### Scenario: Payment success refreshes debt

- GIVEN the PaymentModal is open from the POS
- WHEN the user completes a payment successfully
- THEN the client's `current_debt` is refreshed in the sale store
- AND the modal closes
- AND a success toast is displayed

## Edge Cases

| Case | Behavior |
|------|----------|
| Client debt is 0 | Button still visible; modal opens but payment amount defaults to 0 |
| PaymentModal API error | Error handled by existing axios interceptor; modal stays open |
| User closes modal without paying | Modal closes; no state change in POS |
