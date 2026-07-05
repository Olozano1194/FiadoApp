import os
import threading
import logging

from django.apps import AppConfig

logger = logging.getLogger('fiadoapp.backup')


class CoreappConfig(AppConfig):
    name = 'coreApp'

    def ready(self):
        if os.environ.get('FIADOAPP_SCHEDULER_STARTED'):
            return
        os.environ['FIADOAPP_SCHEDULER_STARTED'] = '1'

        if os.environ.get('FIADOAPP_RUNNING_TESTS'):
            return

        self._start_backup_scheduler()

    def _start_backup_scheduler(self):
        """Start the BackupScheduler in a background thread."""
        from coreApp.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        thread = threading.Thread(target=scheduler.start, daemon=True)
        thread.start()
        logger.info("BackupScheduler started via AppConfig")
