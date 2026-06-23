# Delta Specs: Cloud Backup (Supabase Storage)

## Domain: data-backup

### ADDED Requirements

#### Requirement: Installation Identity
The system SHALL generate a unique UUID4 for each installation upon first cloud backup operation.
The UUID SHALL be stored in `BackupConfig.installation_uuid`.
The UUID SHALL be used as folder prefix in the Supabase Storage bucket.
The UUID SHALL persist across app restarts.

#### Requirement: Supabase Credentials
The system SHALL read `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `SUPABASE_BUCKET` from Django settings.
These SHALL be configured via `.env` file.
The service_role key SHALL be used (not anon key).
The system SHALL NOT expose credentials to the frontend.

#### Requirement: Upload After Local Backup
When `BackupConfig.supabase_enabled` is True and `auto_backup` completes successfully,
the system SHALL upload the generated `.db.gz` file to Supabase Storage.
The upload target SHALL be `backups/{installation_uuid}/{filename}`.
If the upload fails, the system SHALL log the error and continue — the local backup is unaffected.

#### Requirement: Manual Upload
The system SHALL provide `POST /api/backup/cloud/upload/` that uploads the latest local backup.
The endpoint SHALL be idempotent: uploading the same filename overwrites the remote copy.
The endpoint SHALL return the remote path and file size on success.

#### Requirement: List Remote Backups
The system SHALL provide `GET /api/backup/cloud/list/` that lists files in `backups/{installation_uuid}/`.
The response SHALL include: filename, size in bytes, last modified timestamp.
The list SHALL be sorted by last modified descending (newest first).

#### Requirement: Restore from Remote Backup
The system SHALL provide `POST /api/backup/cloud/restore/{filename}/` that:
1. Downloads the selected file from Supabase Storage to a temporary location
2. Calls the existing `restore_db()` function
3. Returns success or error message
The endpoint SHALL authenticate with the same IsAuthenticated permission.

#### Requirement: Remote Retention Policy
When a new backup is uploaded, the system SHALL count existing files in `backups/{installation_uuid}/`.
If the count exceeds `BackupConfig.max_remote_backups`, the system SHALL delete the oldest files.
The retention check SHALL run after each successful upload (both automatic and manual).

#### Requirement: Configuration Toggle
The system SHALL provide `PUT /api/backup/config/` with the field `supabase_enabled`.
When disabled, no upload occurs after local backup.
When disabled, the cloud backup section in the UI SHALL be hidden.

---

## Scenarios

### Scenario: Upload succeeds after local backup
- GIVEN supabase_enabled=True and valid credentials
- WHEN auto_backup completes successfully
- THEN the .db.gz file is uploaded to backups/{uuid}/backup_YYYYMMDD_HHMMSS.db.gz
- AND the remote file size matches the local file size

### Scenario: Upload fails gracefully
- GIVEN supabase_enabled=True but Supabase is unreachable
- WHEN auto_backup completes
- THEN the local backup is saved normally
- AND the error is logged
- AND no exception propagates to the caller

### Scenario: Restore from remote backup
- GIVEN there are remote backups listed
- WHEN the user selects a backup and calls restore
- THEN the file is downloaded to a temporary location
- AND restore_db() is called with that file
- AND the database is restored

### Scenario: Retention deletes oldest backup
- GIVEN max_remote_backups=2 and 2 backups already exist
- WHEN a new backup is uploaded
- THEN the oldest remote backup is deleted
- AND the new backup is available in the list

### Scenario: Multi-tenant isolation
- GIVEN installation A (uuid_a) and installation B (uuid_b) use the same Supabase project
- WHEN installation A lists its remote backups
- THEN it only sees files under backups/uuid_a/
- AND installation B's files under backups/uuid_b/ are NOT visible

### Scenario: Toggle disables upload
- GIVEN supabase_enabled=False
- WHEN auto_backup completes
- THEN no upload is attempted
- AND the remote backup list is not shown in the UI

### Scenario: First run generates UUID
- GIVEN BackupConfig.installation_uuid is empty
- WHEN the first cloud upload is triggered
- THEN a UUID4 is generated and saved to BackupConfig
- AND the upload uses the new UUID as folder prefix
