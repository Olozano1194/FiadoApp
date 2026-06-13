export interface BackupConfig {
  enabled: boolean;
  frequency_hours: number;
  max_backups: number;
  last_backup: string | null;
  backup_folder: string;
  db_file_size: number;
  db_engine: string;
}

export interface ImportResponse {
  success: boolean;
  message: string;
}
