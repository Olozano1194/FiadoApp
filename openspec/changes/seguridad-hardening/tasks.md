# Tasks: Seguridad Hardening — Tanda 1

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 180–220 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR (Django + Tauri) or 2 PRs (Python / Tauri+TS) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Django hardening (settings, CORS, store auth, exports, types) | PR 1 | Python-only, ~60 lines, no Rust dependency |
| 2 | Tauri hardening (shell, Job Object, CSP, JWT plugin-store) | PR 2 | Rust + TS, ~120–160 lines, depends on PR 1 for serializer changes |

## Phase 1: Django Hardening

- [x] 1.1 `config/settings.py` — Remove `"http://localhost:3000"` from `CORS_ALLOWED_ORIGINS`
- [x] 1.2 `config/settings.py` — Read `ALLOWED_HOSTS` from `DJANGO_ALLOWED_HOSTS` env var, comma-split, default `testserver,localhost,127.0.0.1`
- [x] 1.3 `config/settings.py` — Log warning when `DEBUG=True` and no `DJANGO_SECRET_KEY` set
- [x] 1.4 `coreApp/views/exports.py` — Add `.iterator()` to all four export querysets
- [x] 1.5 `coreApp/backup_utils.py` — Add explicit return type hints to 8 functions (`detect_engine`, `get_current_db_path`, `backup_db`, `validate_backup_file`, `restore_db`, `get_latest_backup`, `get_db_file_size`, `get_db_info`)

## Phase 2: StoreConfig + Login Response

- [x] 2.1 `coreApp/serializers.py` — Override `CustomTokenObtainPairSerializer.validate()` to inject `store_name` from `StoreConfig.get_singleton()` into response dict
- [x] 2.2 `coreApp/views/store_config.py` — Remove `AllowAny` from `StoreConfigView.get()`, require `IsAuthenticated`

## Phase 3: Shell Scoping + Job Object

- [x] 3.1 `frontend/src-tauri/capabilities/default.json` — Remove `shell:allow-execute`, `shell:allow-spawn`, `shell:allow-stdin-write`, `shell:allow-kill`; keep only `core:default`, `shell:allow-open`, and add `store:default`
- [x] 3.2 `frontend/src-tauri/Cargo.toml` — Add `tauri-plugin-store = "2"` and `job_object = "0.1"` to `[dependencies]`
- [x] 3.3 `frontend/src-tauri/src/lib.rs` — Register `tauri_plugin_store::init()` in builder
- [x] 3.4 `frontend/src-tauri/src/lib.rs` — Create Windows Job Object in `setup()` with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`, assign sidecar process after spawn, gate with `#[cfg(target_os = "windows")]`

## Phase 4: CSP Hardening

- [x] 4.1 `frontend/src-tauri/tauri.conf.json` — Remove `'unsafe-inline'` from `script-src` and `style-src`; remove `data:` from `img-src` in CSP
- [x] 4.2 Build production bundle and verify no CSP errors

## Phase 5: JWT Plugin Store Migration

- [x] 5.1 `frontend/src/stores/authStore.ts` — Replace `localStorage.getItem/setItem/removeItem` with `tauri-plugin-store` reads/writes for `fiado_access_token` and `fiado_refresh_token`
- [x] 5.2 `frontend/src/stores/authStore.ts` — Initialize store as lazy singleton on first import via `getStore()` function
- [x] 5.3 `frontend/src/stores/authStore.ts` — Read `store_name` from login response and store in Zustand
- [x] 5.4 `frontend/src/stores/authStore.ts` — Update `restoreSession` to read tokens from plugin store on startup

## Phase 6: Verification

- [ ] 6.1 Run `python manage.py check` — expect no errors
- [ ] 6.2 Run `mypy coreApp/backup_utils.py` — expect no missing return type errors
- [ ] 6.3 Run `tsc --noEmit` — expect no type errors
- [ ] 6.4 Manual: POST `/api/token/` response includes `store_name` field
- [ ] 6.5 Manual: GET `/api/store-config/` without token returns 401
- [ ] 6.6 Manual: Webview console `window.__TAURI__.shell.execute('calc.exe')` fails permission denied
- [ ] 6.7 Manual: Sidecar starts successfully on app launch
- [ ] 6.8 Manual: Login stores tokens in plugin-store (localStorage returns null)
- [ ] 6.9 Manual: Kill FiadoApp.exe via Task Manager → no orphan `fiadoapp-backend.exe`
