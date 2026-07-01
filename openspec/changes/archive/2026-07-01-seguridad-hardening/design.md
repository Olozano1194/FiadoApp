# Design: Seguridad Hardening — Tanda 1

## Technical Approach

Five independent security fixes applied atomically: shell permission scoping, sidecar zombie prevention via Windows Job Object, JWT migration from localStorage to tauri-plugin-store, StoreConfig authentication + login response enrichment, and Django hardening (CORS, ALLOWED_HOSTS, SECRET_KEY warning, export iterators, type hints). Each group is a separate commit, independently testable and revertable.

## Architecture Decisions

### Decision: Shell Permission Scoping

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Keep all `shell:allow-*` | Sidecar works, webview can execute arbitrary commands — CRITICAL vulnerability | Rejected |
| Remove all shell permissions | Sidecar can't launch from Rust either (plugin needs at least one shell permission) | Rejected |
| Keep only `shell:allow-open` | Sidecar launches from Rust (not affected by webview caps), URLs open in browser | **Chosen** |

**Rationale**: Tauri v2 capabilities are webview-scoped — they control what JS can do, not what Rust can do. `shell.sidecar()` in Rust bypasses capability checks. Keeping only `shell:allow-open` preserves URL-opening while blocking `shell.execute()` / `shell.spawn()` from the webview. Verified: `tauri-plugin-shell`'s `ShellExt::sidecar()` does not require webview capabilities.

### Decision: Windows Job Object for Sidecar Cleanup

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `windows` crate direct | Full control, heavier dependency | Rejected |
| `job_object` crate | Simpler API, small, maintained | **Chosen** |
| Keep only `on_window_event` kill | Doesn't handle crashes/Task Manager kills — zombies persist | Rejected |

**Rationale**: `job_object` crate wraps `CreateJobObjectW` / `AssignProcessToJobObject` with safe Rust types. `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` ensures the child dies when the job handle closes (Tauri exit/crash). Gated with `#[cfg(target_os = "windows")]`. Non-Windows retains existing `on_window_event` kill. The job is created in `setup()` BEFORE `sidecar_command.spawn()`.

### Decision: JWT Storage — Volatile vs Persistent Store

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Volatile (in-memory only) | Tokens lost on restart — breaks `restoreSession` | Rejected |
| Persistent (disk-backed) | Tokens survive restart, encrypted by OS keychain | **Chosen** |

**Rationale**: The spec requires session restore on restart. `tauri-plugin-store` defaults to persistent storage. Store is initialized in `authStore.ts` via lazy singleton (not App.tsx or Zustand init) — the store instance is created once on first import, used by all auth operations.

### Decision: StoreConfig — Login Response vs Separate Endpoint

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Add `store_name` to login response only | Eliminates unauthenticated call, one request less | **Chosen** |
| Keep separate endpoint + auth on it | Backward compatible, but extra network roundtrip | Rejected |
| Both (belt and suspenders) | Unnecessary complexity | Rejected |

**Rationale**: Override `TokenObtainPairSerializer.validate()` in `CustomTokenObtainPairSerializer` to inject `store_name` from `StoreConfig.get_singleton()` into the response dict. Remove `AllowAny` from `StoreConfigView.get()` — endpoint now requires `IsAuthenticated`. Frontend reads `store_name` from login response, stores it in Zustand, eliminates the separate API call.

## Data Flow

### Shell + Sidecar Flow

```
┌─────────────────────────────────────────────────┐
│  Rust (lib.rs)                                   │
│                                                  │
│  setup()                                         │
│    ├─ Create Job Object (Windows only)            │
│    ├─ shell.sidecar("fiadoapp-backend").spawn()   │
│    │   └─ Assign process handle to Job Object     │
│    └─ Store child in SidecarState                 │
│                                                  │
│  on_window_event(CloseRequested)                  │
│    └─ child.kill() (fallback for non-Windows)     │
└─────────────────────────────────────────────────┘
```

### Token Storage Flow

```
Login:
  LoginPage → authStore.login() → POST /api/token/
    → response: { access, refresh, store_name }
    → write tokens to tauri-plugin-store
    → set Zustand state

App Restart:
  App.tsx → authStore.restoreSession()
    → read tokens from tauri-plugin-store
    → if valid: authenticate
    → if expired: POST /api/token/refresh/ → write new tokens

Logout:
  authStore.logout()
    → remove tokens from tauri-plugin-store
    → clear Zustand state
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src-tauri/capabilities/default.json` | Modify | Remove `shell:allow-execute`, `shell:allow-spawn`, `shell:allow-stdin-write`, `shell:allow-keep`; add `store:default` |
| `frontend/src-tauri/Cargo.toml` | Modify | Add `tauri-plugin-store = "2"` and `job_object = "0.1"` dependencies |
| `frontend/src-tauri/src/lib.rs` | Modify | Add Job Object creation in `setup()`, gate with `#[cfg(windows)]`, register `tauri_plugin_store::init()` |
| `frontend/src-tauri/tauri.conf.json` | Modify | CSP: remove `'unsafe-inline'` from script-src and style-src, remove `data:` from img-src |
| `config/settings.py` | Modify | CORS: remove `localhost:3000`; ALLOWED_HOSTS: read from env; SECRET_KEY: add warning on DEBUG fallback |
| `coreApp/serializers.py` | Modify | `CustomTokenObtainPairSerializer.validate()`: inject `store_name` into response |
| `coreApp/views/store_config.py` | Modify | Remove `AllowAny` from GET — all methods require `IsAuthenticated` |
| `coreApp/views/exports.py` | Modify | Add `.iterator()` to all four export querysets |
| `coreApp/backup_utils.py` | Modify | Add return type hints to 8 functions |
| `frontend/src/stores/authStore.ts` | Modify | Replace `localStorage` calls with `tauri-plugin-store` reads/writes; handle `store_name` in login response |

## Interfaces / Contracts

### Login Response (Modified)

```typescript
// Before
interface AuthTokens {
  access: string;
  refresh: string;
}

// After
interface AuthTokens {
  access: string;
  refresh: string;
  store_name: string;  // NEW — eliminates separate /api/store-config/ call
}
```

### Tauri Plugin Store Keys

```rust
// Keys used in tauri-plugin-store
"fiado_access_token" → String
"fiado_refresh_token" → String
```

### Job Object (Rust)

```rust
#[cfg(target_os = "windows")]
use job_object::{Job, LimitFlags};

// In setup(), before sidecar spawn:
let job = Job::new()?;
job.set_limit_flags(LimitFlags::JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE)?;
// After spawn:
job.assign_process(child.pid() as u32)?;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `CustomTokenObtainPairSerializer.validate()` includes `store_name` | Django test client: POST /api/token/ → assert `store_name` in response |
| Unit | `StoreConfigView.get()` returns 401 without auth | Django test client: GET /api/store-config/ without token → assert 401 |
| Unit | Export views use `.iterator()` | Mock queryset, verify `.iterator()` called |
| Unit | `backup_utils` type hints pass mypy | Run `mypy coreApp/backup_utils.py` |
| Integration | Shell permissions block webview commands | Manual: open browser console, call `window.__TAURI__.shell.execute()` → assert permission denied |
| Integration | Sidecar launches with scoped permissions | Build + run: sidecar starts, URLs open in browser |
| Integration | JWT stored in plugin-store, not localStorage | Login → check `localStorage.getItem('fiado_access_token')` returns null |
| Integration | Session restore on restart | Login → close app → reopen → assert authenticated |
| Integration | ALLOWED_HOSTS from env | Set `DJANGO_ALLOWED_HOSTS` → start Django → assert `settings.ALLOWED_HOSTS` matches |
| Integration | CORS rejects localhost:3000 | curl with Origin `http://localhost:3000` → assert no `Access-Control-Allow-Origin` header |
| E2E | Full login flow with store_name | Login → splash shows store name → no separate API call |
| E2E | Task Manager kill cleans sidecar (Windows) | Kill FiadoApp.exe → assert no `fiadoapp-backend.exe` in Task Manager |

## Migration / Rollout

No data migration required. Token migration is implicit — existing localStorage tokens are ignored after the change (users re-login once). Feature flag not needed; changes are atomic and revertable per commit.

## Open Questions

- [ ] **CSP `'unsafe-inline'` removal**: React 19 + Vite may inject inline styles/scripts during HMR. Need to verify production build works without `'unsafe-inline'`. If not, use nonce-based CSP or keep `'unsafe-inline'` for `style-src` only.
- [ ] **`job_object` crate maturity**: Low usage on crates.io. Fallback: use `windows` crate directly with `CreateJobObjectW` FFI if `job_object` has issues.

---

**Status**: success
**Summary**: Design created for `seguridad-hardening`. 5 architecture decisions documented with rationale. 10 files affected (10 modified, 0 new, 0 deleted). Testing strategy covers unit, integration, and E2E layers.
**Artifacts**: `openspec/changes/seguridad-hardening/design.md`
**Next**: sdd-tasks
**Risks**: CSP `'unsafe-inline'` removal may require build verification; `job_object` crate maturity needs validation
**Skill Resolution**: paths-injected — 3 skills (sdd-design, _shared/sdd-phase-common.md, _shared/openspec-convention.md)
