import { useState, useEffect } from "react";
import { MdOutlinePerson, MdOutlineLock, MdOutlineFileDownload } from "react-icons/md";
import { RiGroupLine, RiShoppingBasketLine, RiMoneyDollarCircleLine } from "react-icons/ri";
import { useAuthStore } from "../stores/authStore";
import { changePassword, exportClients, exportProducts, exportSales } from "../api/settings.api";

const SettingsPage = () => {
  const user = useAuthStore((s) => s.user);

  // Password form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  // Export
  const [exporting, setExporting] = useState<string | null>(null);

  // Reset messages when form changes
  useEffect(() => {
    setPasswordError(null);
    setPasswordSuccess(null);
  }, [oldPassword, newPassword, confirmPassword]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Completá todos los campos");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden");
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError("La nueva contraseña debe ser diferente a la actual");
      return;
    }

    setIsChanging(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordSuccess("Contraseña actualizada correctamente");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        "Error al cambiar la contraseña. Revisá los datos.";
      setPasswordError(detail);
    } finally {
      setIsChanging(false);
    }
  };

  const handleExport = async (type: string, fn: () => Promise<void>) => {
    setExporting(type);
    try {
      await fn();
    } catch {
      setPasswordError(`Error al exportar ${type}`);
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
          <h2 className="text-xl font-semibold text-on-surface">Perfil de Usuario</h2>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-surface-container rounded-xl">
          <div>
            <span className="text-sm text-on-surface-variant">Usuario</span>
            <p className="text-on-surface font-medium">{user?.username || "—"}</p>
          </div>
          <div>
            <span className="text-sm text-on-surface-variant">Email</span>
            <p className="text-on-surface font-medium">{user?.email || "—"}</p>
          </div>
        </div>

        {/* Change Password */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg text-text-primary">
            <MdOutlineLock />
          </span>
          <h3 className="text-lg font-semibold text-on-surface">Cambiar Contraseña</h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Contraseña actual
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Repetí la nueva contraseña"
            />
          </div>

          {passwordError && (
            <p className="text-sm text-text-error">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-green-600">{passwordSuccess}</p>
          )}

          <button
            type="submit"
            disabled={isChanging}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isChanging ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>

      {/* Exportar Datos */}
      <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xl text-text-primary">
            <MdOutlineFileDownload />
          </span>
          <h2 className="text-xl font-semibold text-on-surface">Exportar Datos</h2>
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
              <p className="font-medium text-on-surface">Clientes</p>
              <p className="text-sm text-on-surface-variant">
                {exporting === "clientes" ? "Descargando..." : "CSV"}
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
              <p className="font-medium text-on-surface">Productos</p>
              <p className="text-sm text-on-surface-variant">
                {exporting === "productos" ? "Descargando..." : "CSV"}
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
              <p className="font-medium text-on-surface">Ventas</p>
              <p className="text-sm text-on-surface-variant">
                {exporting === "ventas" ? "Descargando..." : "CSV"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
