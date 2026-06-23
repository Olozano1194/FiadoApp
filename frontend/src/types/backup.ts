export interface BackupConfig {
  enabled: boolean;
  frequency_hours: number;
  max_backups: number;
  last_backup: string | null;
  backup_folder: string;
  db_file_size: number;
  db_engine: string;
  supabase_enabled: boolean;
  supabase_bucket: string;
  installation_uuid: string;
  max_remote_backups: number;
}

export interface ImportResponse {
  success: boolean;
  message: string;
}

export interface CloudBackupEntry {
  name: string;
  size: number;
  updated_at: string;
}

export interface CloudBackupListResponse {
  backups: CloudBackupEntry[];
}

export interface CloudBackupUploadResponse {
  success: boolean;
  remote_path: string;
}
