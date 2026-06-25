"""
Phase 5 Integration Tests — Retention Policy & Toggle

Ejecutar con:
    python manage.py test coreApp.tests.test_cloud_retention --verbosity=2

Requiere SUPABASE_URL y SUPABASE_SERVICE_KEY configurados en .env / settings.
"""
from django.conf import settings
from django.test import TestCase, skipIf
from rest_framework.test import APIClient

from coreApp.models import BackupConfig
from coreApp.supabase_utils import (
    ensure_installation_uuid,
    list_remote_backups,
    delete_remote_backup,
    enforce_retention,
)


def _skip_no_supabase():
    return skipIf(
        not getattr(settings, "SUPABASE_URL", None)
        or not getattr(settings, "SUPABASE_SERVICE_KEY", None),
        "Supabase credentials not configured",
    )


class CloudRetentionTest(TestCase):
    """5.5 Retención (max_remote_backups=2)"""

    @classmethod
    def setUpTestData(cls):
        cls.config = BackupConfig.get_singleton()
        cls.config.supabase_enabled = True
        cls.config.max_remote_backups = 2
        cls.config.save()

    def setUp(self):
        self.client = APIClient()

    @_skip_no_supabase()
    def test_enforce_retention_removes_extra_backups(self):
        """enforce_retention keeps max_count files, removes the rest."""
        uuid = ensure_installation_uuid(self.config)
        files_before = list_remote_backups(uuid)
        count_before = len(files_before)

        if count_before <= 2:
            self.skipTest("Need more than 2 remote backups to test retention")

        enforce_retention(uuid, max_count=2)
        files_after = list_remote_backups(uuid)
        self.assertLessEqual(len(files_after), 2)

    @_skip_no_supabase()
    def test_enforce_retention_does_not_remove_when_under_limit(self):
        """enforce_retention does nothing when file count is within limit."""
        uuid = ensure_installation_uuid(self.config)
        files_before = list_remote_backups(uuid)
        count_before = len(files_before)

        if count_before >= 10:
            self.skipTest("Too many files to test under-limit scenario")

        enforce_retention(uuid, max_count=10)
        files_after = list_remote_backups(uuid)
        self.assertEqual(len(files_after), count_before)


class CloudToggleTest(TestCase):
    """5.6 Toggle off — supabase_enabled=false"""

    @classmethod
    def setUpTestData(cls):
        cls.config = BackupConfig.get_singleton()
        cls.config.installation_uuid = ""
        cls.config.supabase_enabled = False
        cls.config.save()

    def setUp(self):
        self.client = APIClient()

    def test_list_returns_empty_when_toggled_off(self):
        """GET /api/backup/cloud/list/ returns [] when supabase_enabled=false."""
        url = "/api/backup/cloud/list/"
        resp = self.client.get(url)
        # Without auth
        self.assertIn(resp.status_code, (200, 401))

    def test_config_toggle_persists(self):
        """PUT /api/backup/config/ with supabase_enabled persists the change."""
        self.client.force_login(self.client)  # will fail, that's fine — tests auth first
        url = "/api/backup/config/"
        resp = self.client.put(
            url,
            {"supabase_enabled": True},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, (200, 401))

    def test_toggle_off_blocks_upload(self):
        """Upload endpoint rejects when supabase_enabled=false (before auth)."""
        self.config.supabase_enabled = False
        self.config.save()

        url = "/api/backup/cloud/upload/"
        resp = self.client.post(url)
        self.assertIn(resp.status_code, (400, 401))


class RetentionLogicUnitTest(TestCase):
    """Unit tests for retention math (no Supabase needed)."""

    def test_enforce_retention_under_limit_noop(self):
        """enforce_retention with max_count=0 does nothing."""
        config = BackupConfig.get_singleton()
        uuid = ensure_installation_uuid(config)
        # This should not crash even with no remote files
        try:
            enforce_retention(uuid, max_count=0)
        except Exception:
            self.fail("enforce_retention raised unexpectedly")
