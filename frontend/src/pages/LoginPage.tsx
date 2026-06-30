import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useStoreConfig } from '../stores/storeConfigStore';
import { useForm } from "react-hook-form";
//Mensajes
import { toast } from "react-hot-toast";
// Models
import type { LoginCredentials } from '../models/auth';
//Icons
import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";

const LoginPage = () => {
  const { login, isLoading, error, isAuthenticated, setError } = useAuthStore();
  const { config, fetchConfig } = useStoreConfig();
  useEffect(() => { fetchConfig(); }, [fetchConfig]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();
  const navigate = useNavigate();
  const [showkPass, setShowPass] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => setError(null);
  }, [setError]);

  const onSubmit = handleSubmit(async (data: LoginCredentials) => {
    try {
      await login({
        username: data.username,
        password: data.password,
      });

      toast.success('Login exitoso');
      // Redirect to the dashboard
      navigate("/");
    } catch {
      toast.error("Error al iniciar sesión");
    }
  });

  // Visibilidad del pass
  const handlePass = () => {
    setShowPass(!showkPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low px-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-text-primary">{config?.store_name || "La Tiendita"}</h1>
          <p className="text-on-surface-variant text-sm">FiadoApp — Iniciá sesión para continuar</p>
        </div>

        {error && (
          <div className="bg-error-container text-text-error px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-on-surface-variant mb-1">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-bg placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="Ingresá tu usuario"
              autoComplete="username"
              disabled={isLoading}
              {...register("username", {
                required: {
                  value: true,
                  message: "Nombre de usuario requerido",
                },
              })}
            />
            {
              errors.username && <span className='text-red-500 text-sm'>{errors.username.message}</span>
            }
          </div>
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-on-surface-variant mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showkPass ? "text" : "password"}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-bg placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                placeholder="Ingresá tu contraseña"
                autoComplete="current-password"
                disabled={isLoading}
                {...register("password", {
                  required: {
                    value: true,
                    message: "Contraseña requerida",
                  },
                })}
              />
              <button type="button" onClick={handlePass} className="absolute inset-y-0 right-0 flex items-center px-3 text-outline hover:text-on-bg">
                {showkPass ? <MdOutlineVisibility /> : <MdOutlineVisibilityOff />}
              </button>
            </div>
            {
              errors.password && <span className='text-red-500 text-sm'>{errors.password.message}</span>
            }
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-on-surface font-semibold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-on-surface border-t-transparent rounded-full animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
export default LoginPage;