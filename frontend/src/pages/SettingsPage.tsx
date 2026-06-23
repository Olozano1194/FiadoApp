import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form"
import { MdOutlineLock, MdOutlineFileDownload, MdOutlinePerson, MdOutlineStorage } from "react-icons/md";
import { RiGroupLine, RiShoppingBasketLine, RiMoneyDollarCircleLine } from "react-icons/ri";
import { useAuthStore } from "../stores/authStore";
import { changePassword, exportClients, exportDb, exportProducts, exportSales, getBackupConfig, importDb, listCloudBackups, restoreCloudBackup, triggerDownload, updateBackupConfig, uploadCloudBackup } from "../api/settings.api";
import type { BackupConfig, CloudBackupEntry } from "../types/backup";
//Mensajes
import { toast } from "react-hot-toast";

interface Credentials {
  oldPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

const SettingsPage = () => {
  const user = useAuthStore((s) => s.user);
  // Password form
  const {
    register,
    handleSubmit,
    getValues, reset,
    formState: { errors },
  } = useForm<Credentials>();  
  const [isChanging, setIsChanging] = useState(false);

  // Export
  const [exporting, setExporting] = useState<string | null>(null);

  // Backup
  const [backupConfig, setBackupConfig] = useState<BackupConfig | null>(null);
  const [exportingDb, setExportingDb] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloud Backup
  const [uploadingCloud, setUploadingCloud] = useState(false);
  const [cloudBackups, setCloudBackups] = useState<CloudBackupEntry[]>([]);
  const [loadingCloudList, setLoadingCloudList] = useState(false);
  const [restoringCloud, setRestoringCloud] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const config = await getBackupConfig();
        setBackupConfig(config);
        if (config.supabase_enabled) {
          try {
            const result = await listCloudBackups();
            setCloudBackups(result.backups || []);
          } catch {
            // Cloud list not available yet, that's ok
          }
        }
      } catch {
        toast.error("Error al cargar configuración de backup");
      }
    };
    load();
  }, []);

  const handleExportDb = async () => {
    setExportingDb(true);
    try {
      const blob = await exportDb();
      const now = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
      triggerDownload(blob, `fiadoapp_backup_${now}.db.gz`);
      toast.success("Backup descargado correctamente");
    } catch {
      toast.error("Error al crear el backup");
    } finally {
      setExportingDb(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowConfirmModal(true);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setShowConfirmModal(false);
    try {
      const result = await importDb(selectedFile);
      if (result.success) {
        toast.success(result.message);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr?.response?.data?.error || "Error al restaurar la base de datos";
      toast.error(msg);
    } finally {
      setImporting(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveAutoBackup = async () => {
    if (!backupConfig) return;
    setSavingConfig(true);
    try {
      await updateBackupConfig({
        enabled: backupConfig.enabled,
        frequency_hours: backupConfig.frequency_hours,
        max_backups: backupConfig.max_backups,
        supabase_enabled: backupConfig.supabase_enabled,
        max_remote_backups: backupConfig.max_remote_backups,
      });
      toast.success("Configuración de auto-backup guardada");
    } catch {
      toast.error("Error al guardar la configuración");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUploadCloud = async () => {
    setUploadingCloud(true);
    try {
      const result = await uploadCloudBackup();
      if (result.success) {
        toast.success("Backup subido a la nube correctamente");
        await loadCloudBackups();
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr?.response?.data?.error || "Error al subir a la nube";
      toast.error(msg);
    } finally {
      setUploadingCloud(false);
    }
  };

  const loadCloudBackups = async () => {
    if (!backupConfig?.supabase_enabled) return;
    setLoadingCloudList(true);
    try {
      const result = await listCloudBackups();
      setCloudBackups(result.backups || []);
    } catch {
      toast.error("Error al listar backups en la nube");
    } finally {
      setLoadingCloudList(false);
    }
  };

  const handleRestoreCloud = async (filename: string) => {
    setRestoringCloud(filename);
    try {
      const result = await restoreCloudBackup(filename);
      if (result.success) {
        toast.success(result.message);
        await loadCloudBackups();
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr?.response?.data?.error || "Error al restaurar desde la nube";
      toast.error(msg);
    } finally {
      setRestoringCloud(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  

  const handleChangePassword = handleSubmit(async (data: Credentials) => {
    setIsChanging(true);
    try {
      await changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      reset();
      toast.success('Contraseña actualizada correctamente');
    } catch {
      toast.error("Error al cambiar la contraseña");
    } finally {
      setIsChanging(false);
    }
  });

  const handleExport = async (type: string, fn: () => Promise<void>) => {
    setExporting(type);
    try {
      await fn();
    } catch {
      toast.error(`Error al exportar ${type}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <section className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Ajustes</h1>
        <p className="text-on-surface-variant mt-1">
          Gestioná tu cuenta y exportá los datos del negocio
        </p>
      </div>

      {/* Perfil */}
      <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xl text-text-primary">
            <MdOutlinePerson />
          </span>
          <h2 className="text-xl font-semibold text-on-surface-variant">Perfil de Usuario</h2>
        </div>
        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-surface-container rounded-xl">
          <div>
            <span className="text-sm text-on-surface-variant">Usuario</span>
            <p className="text-outline font-medium">{user?.username || "—"}</p>
          </div>
          <div>
            <span className="text-sm text-on-surface-variant">Email</span>
            <p className="text-outline font-medium">{user?.email || "—"}</p>
          </div>
        </div>
        {/* Change Password */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg text-text-primary">
            <MdOutlineLock />
          </span>
          <h3 className="text-lg font-semibold text-on-surface-variant">Cambiar Contraseña</h3>
        </div>
        {/* Form Password */}
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Contraseña actual
            </label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high text-outline border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
              {...register("oldPassword", {
                required: {
                  value: true,
                  message: "Contraseña requerida",
                },
              })}
            />
            {
              errors.oldPassword && <span className='text-red-500 text-sm'>{errors.oldPassword.message}</span>
            }
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high text-outline border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Mínimo 8 caracteres"
              {...register("newPassword", {
                required: {
                  value: true,
                  message: "Contraseña requerida",
                },
              })}
            />
            {
              errors.newPassword && <span className='text-red-500 text-sm'>{errors.newPassword.message}</span>
            }
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high text-outline border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Repetí la nueva contraseña"
              {...register('confirmPassword', {
                required: {
                  value: true,
                  message: 'Confirmar contraseña requerido'
                },
                validate: (value) => value === getValues('newPassword') || 'Las contraseñas no coinciden',
              })}
            />
            {
              errors.confirmPassword && <span className='text-red-500 text-sm'>{errors.confirmPassword.message}</span>
            }
          </div>
          <button
            type="submit"
            disabled={isChanging}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isChanging ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>

      {/* Backup de Base de Datos */}
      <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xl text-text-primary">
            <MdOutlineStorage />
          </span>
          <h2 className="text-xl font-semibold text-on-surface-variant">Backup de Base de Datos</h2>
        </div>

        {backupConfig && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-surface-container rounded-xl">
            <div>
              <span className="text-sm text-on-surface-variant">Motor de base de datos</span>
              <p className="text-outline font-medium uppercase">{backupConfig.db_engine}</p>
            </div>
            <div>
              <span className="text-sm text-on-surface-variant">Tamaño de la DB</span>
              <p className="text-outline font-medium">{formatBytes(backupConfig.db_file_size)}</p>
            </div>
            <div>
              <span className="text-sm text-on-surface-variant">Último backup</span>
              <p className="text-outline font-medium">
                {backupConfig.last_backup
                  ? new Date(backupConfig.last_backup).toLocaleString('es-AR')
                  : "—"}
              </p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-on-surface-variant mb-3">Exportar</h3>
          <button
            onClick={handleExportDb}
            disabled={exportingDb}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {exportingDb ? "Exportando..." : "Exportar base de datos"}
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-on-surface-variant mb-3">Restaurar respaldo</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept=".db.gz"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-6 py-2.5 bg-surface-container-high text-outline border border-outline-variant rounded-xl font-medium hover:bg-primary/10 hover:border-primary/30 transition-colors disabled:opacity-50"
          >
            {importing ? "Restaurando..." : "Seleccionar archivo"}
          </button>
          <p className="text-sm text-red-500 mt-2">
            Esta acción reemplazará TODOS los datos actuales
          </p>
        </div>

        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant max-w-md mx-4">
              <h3 className="text-lg font-semibold text-on-surface-variant mb-4">Restaurar respaldo</h3>
              <p className="text-on-surface-variant mb-2">Se creará un respaldo de seguridad antes de restaurar.</p>
              <p className="text-red-500 font-medium mb-6">Esta acción reemplazará TODOS los datos actuales.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRestore}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                >
                  Restaurar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Backup Configuration */}
        <div className="mt-8 pt-6 border-t border-outline-variant">
          <h3 className="text-lg font-semibold text-on-surface-variant mb-4">
            Auto-Backup Programado
          </h3>

          {backupConfig && (
            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-on-surface-variant">
                  Auto-backup activado
                </label>
                <button
                  onClick={() => {
                    const newEnabled = !backupConfig.enabled;
                    setBackupConfig({ ...backupConfig, enabled: newEnabled });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    backupConfig.enabled ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      backupConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">
                  Frecuencia (horas)
                </label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={backupConfig.frequency_hours}
                  onChange={(e) =>
                    setBackupConfig({
                      ...backupConfig,
                      frequency_hours: parseInt(e.target.value) || 24,
                    })
                  }
                  className="w-full max-w-[200px] px-4 py-2.5 rounded-xl bg-surface-container-high text-outline border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Max Backups */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">
                  Máximo de backups guardados
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={backupConfig.max_backups}
                  onChange={(e) =>
                    setBackupConfig({
                      ...backupConfig,
                      max_backups: parseInt(e.target.value) || 10,
                    })
                  }
                  className="w-full max-w-[200px] px-4 py-2.5 rounded-xl bg-surface-container-high text-outline border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Info text */}
              <p className="text-sm text-on-surface-variant">
                Los backups se guardan en: <code className="bg-surface-container-high px-1 rounded">{backupConfig.backup_folder}</code>
              </p>

              {/* Save button */}
              <button
                onClick={handleSaveAutoBackup}
                disabled={savingConfig}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {savingConfig ? "Guardando..." : "Guardar configuración"}
              </button>
            </div>
          )}
        </div>

        {/* Cloud Backup (Supabase) */}
        <div className="mt-8 pt-6 border-t border-outline-variant">
          <h3 className="text-lg font-semibold text-on-surface-variant mb-4">
            Backup en la Nube
          </h3>

          {backupConfig && (
            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-on-surface-variant">
                  Subida automática a la nube
                </label>
                <button
                  onClick={() => {
                    const newEnabled = !backupConfig.supabase_enabled;
                    setBackupConfig({ ...backupConfig, supabase_enabled: newEnabled });
                    if (!newEnabled) setCloudBackups([]);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    backupConfig.supabase_enabled ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      backupConfig.supabase_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Remote backups count */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">
                  Máximo de backups remotos
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={backupConfig.max_remote_backups}
                  onChange={(e) =>
                    setBackupConfig({
                      ...backupConfig,
                      max_remote_backups: parseInt(e.target.value) || 10,
                    })
                  }
                  className="w-full max-w-[200px] px-4 py-2.5 rounded-xl bg-surface-container-high text-outline border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {backupConfig.supabase_enabled && (
                <>
                  {/* Upload button */}
                  <button
                    onClick={handleUploadCloud}
                    disabled={uploadingCloud}
                    className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {uploadingCloud ? "Subiendo..." : "Subir a la nube"}
                  </button>

                  {/* Cloud backups list */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-on-surface-variant">
                        Backups remotos
                      </span>
                      <button
                        onClick={loadCloudBackups}
                        disabled={loadingCloudList}
                        className="text-sm text-primary hover:underline disabled:opacity-50"
                      >
                        {loadingCloudList ? "Cargando..." : "Actualizar"}
                      </button>
                    </div>

                    {cloudBackups.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">
                        {loadingCloudList ? "Cargando..." : "No hay backups remotos"}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {cloudBackups.map((bk) => (
                          <div
                            key={bk.name}
                            className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high border border-outline-variant"
                          >
                            <div className="min-w-0 flex-1 mr-2">
                              <p className="text-sm font-medium text-outline truncate">
                                {bk.name}
                              </p>
                              <p className="text-xs text-on-surface-variant">
                                {formatBytes(bk.size)} —{" "}
                                {bk.updated_at
                                  ? new Date(bk.updated_at).toLocaleString("es-AR")
                                  : "—"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRestoreCloud(bk.name)}
                              disabled={restoringCloud === bk.name}
                              className="px-3 py-1.5 text-xs rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {restoringCloud === bk.name ? "Restaurando..." : "Restaurar"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Exportar Datos */}
      <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xl text-text-primary">
            <MdOutlineFileDownload />
          </span>
          <h2 className="text-xl font-semibold text-on-surface-variant">Exportar Datos</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleExport("clientes", exportClients)}
            disabled={exporting !== null}
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-surface-container-high border border-outline-variant hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-50"
          >
            <span className="text-2xl text-text-primary">
              <RiGroupLine />
            </span>
            <div className="text-center">
              <p className="font-medium text-nav">Clientes</p>
              <p className="text-sm text-on-surface-variant">
                {exporting === "clientes" ? "Descargando..." : "XLSX"}
              </p>
            </div>
          </button>

          <button
            onClick={() => handleExport("productos", exportProducts)}
            disabled={exporting !== null}
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-surface-container-high border border-outline-variant hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-50"
          >
            <span className="text-2xl text-text-primary">
              <RiShoppingBasketLine />
            </span>
            <div className="text-center">
              <p className="font-medium text-nav">Productos</p>
              <p className="text-sm text-on-surface-variant">
                {exporting === "productos" ? "Descargando..." : "XLSX"}
              </p>
            </div>
          </button>

          <button
            onClick={() => handleExport("ventas", exportSales)}
            disabled={exporting !== null}
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-surface-container-high border border-outline-variant hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-50"
          >
            <span className="text-2xl text-text-primary">
              <RiMoneyDollarCircleLine />
            </span>
            <div className="text-center">
              <p className="font-medium text-nav">Ventas</p>
              <p className="text-sm text-on-surface-variant">
                {exporting === "ventas" ? "Descargando..." : "XLSX"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
export default SettingsPage;