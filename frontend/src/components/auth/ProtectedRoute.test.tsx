import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '../../stores/authStore';
import { createMockAuthStore } from '../../test/mocks/authStoreMock';
import type { MockAuthStore } from '../../test/mocks/authStoreMock';

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('ProtectedRoute', () => {
  let mockAuth: MockAuthStore;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = createMockAuthStore();
    // @ts-expect-error — Zustand overloaded selector needs implicit any
    vi.mocked(useAuthStore).mockImplementation(((selector) => {
      return selector ? selector(mockAuth) : mockAuth;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);
  });

  it('shows loading spinner and "Verificando sesión..." when isLoading', () => {
    mockAuth.isLoading = true;

    render(
      <MemoryRouter>
        <ProtectedRoute />
      </MemoryRouter>,
    );

    expect(screen.getByText('Verificando sesión...')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockAuth.isAuthenticated = false;
    mockAuth.isLoading = false;

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders Outlet when authenticated', () => {
    mockAuth.isAuthenticated = true;
    mockAuth.isLoading = false;

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});