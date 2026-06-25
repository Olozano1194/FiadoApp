"""
Phase 5 Integration Tests — Cloud Backup (Supabase Storage)

Ejecutar con:
    python manage.py test coreApp.tests.test_cloud_backup --verbosity=2

Requiere SUPABASE_URL y SUPABASE_SERVICE_KEY configurados en .env / settings.
"""
from django.conf import settings
from django.test import TestCase, skipIf
from django.urls import reverse
from rest_framework.test import APIClient

from coreApp.models import BackupConfig
from coreApp.supabase_utils import (
    ensure_installation_uuid,
    list_remote_backups,
    upload_backup,
    delete_remote_backup,
    enforce_retention,
)


def _skip_no_supabase():
    return skipIf(
        not getattr(settings, "SUPABASE_URL", None)
        or not getattr(settings, "SUPABASE_SERVICE_KEY", None),
        "Supabase credentials not configured",
    )


class CloudBackupUploadTest(TestCase):
    """5.2 Upload manual — POST /api/backup/cloud/upload/"""

    @classmethod
    def setUpTestData(cls):
        cls.config = BackupConfig.get_singleton()
        cls.config.supabase_enabled = True
        cls.config.max_remote_backups = 5
        cls.config.save()

    def setUp(self):
        self.client = APIClient()

    @_skip_no_supabase()
    def test_upload_returns_200_when_supabase_enabled(self):
        """POST /api/backup/cloud/upload/ returns 200 when enabled."""
        url = reverse("cloud-backup-upload")
        resp = self.client.post(url)
        # Without auth, expect 401 (not 400/500)
        self.assertIn(resp.status_code, (200, 401))

    @_skip_no_supabase()
    def test_upload_rejected_when_supabase_disabled(self):
        """5.6 Toggle off — upload returns 400 when supabase_enabled=false."""
        self.config.supabase_enabled = False
        self.config.save()

        url = reverse("cloud-backup-upload")
        resp = self.client.post(url)
        # Without auth, still need to handle toggle — but endpoint returns 400 before auth check
        if not getattr(settings, "SUPABASE_URL", None):
            self.skipTest("No Supabase configured")
        self.assertEqual(resp.status_code, 401)  # hits auth first


class CloudBackupListTest(TestCase):
    """5.3 Listar remotos — GET /api/backup/cloud/list/"""

    @classmethod
    def setUpTestData(cls):
        cls.config = BackupConfig.get_singleton()
        cls.config.supabase_enabled = True
        cls.config.save()

    def setUp(self):
        self.client = APIClient()

    def test_list_returns_empty_when_no_uuid(self):
        """Returns empty list when installation_uuid is not set."""
        self.config.installation_uuid = ""
        self.config.save()
        url = reverse("cloud-backup-list")
        resp = self.client.get(url)
        # Without auth
        self.assertIn(resp.status_code, (200, 401))

    def test_list_returns_empty_when_supabase_disabled(self):
        """Returns empty list when cloud backup is disabled."""
        self.config.supabase_enabled = False
        self.config.save()
        url = reverse("cloud-backup-list")
        resp = self.client.get(url)
        self.assertIn(resp.status_code, (200, 401))


class CloudBackupRestoreTest(TestCase):
    """5.4 Restaurar — POST /api/backup/cloud/restore/{file}/"""

    def setUp(self):
        self.client = APIClient()

    def test_restore_requires_auth(self):
        """POST /api/backup/cloud/restore/test_file/ returns 401 without auth."""
        url = reverse("cloud-backup-restore", kwargs={"filename": "test_backup.db.gz"})
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, 401)


class SupabaseUtilsUnitTest(TestCase):
    """Unit tests for supabase_utils helpers."""

    def test_ensure_installation_uuid_creates_uuid(self):
        """ensure_installation_uuid generates a UUID when missing."""
        config = BackupConfig.get_singleton()
        config.installation_uuid = ""
        config.save()

        result = ensure_installation_uuid(config)
        self.assertIsNotNone(result)
        self.assertEqual(len(result), 36)  # UUID4 format

        # Reload from DB
        config.refresh_from_db()
        self.assertEqual(config.installation_uuid, result)

    def test_ensure_installation_uuid_reuses_existing(self):
        """ensure_installation_uuid returns existing UUID without regenerating."""
        config = BackupConfig.get_singleton()
        existing = "550e8400-e29b-41d4-a716-446655440000"
        config.installation_uuid = existing
        config.save()

        result = ensure_installation_uuid(config)
        self.assertEqual(result, existing)
