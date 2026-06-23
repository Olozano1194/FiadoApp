import logging
import os
from datetime import datetime
from pathlib import Path

from django.conf import settings
from storage3 import create_client

logger = logging.getLogger(__name__)


def get_supabase_client():
    """Initialize Supabase Storage client."""
    url = f"{settings.SUPABASE_URL}/storage/v1"
    # New Supabase key format (sb_secret_...) requires apikey header, not Bearer JWT
    headers = {"apikey": settings.SUPABASE_SERVICE_KEY}
    return create_client(url, headers, is_async=False)


def ensure_installation_uuid(config):
    """Generate UUID if this installation doesn't have one."""
    if not config.installation_uuid:
        import uuid
        config.installation_uuid = str(uuid.uuid4())
        config.save(update_fields=['installation_uuid'])
    return config.installation_uuid


def _remote_folder(uuid):
    return f"backups/{uuid}"


def upload_backup(local_path, installation_uuid):
    """Upload a .db.gz file to Supabase Storage."""
    client = get_supabase_client()
    folder = _remote_folder(installation_uuid)
    filename = os.path.basename(local_path)
    remote_path = f"{folder}/{filename}"

    with open(local_path, 'rb') as f:
        client.from_(settings.SUPABASE_BUCKET).upload(
            remote_path, f.read(),
            {'content-type': 'application/gzip', 'upsert': 'true'}
        )

    return remote_path


def list_remote_backups(installation_uuid):
    """List all backups for this installation."""
    client = get_supabase_client()
    folder = _remote_folder(installation_uuid)
    files = client.from_(settings.SUPABASE_BUCKET).list(folder)

    result = []
    for f in files:
        result.append({
            'name': f['name'],
            'size': f.get('metadata', {}).get('size', 0),
            'updated_at': f.get('updated_at', ''),
        })

    result.sort(key=lambda x: x['updated_at'], reverse=True)
    return result


def download_remote_backup(remote_path, temp_dir=None):
    """Download a file from Supabase Storage to a temporary location."""
    import tempfile

    client = get_supabase_client()
    data = client.from_(settings.SUPABASE_BUCKET).download(remote_path)

    if temp_dir is None:
        temp_dir = tempfile.gettempdir()

    filename = os.path.basename(remote_path)
    local_path = os.path.join(temp_dir, filename)

    with open(local_path, 'wb') as f:
        f.write(data)

    return local_path


def delete_remote_backup(remote_path):
    """Delete a single file from Supabase Storage."""
    client = get_supabase_client()
    client.from_(settings.SUPABASE_BUCKET).remove([remote_path])


def enforce_retention(installation_uuid, max_count=10):
    """Delete oldest backups if over the retention limit."""
    files = list_remote_backups(installation_uuid)
    if len(files) > max_count:
        to_delete = files[max_count:]
        for f in to_delete:
            folder = _remote_folder(installation_uuid)
            remote_path = f"{folder}/{f['name']}"
            try:
                delete_remote_backup(remote_path)
                logger.info("Deleted old remote backup: %s", remote_path)
            except Exception as e:
                logger.error("Failed to delete %s: %s", remote_path, e)
