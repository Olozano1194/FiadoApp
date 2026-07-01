# Delta for Seguridad Hardening

## ADDED Requirements

---

## 1. Shell Permissions (🔴)

### Requirement: Frontend Shell Permissions Scoped

The system SHALL NOT grant `shell:allow-execute`, `shell:allow-spawn`, `shell:allow-stdin-write`, or `shell:allow-kill` to the webview. `default.json` SHALL only include `core:default` and `shell:allow-open`.

#### Scenario: Arbitrary command blocked

- GIVEN the webview loads FiadoApp
- WHEN `window.__TAURI__.shell.execute('calc.exe')` is called from browser console
- THEN the call fails with a permission denied error
- AND no external process is spawned

#### Scenario: Sidecar still launches

- GIVEN Tauri starts the application
- WHEN the Rust setup handler runs `shell.sidecar("fiadoapp-backend")`
- THEN the Django backend process starts successfully

#### Scenario: Open URLs still works

- GIVEN the user clicks a link that triggers `shell:allow-open`
- WHEN the open action is invoked
- THEN the URL opens in the system default browser

---

## 2. Sidecar Lifecycle — Job Object (🟡)

### Requirement: Job Object Cleanup on Windows

The system SHALL create a Windows Job Object in `lib.rs` with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`. The sidecar process handle SHALL be assigned to this Job Object at spawn time. Gated with `#[cfg(target_os = "windows")]`.

#### Scenario: Normal close kills sidecar

- GIVEN Tauri is running with the Django sidecar
- WHEN the user closes the Tauri window normally
- THEN `fiadoapp-backend.exe` terminates
- AND no orphan process remains

#### Scenario: Task Manager termination kills sidecar

- GIVEN Tauri is running with the Django sidecar
- WHEN the user kills `FiadoApp.exe` via Task Manager
- THEN `fiadoapp-backend.exe` terminates automatically

#### Scenario: Tauri crash kills sidecar

- GIVEN Tauri is running with the Django sidecar
- WHEN Tauri crashes unexpectedly
- THEN `fiadoapp-backend.exe` terminates automatically

### Requirement: Non-Windows Fallback

On non-Windows platforms, the system SHALL retain the existing `on_window_event` kill behavior.

#### Scenario: macOS/Linux cleanup

- GIVEN the app runs on macOS or Linux
- WHEN the window close event fires
- THEN the existing `child.kill()` logic terminates the sidecar

---

## 3. Token Storage (🟡)

### Requirement: Tokens Stored via Plugin Store

The system SHALL store `fiado_access_token` and `fiado_refresh_token` using `tauri-plugin-store` instead of `localStorage`. `Cargo.toml` SHALL declare the dependency. `default.json` SHALL include `store:default`.

#### Scenario: Login stores tokens in plugin store

- GIVEN the user submits valid credentials
- WHEN the login response returns tokens
- THEN tokens are written to `tauri-plugin-store`
- AND `localStorage.getItem('fiado_access_token')` returns `null`

#### Scenario: Token retrieval works

- GIVEN a valid access token is in plugin store
- WHEN an API request is made
- THEN the token is retrieved and attached as `Authorization: Bearer <token>`

#### Scenario: Logout clears tokens

- GIVEN the user is authenticated
- WHEN the user logs out
- THEN both tokens are removed from the plugin store

### Requirement: Session Restore from Plugin Store

`restoreSession` SHALL read tokens from `tauri-plugin-store` on app startup.

#### Scenario: App restart restores session

- GIVEN tokens are in plugin store
- WHEN the app restarts and `restoreSession` runs
- THEN the user is authenticated without re-entering credentials

#### Scenario: Expired tokens trigger refresh

- GIVEN the access token is expired but refresh token is valid
- WHEN `restoreSession` runs
- THEN the refresh token obtains a new access token
- AND new tokens are stored in the plugin store

---

## 4. Store Config (🟡)

### Requirement: Store Config Requires Authentication

`GET /api/store-config/` SHALL require `IsAuthenticated`. `AllowAny` for GET SHALL be removed.

#### Scenario: Unauthenticated GET returns 401

- GIVEN no Authorization header
- WHEN GET `/api/store-config/` is called
- THEN the response is 401 Unauthorized

#### Scenario: Authenticated GET returns store name

- GIVEN a valid JWT access token
- WHEN GET `/api/store-config/` is called
- THEN the response is 200 with `{"store_name": "<name>"}`

### Requirement: Store Name in Login Response

The JWT login response SHALL include `store_name` alongside `access` and `refresh`. The frontend SHALL read `store_name` from login instead of calling `/api/store-config/`.

#### Scenario: Login returns store name

- GIVEN valid credentials are submitted
- WHEN the login response is received
- THEN the response contains `{"access": "...", "refresh": "...", "store_name": "Mi Tienda"}`

#### Scenario: Frontend uses login response store name

- GIVEN the user logs in successfully
- WHEN the splash screen needs the store name
- THEN it reads from the login response
- AND no separate API call is made

---

## 5. Django Hardening (🟡🟢)

### Requirement: CORS Cleanup

`CORS_ALLOWED_ORIGINS` SHALL NOT include `"http://localhost:3000"`. Allowed: `localhost:5173`, `tauri://localhost`, `https://tauri.localhost`, `http://tauri.localhost`.

#### Scenario: localhost:3000 rejected

- GIVEN a request from `http://localhost:3000`
- WHEN CORS middleware processes the request
- THEN `Access-Control-Allow-Origin` is NOT set

#### Scenario: localhost:5173 accepted

- GIVEN a request from `http://localhost:5173`
- WHEN CORS middleware processes the request
- THEN `Access-Control-Allow-Origin` is set correctly

### Requirement: ALLOWED_HOSTS From Environment

`ALLOWED_HOSTS` SHALL be read from `DJANGO_ALLOWED_HOSTS` env var, split by comma. Default: `testserver,localhost,127.0.0.1`.

#### Scenario: Custom hosts configured

- GIVEN `DJANGO_ALLOWED_HOSTS=example.com,api.example.com`
- WHEN Django starts
- THEN `ALLOWED_HOSTS` is `['example.com', 'api.example.com']`

#### Scenario: Default fallback

- GIVEN `DJANGO_ALLOWED_HOSTS` is not set
- WHEN Django starts
- THEN `ALLOWED_HOSTS` is `['testserver', 'localhost', '127.0.0.1']`

### Requirement: SECRET_KEY Debug Warning

When `DEBUG=True` and no `DJANGO_SECRET_KEY` is set, the system SHALL log a warning about using an insecure key.

#### Scenario: Warning on insecure key

- GIVEN `DJANGO_DEBUG=True` and no `DJANGO_SECRET_KEY`
- WHEN Django starts
- THEN a warning appears in console log
- AND the app continues with the insecure dev key

#### Scenario: No warning when key provided

- GIVEN `DJANGO_SECRET_KEY=actual-secret`
- WHEN Django starts
- THEN no warning is logged

### Requirement: Export Iterator for Memory Efficiency

All four export views SHALL use `.iterator()` on querysets to avoid loading all records into memory.

#### Scenario: Large dataset export

- GIVEN 100,000 clients exist
- WHEN GET `/api/export/clients/` is called
- THEN the XLSX is generated without exceeding memory limits
- AND all rows appear in the output

### Requirement: backup_utils Type Hints

`detect_engine() -> str`, `get_current_db_path() -> str | None`, `backup_db() -> str`, `validate_backup_file() -> tuple[bool, str]`, `restore_db() -> bool`, `get_latest_backup() -> str | None`, `get_db_file_size() -> int`, `get_db_info() -> dict` SHALL have explicit return type annotations.

#### Scenario: Type checker passes

- GIVEN mypy is run against `backup_utils.py`
- WHEN the check completes
- THEN no missing return type errors are reported
