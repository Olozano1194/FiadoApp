# Store Config Specification

## Purpose

Protect the store configuration endpoint with authentication and embed `store_name` in the JWT login response, eliminating the need for a separate unauthenticated endpoint.

## Requirements

### Requirement: Store Config Requires Authentication

The `GET /api/store-config/` endpoint SHALL require `IsAuthenticated`. The `AllowAny` permission for GET SHALL be removed from `StoreConfigView`.

#### Scenario: Unauthenticated GET returns 401

- GIVEN no Authorization header is provided
- WHEN GET `/api/store-config/` is called
- THEN the response is 401 Unauthorized

#### Scenario: Authenticated GET returns store name

- GIVEN a valid JWT access token
- WHEN GET `/api/store-config/` is called
- THEN the response is 200 with `{"store_name": "<name>"}`

### Requirement: Store Name in Login Response

The JWT login response SHALL include `store_name` as a top-level field alongside `access` and `refresh`. The frontend splash/login screen SHALL read `store_name` from the login response instead of calling `/api/store-config/`.

#### Scenario: Login returns store name

- GIVEN valid credentials are submitted
- WHEN the login response is received
- THEN the response body contains `{"access": "...", "refresh": "...", "store_name": "Mi Tienda"}`

#### Scenario: Frontend uses login response store name

- GIVEN the user logs in successfully
- WHEN the splash screen needs the store name
- THEN it reads from the login response
- AND no separate API call to `/api/store-config/` is made
