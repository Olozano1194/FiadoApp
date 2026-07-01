import os
import glob
import logging

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from coreApp.models import BackupConfig
from coreApp.backup_utils import backup_db, get_latest_backup
from coreApp.supabase_utils import (
    ensure_installation_uuid,
    upload_backup,
    enforce_retention,
)

logger = logging.getLogger('fiadoapp.backup')


class Command(BaseCommand):
    help = "Crea una copia de seguridad automática de la base de datos"

    def handle(self, *args, **options):
        try:
            config = BackupConfig.get_singleton()
        except Exception as e:
            logger.error("Error al obtener BackupConfig: %s", e)
            raise CommandError("No se pudo obtener la configuración de backup") from e

        if not config.enabled:
            logger.info("auto-backup disabled")
            return

        try:
            backup_db()
        except Exception as e:
            logger.error("Error durante backup_db: %s", e)
            raise CommandError("Error al crear el backup local") from e

        try:
            from django.utils import timezone
            config.last_backup = timezone.now()
            config.save()
        except Exception as e:
            logger.error("Error al actualizar last_backup: %s", e)
            # No crítico — el backup ya se creó correctamente

        # Upload to Supabase if enabled
        if config.supabase_enabled:
            try:
                uuid = ensure_installation_uuid(config)
                latest = get_latest_backup()
                if latest:
                    upload_backup(latest, uuid)
                    enforce_retention(uuid, config.max_remote_backups)
                    self.stdout.write("Backup uploaded to Supabase")
            except Exception as e:
                logger.error("Supabase upload failed (local backup OK): %s", e)

        try:
            backup_dir = settings.BACKUP_ROOT
            pattern = os.path.join(backup_dir, '*.db.gz')
            files = sorted(glob.glob(pattern), key=os.path.getmtime)
            while len(files) > config.max_backups:
                oldest = files.pop(0)
                os.remove(oldest)
                self.stdout.write(f"Eliminado backup antiguo: {oldest}")
        except Exception as e:
            logger.error("Error durante la rotación de backups: %s", e)
