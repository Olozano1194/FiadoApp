import { useState, useEffect, useCallback, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import SplashScreen from './components/splash/SplashScreen'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import LayoutAdmin from './layouts/LayoutAdmin'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Error404 from './pages/Error404'
import ProductsPage from './pages/ProductsPage'
import ClientsPage from './pages/ClientsPage'
import PosPage from './pages/PosPage'
import SalesHistoryPage from './pages/SalesHistoryPage'
import ReportPage from './pages/ReportPage'
import SettingsPage from './pages/SettingsPage'
import CierrePage from './pages/CierrePage'
import api, { API_BASE_URL } from './api/axios.config'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const POLL_INTERVAL = 1000   // 1 segundo entre intentos
const MAX_ATTEMPTS = 180     // 3 minutos máximo (PCs lentos necesitan más tiempo)
const INITIAL_DELAY_MS = 2000 // 2 segundos antes del primer intento

type BackendStatus = 'loading' | 'error' | 'ready' | 'retrying'

const App = () => {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>(
    isTauri ? 'loading' : 'ready',
  )
  const [attempt, setAttempt] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopPolling = useCallback(() => {
    if (delayRef.current !== null) {
      clearTimeout(delayRef.current)
      delayRef.current = null
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    setBackendStatus('loading')
    setAttempt(0)
    stopPolling()

    // Retraso inicial: el proceso Python necesita tiempo para arrancar
    delayRef.current = setTimeout(() => {
      delayRef.current = null

      intervalRef.current = setInterval(async () => {
        setAttempt((prev) => {
          const next = prev + 1

          if (next > MAX_ATTEMPTS) {
            stopPolling()
            setBackendStatus('error')
            return prev
          }

          if (next > 1) {
            setBackendStatus((s) => (s === 'loading' ? 'loading' : 'retrying'))
          }

          return next
        })

        try {
          await api.get(API_BASE_URL)
          stopPolling()
          setBackendStatus('ready')
        } catch {
          // keep polling
        }
      }, POLL_INTERVAL)
    }, INITIAL_DELAY_MS)
  }, [stopPolling])

  useEffect(() => {
    if (isTauri) {
      startPolling()
    }
    return stopPolling
  }, [startPolling, stopPolling])

  const handleRetry = useCallback(() => {
    startPolling()
  }, [startPolling])

  if (isTauri && backendStatus !== 'ready') {
    const splashStatus = backendStatus === 'error' ? 'error' : attempt > 1 ? 'retrying' : 'loading'
    return (
      <SplashScreen
        status={splashStatus}
        onRetry={backendStatus === 'error' ? handleRetry : undefined}
        attempt={attempt}
      />
    )
  }

  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<LayoutAdmin />}>
          <Route index element={<HomePage />} />
          <Route path="inventario" element={<ProductsPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="ventas/historial" element={<SalesHistoryPage />} />
          <Route path="ventas" element={<PosPage />} />
          <Route path="cierre" element={<CierrePage />} />
          <Route path="reportes" element={<ReportPage />} />
          <Route path="ajustes" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Error404 />} />
    </Routes>
    </ErrorBoundary>
  )
}
export default App;