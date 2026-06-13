import gzip
import json
import os
import shutil
import sqlite3
import tempfile
from datetime import datetime

from django.conf import settings
from django.core import serializers
from django.db import connection


def detect_engine():
    engine = settings.DATABASES['default']['ENGINE']
    if 'sqlite3' in engine:
        return 'sqlite'
    elif 'mysql' in engine:
        return 'mysql'
    return 'unknown'


def get_current_db_path():
    db_settings = settings.DATABASES['default']
    if detect_engine() == 'sqlite':
        return db_settings['NAME']
    return None


_IMPORT_ORDER = [
    'Category',
    'Product',
    'Client',
    'Sale',
    'SaleItem',
    'FiadoPayment',
    'Expense',
    'CashClosure',
    'BackupConfig',
]


def _get_core_models():
    from django.apps import apps
    return list(apps.get_app_config('coreApp').get_models())


def _get_migration_names():
    from django.db.migrations.recorder import MigrationRecorder
    return list(
        MigrationRecorder.Migration.objects
        .filter(app='coreApp')
        .values_list('name', flat=True)
    )


def _serialize_mysql():
    model_map = {m.__name__: m for m in _get_core_models()}
    data = {}
    for name in _IMPORT_ORDER:
        model = model_map.get(name)
        if model is not None:
            data[name] = json.loads(serializers.serialize('json', model.objects.all()))
    return {
        'engine': 'mysql',
        'version': 1,
        'migrations': _get_migration_names(),
        'data': data,
    }


def backup_db(output_path=None):
    if output_path is None:
        os.makedirs(settings.BACKUP_ROOT, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join(settings.BACKUP_ROOT, f"backup_{timestamp}.db.gz")

    engine = detect_engine()

    if engine == 'sqlite':
        db_path = get_current_db_path()
        if not db_path:
            raise ValueError("No se pudo determinar la ruta de la base de datos")

        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
            temp_db_path = tmp.name

        try:
            source_conn = sqlite3.connect(db_path)
            dest_conn = sqlite3.connect(temp_db_path)
            source_conn.backup(dest_conn)
            source_conn.close()
            dest_conn.close()

            with open(temp_db_path, 'rb') as f_in:
                with gzip.open(output_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
        finally:
            if os.path.exists(temp_db_path):
                os.unlink(temp_db_path)

    elif engine == 'mysql':
        serialized = _serialize_mysql()
        raw = json.dumps(serialized, ensure_ascii=False, default=str).encode('utf-8')
        with gzip.open(output_path, 'wb') as f_out:
            f_out.write(raw)

    else:
        raise ValueError(f"Motor de base de datos no soportado: {engine}")

    return output_path


def validate_backup_file(file_path):
    try:
        with gzip.open(file_path, 'rb') as f:
            header = f.read(16)
    except gzip.BadGzipFile:
        return False, "El archivo no es un archivo gzip válido"
    except Exception as e:
        return False, f"Error al leer el archivo: {str(e)}"

    engine = detect_engine()

    if engine == 'sqlite':
        if header[:6] != b'SQLite':
            return False, "El archivo no es una base de datos SQLite válida"
        return True, ""

    elif engine == 'mysql':
        try:
            with gzip.open(file_path, 'rb') as f:
                content = f.read()
            data = json.loads(content.decode('utf-8'))
            if not isinstance(data, dict) or data.get('engine') != 'mysql':
                return False, "El archivo no es un backup de MySQL válido"
            if 'data' not in data:
                return False, "El backup no contiene datos"
            return True, ""
        except (json.JSONDecodeError, UnicodeDecodeError):
            return False, "El archivo no tiene un formato JSON válido"
        except Exception as e:
            return False, f"Error al validar el archivo: {str(e)}"

    return False, f"Motor de base de datos no soportado: {engine}"


def restore_db(backup_file, create_safety_backup=True):
    if create_safety_backup:
        safety_path = backup_db()
        print(f"[backup] Safety backup created at: {safety_path}")

    is_valid, error = validate_backup_file(backup_file)
    if not is_valid:
        raise ValueError(error)

    engine = detect_engine()

    if engine == 'sqlite':
        _restore_sqlite(backup_file)
    elif engine == 'mysql':
        _restore_mysql(backup_file)
    else:
        raise ValueError(f"Motor de base de datos no soportado: {engine}")

    return True


def _restore_sqlite(backup_file):
    db_path = get_current_db_path()
    if not db_path:
        raise ValueError("No se pudo determinar la ruta de la base de datos")

    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
        temp_db_path = tmp.name

    try:
        with gzip.open(backup_file, 'rb') as f_in:
            with open(temp_db_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)

        connection.close()
        shutil.copy2(temp_db_path, db_path)
        connection.connect()
    finally:
        if os.path.exists(temp_db_path):
            os.unlink(temp_db_path)


def _restore_mysql(backup_file):
    with gzip.open(backup_file, 'rb') as f:
        content = f.read()

    data = json.loads(content.decode('utf-8'))
    serialized_data = data['data']
    model_map = {m.__name__: m for m in _get_core_models()}

    with connection.cursor() as cursor:
        cursor.execute("SET FOREIGN_KEY_CHECKS=0")

        for name in reversed(_IMPORT_ORDER):
            model = model_map.get(name)
            if model is not None:
                cursor.execute(f"TRUNCATE TABLE `{model._meta.db_table}`")

        cursor.execute("SET FOREIGN_KEY_CHECKS=1")

    for name in _IMPORT_ORDER:
        records = serialized_data.get(name)
        if records:
            json_str = json.dumps(records, ensure_ascii=False)
            for obj in serializers.deserialize('json', json_str):
                obj.save(raw=True)


def get_db_file_size():
    engine = detect_engine()
    if engine == 'sqlite':
        db_path = get_current_db_path()
        if db_path and os.path.exists(db_path):
            return os.path.getsize(db_path)
        return 0
    elif engine == 'mysql':
        db_name = settings.DATABASES['default']['NAME']
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COALESCE(SUM(data_length + index_length), 0) "
                "FROM information_schema.tables "
                "WHERE table_schema = %s",
                [db_name],
            )
            return int(cursor.fetchone()[0])
    return 0


def get_db_info():
    engine = detect_engine()
    info = {'engine': engine}
    if engine == 'sqlite':
        info['path'] = get_current_db_path()
        info['size'] = get_db_file_size()
    elif engine == 'mysql':
        db_settings = settings.DATABASES['default']
        info['host'] = db_settings.get('HOST', 'localhost')
        info['name'] = db_settings['NAME']
        info['size'] = get_db_file_size()
    return info
