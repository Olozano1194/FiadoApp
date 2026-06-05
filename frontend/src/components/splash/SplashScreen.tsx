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
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
          <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center">
            <span className="text-3xl text-text-error">!</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Error de conexión con el servidor</h2>
          {errorMessage && (
            <p className="text-sm text-on-surface-variant">{errorMessage}</p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Reconectar
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
          {status === 'retrying' ? `Reintentando${attempt ? ` (intento ${attempt})` : ''}...` : 'Iniciando servidor...'}
        </p>
      </div>
    </section>
  )
}
export default SplashScreen