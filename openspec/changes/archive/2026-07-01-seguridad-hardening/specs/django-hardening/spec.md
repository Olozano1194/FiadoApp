# Django Hardening Specification

## Purpose

Harden Django settings: tighten CORS, configure ALLOWED_HOSTS via env, warn on insecure SECRET_KEY, improve export memory efficiency, and add type hints to backup utilities.

## Requirements

### Requirement: CORS Cleanup

`CORS_ALLOWED_ORIGINS` in `config/settings.py` SHALL NOT include `"http://localhost:3000"`. Allowed origins: `localhost:5173`, `tauri://localhost`, `https://tauri.localhost`, `http://tauri.localhost`.

#### Scenario: localhost:3000 rejected

- GIVEN a request from `http://localhost:3000`
- WHEN the CORS middleware processes the request
- THEN the `Access-Control-Allow-Origin` header is NOT set
- AND cross-origin requests from port 3000 are blocked

#### Scenario: localhost:5173 accepted

- GIVEN a request from `http://localhost:5173`
- WHEN the CORS middleware processes the request
- THEN the `Access-Control-Allow-Origin` header is set correctly

### Requirement: ALLOWED_HOSTS From Environment

`ALLOWED_HOSTS` SHALL be read from `DJANGO_ALLOWED_HOSTS` env var, split by comma. Default fallback: `testserver,localhost,127.0.0.1`.

#### Scenario: Custom hosts configured

- GIVEN `DJANGO_ALLOWED_HOSTS=example.com,api.example.com`
- WHEN Django starts
- THEN `ALLOWED_HOSTS` is `['example.com', 'api.example.com']`

#### Scenario: Default fallback

- GIVEN `DJANGO_ALLOWED_HOSTS` is not set
- WHEN Django starts
- THEN `ALLOWED_HOSTS` is `['testserver', 'localhost', '127.0.0.1']`

### Requirement: SECRET_KEY Debug Warning

When `DEBUG=True` and `DJANGO_SECRET_KEY` is not set in env, the system SHALL log a warning: `"Usando SECRET_KEY insegura para DEBUG — no usar en producción"`.

#### Scenario: Warning on insecure key

- GIVEN `DJANGO_DEBUG=True` and no `DJANGO_SECRET_KEY`
- WHEN Django starts
- THEN a warning message appears in the console log
- AND the app continues with the insecure dev key

#### Scenario: No warning when key provided

- GIVEN `DJANGO_SECRET_KEY=actual-secret`
- WHEN Django starts
- THEN no warning about SECRET_KEY is logged

### Requirement: Export Iterator for Memory Efficiency

All four export views (`ExportClientsView`, `ExportProductsView`, `ExportSalesView`, `ExportExpensesView`) SHALL use `.iterator()` on querysets to avoid loading all records into memory at once.

#### Scenario: Large dataset export

- GIVEN 100,000 clients exist in the database
- WHEN GET `/api/export/clients/` is called
- THEN the XLSX is generated without exceeding memory limits
- AND all 100,000 rows appear in the output

### Requirement: backup_utils Type Hints

The following functions in `coreApp/backup_utils.py` SHALL have explicit return type annotations: `detect_engine() -> str`, `get_current_db_path() -> str | None`, `backup_db() -> str`, `validate_backup_file() -> tuple[bool, str]`, `restore_db() -> bool`, `get_latest_backup() -> str | None`, `get_db_file_size() -> int`, `get_db_info() -> dict`.

#### Scenario: Type checker passes

- GIVEN `mypy` or a similar type checker is run against `backup_utils.py`
- WHEN the check completes
- THEN no errors about missing return type annotations are reported
