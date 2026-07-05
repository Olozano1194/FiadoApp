# Client Transaction History Specification

## Purpose

Provide a unified view of a client's sales and payment history on a dedicated page, merging data from two existing API endpoints.

## Requirements

### Requirement: Client History Page

The system SHALL provide a page at route `/clientes/:id/historial` that displays a unified timeline of sales and payments for a specific client.

The page SHALL consume existing endpoints: `GET /api/sales/history/?client_id=N` and `GET /api/fiado-payments/?client=N`.

#### Scenario: Page displays client info header

- GIVEN a valid client ID in the URL
- WHEN the page loads
- THEN the client's name, `current_debt`, `credit_limit`, and last payment date are displayed

#### Scenario: Unified timeline merges sales and payments

- GIVEN a client with both sales and fiado payments
- WHEN the page loads
- THEN both sales and payments appear in a single timeline
- AND entries are sorted by date (newest first)
- AND each entry shows its type (sale or payment), date, and amount

#### Scenario: Client with only sales

- GIVEN a client with sales but no fiado payments
- WHEN the page loads
- THEN only sales appear in the timeline
- AND the page does not show errors for empty payments

#### Scenario: Client with only payments

- GIVEN a client with fiado payments but no sales
- WHEN the page loads
- THEN only payments appear in the timeline

#### Scenario: Client not found

- GIVEN no client with the given ID exists
- WHEN the page loads
- THEN a "Cliente no encontrado" message is displayed

### Requirement: Link from Clients Page

The ClientsPage action column SHALL include a history link for each client.

#### Scenario: History link visible in actions column

- GIVEN the ClientsPage is loaded
- WHEN a client row is rendered
- THEN a history icon/link is visible in the actions column

#### Scenario: Click navigates to history page

- GIVEN the user clicks the history link for client ID 5
- WHEN the navigation completes
- THEN the URL is `/clientes/5/historial`
- AND the ClientHistoryPage is rendered

## Edge Cases

| Case | Behavior |
|------|----------|
| API returns paginated results | Frontend fetches all pages or shows first page with load-more |
| Sales API returns error | Show error state; payments still attempted |
| Payments API returns error | Show error state; sales still attempted |
| Both APIs fail | Show combined error state |
| Client has SET_NULL on sale (deleted client) | Handled by separate 404 check on client endpoint |
