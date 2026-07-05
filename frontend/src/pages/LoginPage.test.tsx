import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './LoginPage';
import { useAuthStore } from '../stores/authStore';
import { useStoreConfig } from '../stores/storeConfigStore';
import { createMockAuthStore } from '../test/mocks/authStoreMock';
import { createMockStoreConfigStore } from '../test/mocks/storeConfigStoreMock';
import type { MockAuthStore } from '../test/mocks/authStoreMock';
import type { MockStoreConfigState } from '../test/mocks/storeConfigStoreMock';
import { toast } from 'react-hot-toast';


const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../stores/storeConfigStore', () => ({
  useStoreConfig: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('LoginPage', () => {
  let mockAuth: MockAuthStore;
  let mockConfig: MockStoreConfigState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    mockAuth = createMockAuthStore();
    mockConfig = createMockStoreConfigStore();

    // @ts-expect-error — Zustand overloaded selector needs implicit any
    vi.mocked(useAuthStore).mockImplementation(((selector) => {
      return selector ? selector(mockAuth) : mockAuth;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);

    // @ts-expect-error — Zustand overloaded selector needs implicit any
    vi.mocked(useStoreConfig).mockImplementation(((selector) => {
      return selector ? selector(mockConfig) : mockConfig;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);
  });

  // 1. Store name from config
  it('renders store name from config', () => {
    mockConfig.config = { store_name: 'Mi Tienda' };

    render(<LoginPage />);

    expect(screen.getByText('Mi Tienda')).toBeInTheDocument();
  });

  // 2. Fallback store name
  it('renders fallback "La Tiendita" when config is null', () => {
    mockConfig.config = null;

    render(<LoginPage />);

    expect(screen.getByText('La Tiendita')).toBeInTheDocument();
  });

  // 3. Empty username shows validation error
  it('shows required error for empty username on submit', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Contraseña'), '1234');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    expect(screen.getByText('Nombre de usuario requerido')).toBeInTheDocument();
    expect(mockAuth.login).not.toHaveBeenCalled();
  });

  // 4. Empty password shows validation error
  it('shows required error for empty password on submit', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Usuario'), 'admin');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    expect(screen.getByText('Contraseña requerida')).toBeInTheDocument();
    expect(mockAuth.login).not.toHaveBeenCalled();
  });

  // 5. Valid credentials call login
  it('calls login with username and password on valid submit', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), '1234');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    await waitFor(() => {
      expect(mockAuth.login).toHaveBeenCalledWith({ username: 'admin', password: '1234' });
    });
  });

  // 6. Login success → toast + navigate
  it('shows success toast and navigates to / on login success', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), '1234');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Login exitoso');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  // 7. Login failure → error toast
  it('shows error toast when login throws', async () => {
    const user = userEvent.setup();
    mockAuth.login = vi.fn().mockRejectedValue(new Error('API Error'));

    render(<LoginPage />);

    await user.type(screen.getByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), '1234');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al iniciar sesión');
    });
  });

  // 8. Loading state
  it('shows loading spinner and disables inputs when isLoading', () => {
    mockAuth.isLoading = true;

    render(<LoginPage />);

    expect(screen.getByText('Iniciando sesión...')).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario')).toBeDisabled();
    expect(screen.getByLabelText('Contraseña')).toBeDisabled();
  });

  // 9. Error banner
  it('shows error banner when authStore has an error', () => {
    mockAuth.error = 'Credenciales inválidas';

    render(<LoginPage />);

    expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
  });

  // 10. Auth redirect
  it('navigates to / when already authenticated', async () => {
    mockAuth.isAuthenticated = true;

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  // 11. Password toggle shows password
  it('reveals password when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText('Contraseña');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = passwordInput.parentElement!.querySelector('button')!;
    await user.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  // 12. Password toggle hides password (click twice)
  it('hides password when toggle is clicked again', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText('Contraseña');
    const toggleBtn = passwordInput.parentElement!.querySelector('button')!;

    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // 13. Error cleared on unmount
  it('calls setError(null) on unmount', () => {
    mockAuth.error = 'Some error';

    const { unmount } = render(<LoginPage />);
    unmount();

    expect(mockAuth.setError).toHaveBeenCalledWith(null);
  });
});