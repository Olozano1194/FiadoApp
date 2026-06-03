#!/usr/bin/env python
"""
FiadoApp Backend Server — Entry point for PyInstaller.
Runs Django with migrations, initial data, and starts the HTTP server.
"""
import os
import sys
from pathlib import Path


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


def main():
    base_dir = _get_base_dir()
    data_dir = _get_data_dir()

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

    os.environ['FIADOAPP_DATA_DIR'] = str(data_dir)

    sys.path.insert(0, str(base_dir))

    if 'FIADOAPP_DEBUG' in os.environ:
        os.environ['DJANGO_DEBUG'] = os.environ['FIADOAPP_DEBUG']
    else:
        os.environ['DJANGO_DEBUG'] = 'False'

    import django
    from django.core.management import call_command

    django.setup()

    print("=" * 60)
    print("  FiadoApp Backend Server")
    print("  Data directory: {}".format(data_dir))
    print("=" * 60)

    print("[FiadoApp] Running database migrations...")
    call_command('migrate', verbosity=0)

    print("[FiadoApp] Loading initial data...")
    call_command('load_initial_data', verbosity=0)

    print("[FiadoApp] Starting server at http://127.0.0.1:8000")
    print("[FiadoApp] Press Ctrl+C to stop")
    call_command('runserver', '--noreload', '127.0.0.1:8000')


if __name__ == '__main__':
    main()
