"""
BackupScheduler — background scheduler for automatic DB backups.
Can be started from AppConfig.ready() or from backend_server.py.
Uses threading.Timer to schedule backups at config.frequency_hours intervals.
"""

import threading
import logging

logger = logging.getLogger('fiadoapp.backup')


class BackupScheduler:
    """Background scheduler for automatic DB backups using threading.Timer."""

    def __init__(self):
        self._timer = None
        self._running = False

    def start(self):
        """Start the scheduler loop."""
        self._running = True
        self._schedule_next()
        logger.info("BackupScheduler started")

    def stop(self):
        """Stop the scheduler."""
        self._running = False
        if self._timer:
            self._timer.cancel()
            self._timer = None
        logger.info("BackupScheduler stopped")

    def _schedule_next(self):
        """Read config and schedule the next backup."""
        if not self._running:
            return
        try:
            from coreApp.models import BackupConfig
            config = BackupConfig.get_singleton()
            interval = config.frequency_hours * 3600  # hours → seconds
            self._timer = threading.Timer(interval, self._run_backup)
            self._timer.daemon = True
            self._timer.start()
            logger.info("BackupScheduler: next backup in %d hours", config.frequency_hours)
        except Exception as e:
            logger.error("BackupScheduler: error scheduling next backup: %s", e)
            # Reschedule anyway to avoid total deadlock
            self._timer = threading.Timer(3600, self._run_backup)
            self._timer.daemon = True
            self._timer.start()

    def _run_backup(self):
        """Execute the backup and reschedule."""
        try:
            from django.core.management import call_command
            call_command('auto_backup', verbosity=0)
        except Exception as e:
            logger.error("BackupScheduler: backup failed: %s", e)
        finally:
            self._schedule_next()
