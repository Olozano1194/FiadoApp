# Token Storage Specification

## Purpose

Migrate JWT access and refresh tokens from browser localStorage to `tauri-plugin-store`, which persists tokens in an encrypted OS-native storage backend.

## Requirements

### Requirement: Tokens Stored via Plugin Store

The system SHALL store `fiado_access_token` and `fiado_refresh_token` using `tauri-plugin-store` instead of `localStorage`. The `Cargo.toml` SHALL declare the `tauri-plugin-store` dependency. The `default.json` capabilities SHALL include `store:default`.

#### Scenario: Login stores tokens in plugin store

- GIVEN the user submits valid credentials
- WHEN the login response returns access and refresh tokens
- THEN tokens are written to `tauri-plugin-store`
- AND `localStorage.getItem('fiado_access_token')` returns `null`

#### Scenario: Token retrieval works

- GIVEN a valid access token is stored in the plugin store
- WHEN an API request is made
- THEN the token is retrieved from plugin store and attached as `Authorization: Bearer <token>`
- AND the request succeeds

#### Scenario: Logout clears tokens

- GIVEN the user is authenticated with tokens in plugin store
- WHEN the user logs out
- THEN both tokens are removed from the plugin store
- AND the user is redirected to the login page

### Requirement: Session Restore from Plugin Store

The `restoreSession` function SHALL read tokens from `tauri-plugin-store` on app startup. If tokens exist and the access token is valid, the user session is restored without re-login.

#### Scenario: App restart restores session

- GIVEN the user was authenticated and tokens are in plugin store
- WHEN the app restarts and `restoreSession` runs
- THEN the user is authenticated without re-entering credentials

#### Scenario: Expired tokens trigger refresh

- GIVEN the access token is expired but the refresh token is valid
- WHEN `restoreSession` runs
- THEN the refresh token is used to obtain a new access token
- AND the new tokens are stored in the plugin store
