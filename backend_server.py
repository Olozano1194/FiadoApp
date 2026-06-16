#!/usr/bin/env python
"""
FiadoApp Backend Server — Entry point for PyInstaller.
Runs Django with migrations, initial data, and starts the HTTP server.
All output is logged to APPDATA/FiadoApp/backend.log for diagnostics.
"""
import logging
import os
import sys
import threading
import traceback
from pathlib import Path

# Detect if running as Tauri sidecar
IS_TAURI_SIDECAR = os.environ.get('FIADOAPP_TAURI', '').lower() in ('true', '1', 'yes')


def _is_frozen():
    """Check if running as a PyInstaller executable."""
    return getattr(sys, 'frozen', False)


def _get_base_dir():
    """Get the base directory where project files are located."""
    if _is_frozen():
        return Path(sys._MEIPASS)
    else:
        return Path(__file__).resolve().parent


def _get_data_dir():
    """
    Get the persistent data directory.
    In frozen mode: %APPDATA%/FiadoApp (persists across updates)
    In dev mode: same as BASE_DIR (current behavior)
    """
    if _is_frozen():
        import platform
        system = platform.system()
        if system == 'Windows':
            appdata = Path(os.environ.get('APPDATA', Path.home() / 'AppData' / 'Roaming'))
        elif system == 'Darwin':
            appdata = Path.home() / 'Library' / 'Application Support'
        else:
            appdata = Path(os.environ.get('XDG_DATA_HOME', Path.home() / '.local' / 'share'))

        data_dir = appdata / 'FiadoApp'
    else:
        data_dir = _get_base_dir()

    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def _setup_logging(data_dir: Path, base_dir: Path):
    """Configure logging to file + console."""
    log_file = data_dir / 'backend.log'

    # Root logger: write everything to the log file
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    # File handler — keeps all messages
    fh = logging.FileHandler(log_file, mode='a', encoding='utf-8')
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(logging.Formatter(
        '%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
    ))
    root_logger.addHandler(fh)

    # Console handler — only INFO and above, no timestamps (cleaner for terminal)
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch.setFormatter(logging.Formatter('%(message)s'))
    root_logger.addHandler(ch)

    logging.info("=" * 60)
    logging.info("  FiadoApp Backend Server starting")
    logging.info("=" * 60)
    logging.info("Frozen: %s", _is_frozen())
    logging.info("Base dir: %s", base_dir)
    logging.info("Data dir: %s", data_dir)
    logging.info("Log file: %s", log_file)
    logging.info("Tauri sidecar: %s", IS_TAURI_SIDECAR)
    logging.info("Python: %s", sys.version)

    return log_file


def _install_excepthook(log_file: Path):
    """Install a global hook so UNCAUGHT exceptions are written to the log."""
    def excepthook(exc_type, exc_value, exc_tb):
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"\n{'='*60}\n")
            f.write(f"UNCAUGHT EXCEPTION: {exc_type.__name__}: {exc_value}\n")
            traceback.print_tb(exc_tb, file=f)
            f.write(f"{'='*60}\n")
        # Also let the original handler run (prints to stderr if console=True)
        sys.__excepthook__(exc_type, exc_value, exc_tb)

    sys.excepthook = excepthook


def _check_port_available(host: str, port: int) -> bool:
    """Check if the port is available before trying to bind to it."""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind((host, port))
        return True
    except OSError:
        return False


class BackupScheduler:
    """Background scheduler for automatic DB backups using threading.Timer."""

    def __init__(self):
        self._timer = None
        self._running = False
        self.logger = logging.getLogger('fiadoapp.backup')

    def start(self):
        """Start the scheduler loop."""
        self._running = True
        self._schedule_next()
        logging.info("BackupScheduler started")

    def stop(self):
        """Stop the scheduler."""
        self._running = False
        if self._timer:
            self._timer.cancel()
            self._timer = None
        logging.info("BackupScheduler stopped")

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
            logging.info("BackupScheduler: next backup in %d hours", config.frequency_hours)
        except Exception as e:
            logging.error("BackupScheduler: error scheduling next backup: %s", e)
            # Reschedule anyway to avoid total deadlock
            self._timer = threading.Timer(3600, self._run_backup)  # retry in 1h
            self._timer.daemon = True
            self._timer.start()

    def _run_backup(self):
        """Execute the backup and reschedule."""
        try:
            from django.core.management import call_command
            call_command('auto_backup', verbosity=0)
        except Exception as e:
            logging.error("BackupScheduler: backup failed: %s", e)
        finally:
            self._schedule_next()


def _serve_wsgi(wsgi_app, host: str, port: int):
    """
    Serve the WSGI application directly using a multi-threaded WSGIServer.
    This avoids any threading/management-command quirks in frozen PyInstaller mode.
    """
    from wsgiref.simple_server import WSGIRequestHandler, WSGIServer
    from socketserver import ThreadingMixIn

    class ThreadingWSGIServer(ThreadingMixIn, WSGIServer):
        daemon_threads = True

    class LoggingWSGIRequestHandler(WSGIRequestHandler):
        def log_message(self, format, *args):
            origin = self.headers.get('Origin', 'None')
            status_code = args[1] if len(args) > 1 else '?'
            # args[0] is request line (e.g. GET /api/ HTTP/1.1), args[1] is status code
            logging.info("WSGI: %s | Status: %s | Origin: %s", args[0], status_code, origin)

    server = ThreadingWSGIServer((host, port), LoggingWSGIRequestHandler)
    server.set_app(wsgi_app)

    logging.info("WSGI server listening on http://%s:%s (Multi-threaded)", host, port)
    logging.info("Press Ctrl+C to stop")

    # Test that the server actually responds
    try:
        import socket
        s = socket.create_connection((host, port), timeout=2)
        s.close()
        logging.info("Port %s is open and accepting connections", port)
    except Exception as e:
        logging.warning("Quick port check failed: %s", e)

    # Serve forever
    server.serve_forever()


def main():
    log_file = None
    try:
        base_dir = _get_base_dir()
        data_dir = _get_data_dir()

        # Setup logging BEFORE anything else
        log_file = _setup_logging(data_dir, base_dir)
        _install_excepthook(log_file)

        # Verificar que el puerto esté disponible
        HOST = os.environ.get('FIADOAPP_HOST', '127.0.0.1')
        PORT = int(os.environ.get('FIADOAPP_PORT', 8000))
        if not _check_port_available(HOST, PORT):
            logging.critical(
                "FATAL: Puerto %s en uso. Otro proceso ya está usando el puerto. "
                "Cierre la aplicación anterior o verifique con: netstat -ano | findstr :%s",
                PORT, PORT
            )
            sys.exit(1)

        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
        os.environ['FIADOAPP_DATA_DIR'] = str(data_dir)
        sys.path.insert(0, str(base_dir))

        if 'FIADOAPP_DEBUG' in os.environ:
            os.environ['DJANGO_DEBUG'] = os.environ['FIADOAPP_DEBUG']
        else:
            os.environ['DJANGO_DEBUG'] = 'False'

        logging.info("DJANGO_SETTINGS_MODULE set, importing django...")

        import django
        from django.core.management import call_command
        from django.core.wsgi import get_wsgi_application

        django.setup()
        logging.info("Django setup complete")

        logging.info("Running database migrations...")
        call_command('migrate', verbosity=0)
        logging.info("Migrations complete")

        logging.info("Loading initial data...")
        call_command('load_initial_data', verbosity=0)
        logging.info("Initial data loaded")

        # Start auto-backup scheduler
        scheduler = BackupScheduler()
        scheduler.start()

        # Use direct WSGI server instead of runserver management command
        # This avoids threading issues in frozen PyInstaller environments
        wsgi_app = get_wsgi_application()
        _serve_wsgi(wsgi_app, HOST, PORT)

    except Exception as e:
        logging.critical("FATAL: %s: %s", type(e).__name__, e)
        if log_file is not None:
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(f"\n{'='*60}\n")
                f.write(f"FATAL ERROR: {type(e).__name__}: {e}\n")
                traceback.print_exc(file=f)
                f.write(f"{'='*60}\n")
        raise


if __name__ == '__main__':
    main()