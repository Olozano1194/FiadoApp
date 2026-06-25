# Archive Report: backup-supabase

**Status:** ARCHIVED  
**Date:** 2026-06-24  
**Verification:** PASS (Phase 5 tests ejecutados y verificados)

---

## ¿Qué se implementó?

Backup a la nube usando Supabase Storage como destino de respaldo remoto.

### Componentes creados

- `coreApp/supabase_utils.py` — Cliente Supabase Storage con upload, list, download, delete, retention
- `coreApp/views/backup.py` — CloudBackupUploadView, CloudBackupListView, CloudBackupRestoreView
- Frontend: sección "Backup en la Nube" en SettingsPage con toggle, subir, listar y restaurar

### Componentes modificados

- `coreApp/models.py` — BackupConfig con 4 nuevos campos (supabase_enabled, supabase_bucket, installation_uuid, max_remote_backups)
- `coreApp/backup_utils.py` — Helper `get_latest_backup()`
- `coreApp/management/commands/auto_backup.py` — Step de upload a la nube post-backup
- `coreApp/urls.py` — 3 rutas cloud registradas
- `config/settings.py` — SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_BUCKET
- `frontend/src/api/settings.api.ts` — Funciones uploadCloudBackup, listCloudBackups, restoreCloudBackup
- `.env` — Variables SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_BUCKET
- `requirements.txt` — storage3>=0.7.0

## Decisiones clave

| Decisión | Alternativa | Por qué |
|---|---|---|
| Local-first + upload sync | Upload-only | El backup local siempre corre; si el upload falla no afecta al local |
| Multi-tenant con UUID por instalación | Nombre de tienda | Evita colisiones, no expone info sensible |
| storage3 sobre supabase-py | supabase-py completo | storage3 es más liviano, solo Storage |
| Service role key (backend) | Anon key | Backend-to-backend, no expuesto al frontend |
| Header `apikey` en vez de `Authorization: Bearer` | Bearer JWT | Las claves nuevas de Supabase (sb_secret_) usan `apikey` |

## Issues conocidos

- Ninguno. W1 (idempotent upload) corregido con `upsert: 'true'`.

## Verificación (Phase 5) — 2026-06-24

| Test | Resultado |
|------|-----------|
| 5.1 Auto backup + upload | ✅ (probado desde UI) |
| 5.2 Upload manual `POST /api/backup/cloud/upload/` | ✅ 200 OK |
| 5.3 Listar remotos `GET /api/backup/cloud/list/` | ✅ Retorna lista |
| 5.4 Restaurar `POST /api/backup/cloud/restore/{file}/` | ✅ "Database restored" |
| 5.5 Retención (`max_remote_backups=2`) | ✅ Solo 2 archivos después de 3 uploads |
| 5.6 Toggle off (`supabase_enabled=false`) | ✅ Upload rechazado con 400 |

**Veredicto final:** PASS completo