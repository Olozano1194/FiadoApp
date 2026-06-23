# Tasks: Backup a Supabase Storage

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~290 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Foundation — Dependencies & Config

- [x] 1.1 Add `storage3>=0.7.0` to `requirements.txt`
- [x] 1.2 Add `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET` env vars to `config/settings.py`
- [x] 1.3 Add fields to `BackupConfig` in `coreApp/models.py`: `supabase_enabled` (BooleanField), `supabase_bucket` (CharField, default='fiadoapp-backups'), `installation_uuid` (CharField, unique, blank), `max_remote_backups` (PositiveIntegerField, default=10)
- [x] 1.4 Create `coreApp/supabase_utils.py`: `get_supabase_client()`, `ensure_installation_uuid()`, `upload_backup()`, `list_remote_backups()`, `download_remote_backup()`, `delete_remote_backup()`, `enforce_retention()`

## Phase 2: Backend API — Views & URLs

- [x] 2.1 Add `get_latest_backup()` helper to `coreApp/backup_utils.py`
- [x] 2.2 Add `CloudBackupUploadView` (POST) to `coreApp/views/backup.py`
- [x] 2.3 Add `CloudBackupListView` (GET) to `coreApp/views/backup.py`
- [x] 2.4 Add `CloudBackupRestoreView` (POST) to `coreApp/views/backup.py`
- [x] 2.5 Register cloud backup routes in `coreApp/urls.py`

## Phase 3: Integration — Auto Backup & Migration

- [x] 3.1 Modify `coreApp/management/commands/auto_backup.py`: add post-backup upload step when `supabase_enabled` is True
- [x] 3.2 Run `python manage.py makemigrations coreApp && python manage.py migrate coreApp`

## Phase 4: Frontend — API & UI

- [x] 4.1 Add cloud backup API functions to `frontend/src/api/settings.api.ts`: `uploadCloudBackup()`, `listCloudBackups()`, `restoreCloudBackup()`
- [x] 4.2 Add cloud backup UI section to `frontend/src/pages/SettingsPage.tsx`: toggle for `supabase_enabled`, "Subir a la nube" button, remote backups list, restore button per row

## Phase 5: Verification

- [ ] 5.1 Test: enable `supabase_enabled`, run `auto_backup`, verify file appears in Supabase Storage under `backups/{uuid}/`
- [ ] 5.2 Test: manual upload via `POST /api/backup/cloud/upload/`, verify 200 response
- [ ] 5.3 Test: `GET /api/backup/cloud/list/` returns remote backups sorted by date
- [ ] 5.4 Test: `POST /api/backup/cloud/restore/{filename}/` restores database
- [ ] 5.5 Test: retention — set `max_remote_backups=2`, upload 3 files, verify oldest is deleted
- [ ] 5.6 Test: disable `supabase_enabled`, verify no upload occurs on auto_backup
