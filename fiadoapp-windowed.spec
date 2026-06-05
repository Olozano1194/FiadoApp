# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec for FiadoApp backend server."""

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(os.getcwd())


def _collect_migrations(package_name: str, package_root: Path) -> list:
    """Collect migration module names from a Django app's migrations directory."""
    imports = []
    migrations_dir = package_root / 'migrations'
    if migrations_dir.is_dir():
        for f in sorted(migrations_dir.iterdir()):
            if f.suffix == '.py' and f.stem != '__init__':
                imports.append(f'{package_name}.migrations.{f.stem}')
    return imports


a = Analysis(
    ['backend_server.py'],
    pathex=[str(PROJECT_ROOT)],
    binaries=[],
    datas=[
        (str(PROJECT_ROOT / 'coreApp' / 'fixtures'), 'coreApp/fixtures'),
        (str(PROJECT_ROOT / 'coreApp' / 'migrations'), 'coreApp/migrations'),
    ],
    hiddenimports=[
        # Core application
        'coreApp', 'coreApp.admin', 'coreApp.apps', 'coreApp.models',
        'coreApp.serializers', 'coreApp.views', 'coreApp.urls',
        'coreApp.management.commands.load_initial_data',
        # Migrations
        *_collect_migrations('coreApp', PROJECT_ROOT / 'coreApp'),
        # Third-party Django apps
        'rest_framework', 'rest_framework.authtoken',
        'rest_framework_simplejwt', 'rest_framework_simplejwt.token_blacklist',
        'corsheaders',
        # Media/image processing
        'PIL', 'PIL.Image', 'PIL.ImageDraw',
        # Export
        'openpyxl', 'openpyxl.styles',
        # Utilities
        'dj_database_url', 'dotenv', 'sqlite3',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'gunicorn', 'uvicorn', 'daphne',
        'boto3', 'botocore', 's3transfer',
        'psycopg2', 'pymongo', 'bson', 'dnspython',
        'django_storages', 'django_filter', 'whitenoise',
        'pytest', 'nose',
        'IPython', 'jedi', 'parso', 'debugpy', 'ipykernel',
        'setuptools', 'pip', 'wheel', 'pywin32',
    ],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='fiadoapp-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='fiadoapp-backend',
)
