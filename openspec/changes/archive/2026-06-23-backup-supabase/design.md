# Design: Backup a Supabase Storage

## Technical Approach

Local-first + upload sync. El backup local existente (`backup_db()`) corre sin cambios.
Si `supabase_enabled` está activo, se sube el archivo `.db.gz` resultante a Supabase Storage
usando la API REST con `storage3` (submódulo ligero del SDK de Supabase).

Cada instalación tiene un UUID4 como prefijo de carpeta en el bucket, permitiendo
multi-tenant con un solo proyecto Supabase.

---

## Architecture Decisions

### Decision: storage3 over supabase-py

**Choice**: Usar `storage3` en lugar del SDK completo `supabase-py`.
**Rationale**: Solo necesitamos Storage, no Auth ni PostgREST. `storage3` es ~200KB vs >2MB del SDK completo.
**Tradeoff**: Si en el futuro necesitamos otras features de Supabase, migrar es trivial.

### Decision: Service role key over anon key

**Choice**: Usar `SUPABASE_SERVICE_KEY` (service_role) con RLS bypass.
**Rationale**: Backend-to-backend. La anon key requiere RLS policies, agrega complejidad sin beneficio.
**Risk**: La service_role tiene full access. Mitigación: nunca se expone al frontend, solo en `.env`.

### Decision: UUID por instalación, no nombre de tienda

**Choice**: UUID4 generado automáticamente como identificador de instalación.
**Rationale**: No depende del usuario, no hay riesgo de colisión, no expone información de la tienda.
**Storage path**: `backups/{uuid}/backup_YYYYMMDD_HHMMSS.db.gz`

---

## Data Flow

### Upload Flow (auto_backup.py)

```
auto_backup.py
  │
  ├─ backup_db() → backup_utils.py
  │     └─ archivo: backups/backup_20260623_021814.db.gz
  │
  └─ [if supabase_enabled]
        │
        ├─ ensure_installation_uuid(config)
        │     └─ si está vacío: genera UUID4, guarda en BackupConfig
        │
        ├─ upload_backup(file_path, uuid)
        │     └─ storage3: upload backups/{uuid}/backup_20260623_021814.db.gz
        │
        └─ enforce_retention(uuid, max_count=10)
              └─ lista archivos remotos, borra los más viejos si excede max
```

### Restore from Cloud Flow

```
POST /api/backup/cloud/list/
  └─ storage3: list files in backups/{uuid}/
  └─ return [{name, size, updated_at}, ...]

POST /api/backup/cloud/restore/{filename}/
  ├─ storage3: download backups/{uuid}/{filename} → archivo temporal
  └─ restore_db(temp_path) → backup_utils.py
```

---

## File Changes

### New: `coreApp/supabase_utils.py`

```python
import logging
import os
from datetime import datetime
from pathlib import Path

from django.conf import settings
from storage3 import create_client

logger = logging.getLogger(__name__)


def get_supabase_client():
    """Initialize Supabase Storage client."""
    url = f"{settings.SUPABASE_URL}/storage/v1"
    return create_client(url, settings.SUPABASE_SERVICE_KEY)


def ensure_installation_uuid(config):
    """Generate UUID if this installation doesn't have one."""
    if not config.installation_uuid:
        import uuid
        config.installation_uuid = str(uuid.uuid4())
        config.save(update_fields=['installation_uuid'])
    return config.installation_uuid


def _remote_folder(uuid):
    return f"backups/{uuid}"


def upload_backup(local_path, installation_uuid):
    """Upload a .db.gz file to Supabase Storage."""
    client = get_supabase_client()
    folder = _remote_folder(installation_uuid)
    filename = os.path.basename(local_path)
    remote_path = f"{folder}/{filename}"

    with open(local_path, 'rb') as f:
        client.from_(settings.SUPABASE_BUCKET).upload(
            remote_path, f.read(),
            {'content-type': 'application/gzip'}
        )

    return remote_path


def list_remote_backups(installation_uuid):
    """List all backups for this installation."""
    client = get_supabase_client()
    folder = _remote_folder(installation_uuid)
    files = client.from_(settings.SUPABASE_BUCKET).list(folder)

    result = []
    for f in files:
        result.append({
            'name': f['name'],
            'size': f.get('metadata', {}).get('size', 0),
            'updated_at': f.get('updated_at', ''),
        })

    result.sort(key=lambda x: x['updated_at'], reverse=True)
    return result


def download_remote_backup(remote_path, temp_dir=None):
    """Download a file from Supabase Storage to a temporary location."""
    import tempfile

    client = get_supabase_client()
    data = client.from_(settings.SUPABASE_BUCKET).download(remote_path)

    if temp_dir is None:
        temp_dir = tempfile.gettempdir()

    filename = os.path.basename(remote_path)
    local_path = os.path.join(temp_dir, filename)

    with open(local_path, 'wb') as f:
        f.write(data)

    return local_path


def delete_remote_backup(remote_path):
    """Delete a single file from Supabase Storage."""
    client = get_supabase_client()
    client.from_(settings.SUPABASE_BUCKET).remove([remote_path])


def enforce_retention(installation_uuid, max_count=10):
    """Delete oldest backups if over the retention limit."""
    files = list_remote_backups(installation_uuid)
    if len(files) > max_count:
        to_delete = files[max_count:]
        for f in to_delete:
            folder = _remote_folder(installation_uuid)
            remote_path = f"{folder}/{f['name']}"
            try:
                delete_remote_backup(remote_path)
                logger.info("Deleted old remote backup: %s", remote_path)
            except Exception as e:
                logger.error("Failed to delete %s: %s", remote_path, e)
```

### Modified: `coreApp/models.py`

Agregar campos a `BackupConfig`:

```python
supabase_enabled = models.BooleanField(default=False)
supabase_bucket = models.CharField(max_length=128, default='fiadoapp-backups')
installation_uuid = models.CharField(max_length=36, unique=True, blank=True, default='')
max_remote_backups = models.PositiveIntegerField(default=10)
```

### Modified: `coreApp/management/commands/auto_backup.py`

Después del backup local exitoso:

```python
from coreApp.supabase_utils import (
    ensure_installation_uuid, upload_backup, enforce_retention
)

# ... after backup_db() succeeds ...
if config.supabase_enabled:
    try:
        uuid = ensure_installation_uuid(config)
        upload_backup(backup_path, uuid)
        enforce_retention(uuid, config.max_remote_backups)
    except Exception as e:
        logger.error("Supabase upload failed (local backup OK): %s", e)
```

### Modified: `coreApp/views/backup.py`

Nuevos endpoints:

```python
class CloudBackupUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Upload latest local backup to Supabase."""
        config = BackupConfig.get_singleton()
        if not config.supabase_enabled:
            return Response({"error": "Cloud backup is disabled"}, status=400)

        uuid = ensure_installation_uuid(config)
        latest = get_latest_backup()
        if not latest:
            return Response({"error": "No local backup found"}, status=400)

        try:
            remote_path = upload_backup(latest, uuid)
            enforce_retention(uuid, config.max_remote_backups)
            return Response({"success": True, "remote_path": remote_path})
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class CloudBackupListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        config = BackupConfig.get_singleton()
        if not config.supabase_enabled or not config.installation_uuid:
            return Response({"backups": []})
        try:
            backups = list_remote_backups(config.installation_uuid)
            return Response({"backups": backups})
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class CloudBackupRestoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, filename):
        config = BackupConfig.get_singleton()
        if not config.supabase_enabled or not config.installation_uuid:
            return Response({"error": "Cloud backup is disabled"}, status=400)

        remote_path = f"backups/{config.installation_uuid}/{filename}"
        try:
            local_path = download_remote_backup(remote_path)
            restore_db(local_path, create_safety_backup=True)
            return Response({"success": True, "message": "Database restored from cloud backup"})
        except Exception as e:
            return Response({"error": str(e)}, status=500)
```

### New Helper: `get_latest_backup()`

Agregar a `backup_utils.py`:

```python
def get_latest_backup():
    """Return path to the most recent backup file."""
    import glob
    backup_dir = settings.BACKUP_ROOT
    files = glob.glob(os.path.join(backup_dir, '*.db.gz'))
    if not files:
        return None
    return max(files, key=os.path.getmtime)
```

### Modified: `coreApp/urls.py`

```python
path('api/backup/cloud/upload/', CloudBackupUploadView.as_view(), name='cloud-backup-upload'),
path('api/backup/cloud/list/', CloudBackupListView.as_view(), name='cloud-backup-list'),
path('api/backup/cloud/restore/<str:filename>/', CloudBackupRestoreView.as_view(), name='cloud-backup-restore'),
```

### Modified: `config/settings.py`

```python
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')
SUPABASE_BUCKET = os.getenv('SUPABASE_BUCKET', 'fiadoapp-backups')
```

### Modified: `requirements.txt`

```
storage3>=0.7.0
```

---

## Migration Plan

```bash
python manage.py makemigrations coreApp
python manage.py migrate coreApp
```

Los nuevos campos en BackupConfig son additive (default=False, blank=True) y no requieren migración de datos existentes.

---

## Rollback

```bash
git revert HEAD --no-edit
python manage.py migrate coreApp 00XX  # migración anterior
```

Para rollback rápido en producción: deshabilitar `supabase_enabled=False` desde el UI antes del revert.
