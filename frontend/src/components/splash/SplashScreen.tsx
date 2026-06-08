import { type JSX } from 'react'

interface SplashScreenProps {
  status: 'loading' | 'error' | 'retrying'
  onRetry?: () => void
  errorMessage?: string
  attempt?: number
}

const Spinner = () => (
  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
)

const SplashScreen = ({ status, onRetry, errorMessage, attempt }: SplashScreenProps): JSX.Element => {
  if (status === 'error') {
    return (
      <section className="h-screen w-screen flex items-center justify-center bg-surface-container-low">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
          <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center">
            <span className="text-3xl text-text-error">!</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">No se pudo conectar al servidor</h2>
          <p className="text-sm text-on-surface-variant">
            El servidor interno no respondió después de 3 minutos.
          </p>
          {errorMessage && (
            <p className="text-sm text-on-surface-variant">{errorMessage}</p>
          )}
          <div className="mt-1 p-3 bg-surface-variant rounded-xl text-left w-full">
            <p className="text-xs font-semibold text-on-surface-variant mb-1">Causas comunes:</p>
            <ul className="text-xs text-on-surface-variant space-y-1 list-disc list-inside">
              <li>Antivirus bloqueó el proceso del servidor</li>
              <li>El puerto 8000 está en uso por otro programa</li>
              <li>Falta el directorio <code>_internal</code> junto al instalador</li>
            </ul>
          </div>
          <div className="p-3 bg-surface-variant rounded-xl text-left w-full">
            <p className="text-xs font-semibold text-on-surface-variant mb-1">Log de diagnóstico:</p>
            <code className="text-xs text-on-surface-variant break-all">
              %APPDATA%\FiadoApp\backend.log
            </code>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Reintentar conexión
            </button>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="h-screen w-screen flex items-center justify-center bg-surface-container-low">
      <div className="flex flex-col items-center gap-4">
        <Spinner />
        <p className="text-on-surface-variant font-medium">
          {status === 'retrying' ? `Esperando al servidor${attempt ? ` (${attempt}s)` : ''}...` : 'Iniciando FiadoApp...'}
        </p>
      </div>
    </section>
  )
}
export default SplashScreen