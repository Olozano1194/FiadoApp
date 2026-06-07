#!/usr/bin/env python
"""
FiadoApp Backend Server — Entry point for PyInstaller.
Runs Django with migrations, initial data, and starts the HTTP server.
All output is logged to APPDATA/FiadoApp/backend.log for diagnostics.
"""
import logging
import os
import sys
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


def _serve_wsgi(wsgi_app, host: str, port: int):
    """
    Serve the WSGI application directly using wsgiref.
    This avoids any threading/management-command quirks in frozen PyInstaller mode.
    """
    import http.server
    import socketserver
    from wsgiref.simple_server import WSGIRequestHandler, ServerHandler, WSGIServer

    # Patch ServerHandler to log requests
    orig_handle_run = ServerHandler.run

    def log_handle_run(self, application):
        req_handler = self.request_handler
        logging.info("Handling: %s %s", req_handler.command, req_handler.path)
        return orig_handle_run(self, application)

    ServerHandler.run = log_handle_run

    server = WSGIServer((host, port), WSGIRequestHandler)
    server.set_app(wsgi_app)

    logging.info("WSGI server listening on http://%s:%s", host, port)
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
    try:
        base_dir = _get_base_dir()
        data_dir = _get_data_dir()

        # Setup logging BEFORE anything else
        log_file = _setup_logging(data_dir, base_dir)
        _install_excepthook(log_file)

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

        # Use direct WSGI server instead of runserver management command
        # This avoids threading issues in frozen PyInstaller environments
        wsgi_app = get_wsgi_application()
        _serve_wsgi(wsgi_app, '127.0.0.1', 8000)

    except Exception as e:
        logging.critical("FATAL: %s: %s", type(e).__name__, e)
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"\n{'='*60}\n")
            f.write(f"FATAL ERROR: {type(e).__name__}: {e}\n")
            traceback.print_exc(file=f)
            f.write(f"{'='*60}\n")
        raise


if __name__ == '__main__':
    main()
