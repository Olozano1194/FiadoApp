## Exploration: Backup a Supabase Storage

### Current State

FiadoApp tiene un sistema de backups completo y funcional dividido en varias capas:

1. **Motor de backup** (`coreApp/backup_utils.py`):
   - `backup_db()` — exporta la BD como archivo `.db.gz` comprimido en `BACKUP_ROOT` (`backups/`)
   - Para **MySQL**: serializa todos los modelos a JSON siguiendo `_IMPORT_ORDER`, comprime con gzip
   - Para **SQLite**: copia directa del archivo DB + compresión gzip
   - `validate_backup_file()` — valida integridad del archivo según el motor
   - `restore_db()` — restaura desde archivo, con safety backup previo
   - `get_db_file_size()`, `get_db_info()` — metadata

2. **REST API** (`coreApp/views/backup.py`):
   - `GET /api/backup/export/` — descarga backup como archivo
   - `POST /api/backup/import/` — sube y restaura backup
   - `GET/PUT /api/backup/config/` — leer/configurar BackupConfig

3. **Automatización**:
   - `auto_backup.py` — management command que ejecuta backup local + rotación de archivos viejos
   - `BackupScheduler` en `backend_server.py` — timer en background que ejecuta auto_backup según `frequency_hours`

4. **Configuración** (`BackupConfig` model):
   - `enabled`, `frequency_hours`, `max_backups`, `last_backup`, `backup_folder`

5. **URLs** en `coreApp/urls.py`:
   - `/api/backup/export/`, `/api/backup/import/`, `/api/backup/config/`

### Affected Areas

- `coreApp/backup_utils.py` — nuevo módulo o funciones para upload a Supabase
- `coreApp/views/backup.py` — nuevas vistas REST para upload/download de backups cloud
- `coreApp/urls.py` — nuevas rutas Supabase
- `coreApp/models.py` — nuevos campos en `BackupConfig` (supabase_enabled, supabase_url, etc.)
- `coreApp/management/commands/auto_backup.py` — agregar step de sync a Supabase post-backup local
- `backend_server.py` — opcional: integrar Supabase sync en BackupScheduler
- `config/settings.py` — nuevas settings `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET`
- `requirements.txt` — agregar `supabase-py` o `storage3`

### Approaches

1. **Local-first + upload sync** (recomendado)
   - El backup local existente se ejecuta igual. Luego se sube el archivo `.db.gz` resultante a Supabase Storage.
   - Se agrega un step post-backup en `auto_backup.py` que hace el upload.
   - Se mantiene la rotación local + se agrega limpieza remota (opcional).
   - Pros:
     - No modifica el flujo actual de backup — cero riesgo de regression
     - El archivo local sirve como caché/fallback si Supabase no está disponible
     - Separa concerns: backup ≠ cloud upload
     - Fácil de probar: se puede testear upload independientemente del backup
   - Cons:
     - Usa el doble de espacio en disco (local + subido)
     - Un paso extra significa más latencia en el scheduler
   - Effort: **Medium**

2. **Stream directo a Supabase** (sin archivo local)
   - En lugar de escribir el archivo `.db.gz` a disco, se serializa y sube directamente a Supabase.
   - Se puede hacer con streaming: comprimir en memoria y subir.
   - Pros:
     - Ahorra espacio en disco
     - Más rápido (un solo paso)
   - Cons:
     - Cambia el core de `backup_db()` — alto riesgo de regression
     - Si Supabase falla, no hay backup local de respaldo
     - Complejidad: manejar chunks grandes en memoria sin OOM
     - Rompe la compatibilidad con `ImportDbView` que espera archivos locales
   - Effort: **High**

3. **Supabase como mirror/replicación async**
   - El backup local corre normal. Un proceso separado (cron separado o hilo) revisa la carpeta `backups/` y sincroniza archivos nuevos a Supabase.
   - Pros:
     - Desacoplamiento total — el scheduler de backup no toca Supabase
     - Fácil de deshabilitar sin afectar backups locales
   - Cons:
     - Estado compartido: necesita trackear qué archivos ya se subieron
     - Posible race condition si el backup y el sync corren cerca
     - Más moving parts
   - Effort: **Medium-High**

### Recommended Approach

**Approach 1: Local-first + upload sync.**

Razones:
- El backup local ya está probado y funcionando en producción
- Agregar upload a Supabase como paso posterior es mínimo riesgo
- Separa claramente la responsabilidad: backup ≠ cloud storage
- Si Supabase está caído o las credenciales fallan, el backup local sigue funcionando
- Fácil de habilitar/deshabilitar desde `BackupConfig` (nuevo flag `supabase_enabled`)
- El upload se puede implementar con `supabase-py` o incluso `requests` directo a la REST API

Flujo propuesto:
1. `backup_db()` ejecuta normal → archivo `.db.gz` en `backups/`
2. En `auto_backup.py`, después del backup local: si `config.supabase_enabled`, llamar a `upload_to_supabase(file_path)`
3. `upload_to_supabase()` lee el archivo, lo sube al bucket con nombre tipo `backups/backup_20260623_021814.db.gz`
4. Opcional: policy de retención remota (eliminar backups > N días en Supabase)

Config nueva en `BackupConfig`:
- `supabase_enabled = BooleanField(default=False)`
- `supabase_url = CharField(max_length=255, blank=True)` — o leer de settings/.env
- `supabase_bucket = CharField(max_length=128, default="fiadoapp-backups")`

### Dependencies

Se necesita `supabase-py` (≈ `storage3` + `gotrue` + `postgrest`):
```
supabase-py>=2.0
```

Alternativa más liviana: solo `storage3` + `httpx`. O incluso `requests` directo contra la REST API de Supabase Storage, ya que la API es simple:

```
POST /storage/v1/object/{bucketName}/{path}
Authorization: Bearer {service_role_key}
Content-Type: application/gzip
```

Recomiendo `supabase-py` porque abstrae auth, manejo de errores, y es mantenido por Supabase. Pero para no traerse todo el SDK (que incluye auth, postgrest, etc.), se puede usar solo `storage3` que es el submódulo de storage.

### Variables de Entorno / Settings

```python
# config/settings.py
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')  # service_role key (no anon)
SUPABASE_BUCKET = os.getenv('SUPABASE_BUCKET', 'fiadoapp-backups')
```

`.env`:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET=fiadoapp-backups
```

Usar **service_role key** (no anon) porque es backend-to-backend. La key se guarda en `.env`, no expuesta al frontend.

### Risks

1. **Límites de Supabase Storage Free Tier**: 1 GB de storage, 5 GB de bandwidth. Si la BD crece mucho y se acumulan backups, se puede llegar al límite rápido. Mitigación: policy de retención remota (ej: mantener últimos 5 backups en la nube).

2. **Costo inesperado**: Si se pasa del free tier, el plan Pro es $25/mes con 100 GB incluidos. Pero hay que monitorear.

3. **Inactividad → proyecto pausado**: Free tier pausea proyectos sin actividad por 7 días. Si el scheduler de backup es lo único que pega al proyecto, podría no ser considerado "actividad". Mitigación: el backup sube archivos, eso genera tráfico HTTP → cuenta como actividad. Verificar.

4. **Seguridad de la API key**: La `SUPABASE_SERVICE_KEY` tiene full access al proyecto. Debe tratarse como secreto. No committear el `.env`.

5. **Tamaño de backup**: Si la BD es grande (>50 MB), subir archivos grandes puede timeout. Usar upload con chunked transfer o asegurar timeout suficiente en el cliente HTTP.

6. **Bucket público vs privado**: El bucket de backups NO debe ser público. Usar bucket privado con RLS policies. El upload usa service_role que bypass RLS.

### Ready for Proposal

**Yes** — la exploración está completa, hay suficiente información para pasar a `sdd-propose`. Los riesgos están identificados y la aproximación recomendada es clara (local-first + upload sync con `supabase-py`).

La implementación es incremental y no rompe nada existente. El mayor riesgo es operacional (límites del free tier de Supabase), no técnico.
