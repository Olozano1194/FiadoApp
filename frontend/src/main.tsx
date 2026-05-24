import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import { useAuthStore } from './stores/authStore';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-container-low">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-on-surface-variant font-medium">Cargando...</p>
    </div>
  </div>
);

const AppWithAuth = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    useAuthStore.getState().restoreSession().finally(() => setReady(true));
  }, []);

  if (!ready) return <LoadingScreen />;

  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AppWithAuth />
    </Router>
    <Toaster />
  </StrictMode>,
)
