import os
from datetime import datetime

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..backup_utils import backup_db, detect_engine, get_db_file_size, get_latest_backup, restore_db
from ..models import BackupConfig
from ..supabase_utils import (
    ensure_installation_uuid,
    list_remote_backups,
    download_remote_backup,
    upload_backup,
    enforce_retention,
)


class ExportDbView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Export the database as a gzip-compressed SQLite file."""
        from django.http import FileResponse

        try:
            backup_path = backup_db()
            file_size = os.path.getsize(backup_path)
            response = FileResponse(
                open(backup_path, 'rb'),
                content_type='application/gzip',
                as_attachment=True,
                filename=f"fiadoapp_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db.gz"
            )
            response['Content-Length'] = file_size
            return response
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Error al crear el backup: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ImportDbView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Restore the database from an uploaded backup file."""
        import tempfile

        if 'file' not in request.FILES:
            return Response(
                {"error": "No se envió ningún archivo"},
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_file = request.FILES['file']

        if uploaded_file.size > settings.DATA_UPLOAD_MAX_MEMORY_SIZE:
            return Response(
                {"error": f"El archivo excede el límite de "
                          f"{settings.DATA_UPLOAD_MAX_MEMORY_SIZE // 1024 // 1024} MB"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with tempfile.NamedTemporaryFile(suffix='.db.gz', delete=False) as tmp:
            for chunk in uploaded_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        try:
            restore_db(tmp_path, create_safety_backup=True)
            return Response({
                "success": True,
                "message": "Base de datos restaurada correctamente"
            })
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Error al restaurar: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)


class BackupConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current backup configuration."""
        config = BackupConfig.get_singleton()
        return Response({
            'enabled': config.enabled,
            'frequency_hours': config.frequency_hours,
            'max_backups': config.max_backups,
            'last_backup': config.last_backup,
            'backup_folder': config.backup_folder or settings.BACKUP_ROOT,
            'db_file_size': get_db_file_size(),
            'db_engine': detect_engine(),
            'supabase_enabled': config.supabase_enabled,
            'supabase_bucket': config.supabase_bucket,
            'installation_uuid': config.installation_uuid,
            'max_remote_backups': config.max_remote_backups,
        })

    def put(self, request):
        """Update backup configuration."""
        config = BackupConfig.get_singleton()

        for field in ['enabled', 'frequency_hours', 'max_backups', 'backup_folder',
                       'supabase_enabled', 'supabase_bucket', 'max_remote_backups']:
            if field in request.data:
                setattr(config, field, request.data[field])

        config.save()
        return Response({'success': True})


class CloudBackupUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Upload latest local backup to Supabase."""
        config = BackupConfig.get_singleton()
        if not config.supabase_enabled:
            return Response({"error": "Cloud backup is disabled"}, status=400)

        uuid = ensure_installation_uuid(config)
        latest = get_latest_backup()
        if not latest:
            return Response({"error": "No local backup found"}, status=400)

        try:
            remote_path = upload_backup(latest, uuid)
            enforce_retention(uuid, config.max_remote_backups)
            return Response({"success": True, "remote_path": remote_path})
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class CloudBackupListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        config = BackupConfig.get_singleton()
        if not config.supabase_enabled or not config.installation_uuid:
            return Response({"backups": []})
        try:
            backups = list_remote_backups(config.installation_uuid)
            return Response({"backups": backups})
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class CloudBackupRestoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, filename):
        config = BackupConfig.get_singleton()
        if not config.supabase_enabled or not config.installation_uuid:
            return Response({"error": "Cloud backup is disabled"}, status=400)

        remote_path = f"backups/{config.installation_uuid}/{filename}"
        try:
            local_path = download_remote_backup(remote_path)
            restore_db(local_path, create_safety_backup=True)
            return Response({"success": True, "message": "Database restored from cloud backup"})
        except Exception as e:
            return Response({"error": str(e)}, status=500)
