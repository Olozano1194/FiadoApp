import { useState } from "react";
import { useForm } from "react-hook-form"
import { MdOutlinePerson, MdOutlineLock, MdOutlineFileDownload } from "react-icons/md";
import { RiGroupLine, RiShoppingBasketLine, RiMoneyDollarCircleLine } from "react-icons/ri";
import { useAuthStore } from "../stores/authStore";
import { changePassword, exportClients, exportProducts, exportSales } from "../api/settings.api";
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
              <p className="font-medium text-nav">Productos</p>
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
              <p className="font-medium text-nav">Ventas</p>
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