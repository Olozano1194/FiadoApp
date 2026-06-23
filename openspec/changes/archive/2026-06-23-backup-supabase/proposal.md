# Proposal: Backup a Supabase Storage

## Intent

Agregar Supabase Storage como destino de backup en la nube para FiadoApp.
El backup local ya funciona; queremos poder subir copias a la nube para proteger
los datos ante pérdida del equipo, y permitir restaurar desde backups remotos.

## Scope

### In Scope
- Upload automático del backup local a Supabase Storage post-backup
- Botón manual "Subir a la nube" desde el UI de configuración
- Listar backups remotos y restaurar desde la nube
- Multi-tenant: un solo proyecto Supabase para múltiples instalaciones (UUID por tienda)
- Política de retención: mantener últimos N backups remotos, auto-eliminar viejos
- Configuración on/off desde BackupConfig + UI

### Out of Scope
- Migración de backups existentes a Supabase (se suben a partir de la activación)
- Compresión/encriptación adicional (el archivo ya está comprimido con gzip)
- Backup programado independiente del local (usa el mismo schedule)

## Capabilities

### New Capabilities
- `cloud-backup`: gestión de backups en Supabase Storage — upload, listado, descarga, restauración y retención automática

### Modified Capabilities
- `data-backup`: se agrega upload a la nube como paso posterior al backup local, más configuración remota en BackupConfig

## Approach

**Local-first + upload sync.** El backup local corre exactamente igual. Si la configuración
`supabase_enabled` está activa, se sube el archivo .db.gz resultante a Supabase Storage
usando la API REST con service_role key.

Cada instalación genera un UUID único en el primer setup, usado como prefijo de carpeta
dentro del bucket (`backups/{uuid}/backup_20260623_021814.db.gz`), permitiendo que un solo
proyecto Supabase sirva múltiples tiendas.

Para restore desde la nube: endpoint GET que lista archivos remotos → usuario elige →
download a temp → restore_db() existente.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `coreApp/backup_utils.py` | Modified | Nueva función `upload_to_supabase()`, `list_remote_backups()`, `download_from_supabase()`, limpieza remota |
| `coreApp/models.py` | Modified | `BackupConfig`: nuevos campos `supabase_enabled`, `supabase_bucket`, `installation_uuid`, `max_remote_backups` |
| `coreApp/views/backup.py` | Modified | Nuevos endpoints REST: upload manual, listar remotos, restaurar desde remoto |
| `coreApp/urls.py` | Modified | Nuevas rutas para cloud backup |
| `coreApp/management/commands/auto_backup.py` | Modified | Step post-backup: upload a la nube si está habilitado |
| `frontend/src/api/settings.api.ts` | Modified | Funciones para cloud backup |
| `frontend/src/pages/SettingsPage.tsx` | Modified | UI para cloud backup (toggle, botón upload, lista remota, restore) |
| `config/settings.py` | Modified | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET` |
| `requirements.txt` | Modified | `supabase-py>=2.0` o `storage3>=0.7` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Límites free tier (1 GB storage, 5 GB bandwidth) | Medium | Retención automática (máx 10 backups remotos), por instalación |
| Service role key comprometida | Low | Solo en .env, nunca committeada. Rotación manual si es necesario |
| Timeout en upload de backups grandes | Low | Timeout configurable en cliente HTTP, chunked transfer |
| Proyecto Supabase pausado por inactividad | Low | Los uploads generan tráfico HTTP = actividad |
| Backup local y cloud out of sync | Low | El upload es post-backup inmediato. Si falla, se reintenta en el próximo ciclo |

## Rollback Plan

```bash
# Si algo falla:
git revert HEAD --no-edit
# Revertir migración
python manage.py migrate coreApp 00XX
# Deshabilitar en SettingsPage si se desplegó UI
```

## Dependencies

- `supabase-py>=2.0` o `storage3>=0.7` (cliente Supabase Storage)
- Cuenta Supabase con proyecto activo y storage bucket
- `SUPABASE_SERVICE_KEY` en .env de cada instalación

## Success Criteria

- [ ] Backup local + upload a Supabase funciona end-to-end
- [ ] Restaurar desde backup remoto funciona
- [ ] Multi-tenant: backups de distintas instalaciones no se mezclan
- [ ] Política de retención elimina backups viejos automáticamente
- [ ] Toggle on/off desde configuración funciona
- [ ] UI muestra lista de backups remotos
