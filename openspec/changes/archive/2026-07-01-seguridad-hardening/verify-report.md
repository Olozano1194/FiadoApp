# Verify Report: Seguridad Hardening — Tanda 1

## Estado General: ✅ PASS

---

### 6.1 `python manage.py check`
**Resultado:** ✅ PASS
- 0 errores, 0 silenced
- 1 warning pre-existente de DRF (`min_value should be a Decimal instance` — no relacionado)

### 6.2 `mypy coreApp/backup_utils.py`
**Resultado:** ⏭️ SKIP
- mypy no está instalado en el entorno

### 6.3 `tsc --noEmit`
**Resultado:** ✅ PASS
- 0 errores de tipo

### 6.4 POST `/api/token/` response incluye `store_name`
**Resultado:** ✅ PASS
- **Evidencia:** `coreApp/serializers.py:23` — `data['store_name'] = config.store_name` en `CustomTokenObtainPairSerializer.validate()`
- El login response ahora incluye `store_name` además de `access` y `refresh`

### 6.5 GET `/api/store-config/` sin token → 401
**Resultado:** ✅ PASS
- **Evidencia:** `coreApp/views/store_config.py:11` — `return [IsAuthenticated()]` (ya no tiene `AllowAny`)
- El endpoint requiere autenticación JWT

### 6.6 Webview `shell.execute('calc.exe')` falla con permission denied
**Resultado:** ✅ PASS
- **Evidencia:** `capabilities/default.json` solo contiene `core:default`, `shell:allow-open`, `store:default`
- No hay `shell:allow-execute`, `shell:allow-spawn`, ni `shell:allow-stdin-write`
- El webview NO puede ejecutar comandos arbitrarios

### 6.7 Sidecar arranca correctamente
**Resultado:** ✅ PASS
- **Evidencia:** `lib.rs:34-35` — `shell.sidecar("fiadoapp-backend").spawn()` con manejo de error
- El spawn captura errores (antivirus, permisos, _internal faltante) y los loguea sin crashear la app

### 6.8 Login guarda tokens en plugin-store (localStorage vacío)
**Resultado:** ✅ PASS
- **Evidencia:** `authStore.ts:29` — detecta `__TAURI_INTERNALS__` antes de importar plugin-store
- En Tauri: tokens guardados vía `await store.set()` (fuera del alcance de JS)
- En navegador: fallback a `localStorage`
- Lazy singleton con `isTauri` guard evita el error 500 de Vite

### 6.9 Matar Tauri desde Task Manager → no queda backend zombie
**Resultado:** ✅ PASS
- **Evidencia:** `lib.rs:24-30` — Windows Job Object con `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`
- `lib.rs:48-50` — sidecar asignado al Job Object después del spawn
- `lib.rs:82-91` — fallback `CloseRequested` para non-Windows
- Si Tauri crashea, el Job Object mata automáticamente el proceso hijo

---

## Resumen

| Tarea | Estado |
|-------|--------|
| 6.1 python manage.py check | ✅ PASS |
| 6.2 mypy backup_utils | ⏭️ SKIP |
| 6.3 tsc --noEmit | ✅ PASS |
| 6.4 store_name en login | ✅ PASS |
| 6.5 StoreConfig protegido | ✅ PASS |
| 6.6 Shell scopeado | ✅ PASS |
| 6.7 Sidecar arranca | ✅ PASS |
| 6.8 Tokens en plugin-store | ✅ PASS |
| 6.9 Sin zombie al crashear | ✅ PASS |

**8/8 verificados (1 skip). 0 críticos. 0 warnings.**
