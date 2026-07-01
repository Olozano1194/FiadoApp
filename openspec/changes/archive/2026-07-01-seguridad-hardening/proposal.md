# Proposal: Seguridad y Hardening — Tanda 1

## Intent

Eliminar vulnerabilidades: shell sin restricciones, service key expuesta, sidecar zombie, CSP inseguro, tokens en localStorage, auditoría Django.

## Scope

### In Scope

1. **Shell scoping** — `default.json`: limitar `shell:allow-*` al sidecar
2. **Rotar SUPABASE_SERVICE_KEY** — generar nueva, documentar
3. **Sidecar zombie** — `lib.rs`: Job Object Windows
4. **CSP hardening** — sacar `'unsafe-inline'`, `data:` de img-src
5. **JWT → tauri-plugin-store** — fuera de localStorage
6. **StoreConfig** — store_name al login, endpoint protegido
7. **CORS cleanup** — sacar localhost:3000
8. **ALLOWED_HOSTS desde env** — fallback sin env
9. **SECRET_KEY warning** — logger en fallback DEBUG
10. **Export .iterator()** — evitar carga en memoria
11. **backup_utils type hints** — return types

### Out of Scope

- Audit items no listados (N+1, UI, errores)
- Migrar otros datos a plugin-store

## Capabilities

### New

- `shell-permissions`: scoping shell al sidecar
- `sidecar-lifecycle`: Job Object cleanup
- `token-storage`: JWT via plugin-store
- `store-config`: store_name protegido, en login

### Modified

None — `data-export`, `product-import` sin cambios de requirements.

## Approach

Commits atómicos: settings → shell+sidecar → CSP → tokens → CORS → audit. Cada grupo testeable solo.

## Affected Areas

| Area | Impact | Desc |
|------|--------|------|
| `default.json` | Mod | Shell scoping |
| `lib.rs` | Mod | Job Object |
| `tauri.conf.json` | Mod | CSP |
| `settings.py` | Mod | ALLOWED_HOSTS, CORS |
| `store_config.py` | Mod | IsAuthenticated |
| `exports.py` | Mod | .iterator() |
| `backup_utils.py` | Mod | Type hints |
| `authStore.ts` | Mod | Plugin-store |
| `LoginPage.tsx` | Mod | store_name |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Shell scoping rompe sidecar | Med | Probar build |
| CSP rompe prod | Med | Probar build prod |
| Job Object Win only | Low | `#[cfg(windows)]` |
| Token migration rompe login | Med | Test full flow |

## Rollback Plan

Commits separados, revertir individualmente:
```
git revert <commit-settings>
git revert <commit-shell-sidecar>
git revert <commit-csp>
git revert <commit-tokens>
git revert <commit-cors>
git revert <commit-audit>
```

## Dependencies

- `tauri-plugin-store` (Cargo.toml)
- Nueva SUPABASE_SERVICE_KEY

## Success Criteria

- [ ] Webview NO puede ejecutar shell a `calc.exe`
- [ ] JWT no en localStorage
- [ ] Si Tauri crashea, backend termina
- [ ] Build prod sin errores CSP
- [ ] Login response incluye store_name
- [ ] ALLOWED_HOSTS configurable por env
- [ ] `tsc --noEmit` pasa
- [ ] `python manage.py check` pasa
- [ ] MSI se genera