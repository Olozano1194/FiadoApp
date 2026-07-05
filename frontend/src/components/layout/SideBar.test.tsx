import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SideBar from './SideBar';
import { useStoreConfig } from '../../stores/storeConfigStore';
import { createMockStoreConfigStore } from '../../test/mocks/storeConfigStoreMock';
import type { MockStoreConfigState } from '../../test/mocks/storeConfigStoreMock';

vi.mock('../../stores/storeConfigStore', () => ({
  useStoreConfig: vi.fn(),
}));

describe('SideBar', () => {
  let mockConfig: MockStoreConfigState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig = createMockStoreConfigStore();
    // @ts-expect-error — Zustand overloaded selector needs implicit any
    vi.mocked(useStoreConfig).mockImplementation(((selector) => {
      return selector ? selector(mockConfig) : mockConfig;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);
  });

  // Helper to render with a specific route
  const renderAtRoute = (route: string) =>
    render(
      <MemoryRouter initialEntries={[route]}>
        <SideBar />
      </MemoryRouter>,
    );

  it('renders all 7 nav links', () => {
    renderAtRoute('/');

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('Clientes/Fiados')).toBeInTheDocument();
    expect(screen.getByText('Venta Rápida')).toBeInTheDocument();
    expect(screen.getByText('Reportes')).toBeInTheDocument();
    expect(screen.getByText('Cerrar Turno')).toBeInTheDocument();
    expect(screen.getByText('Ajustes')).toBeInTheDocument();
  });

  it('renders Inicio link with href="/"', () => {
    renderAtRoute('/');
    const link = screen.getByText('Inicio').closest('a');
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders Inventario link with href="/inventario"', () => {
    renderAtRoute('/');
    const link = screen.getByText('Inventario').closest('a');
    expect(link).toHaveAttribute('href', '/inventario');
  });

  it('renders Clientes/Fiados link with href="/clientes"', () => {
    renderAtRoute('/');
    const link = screen.getByText('Clientes/Fiados').closest('a');
    expect(link).toHaveAttribute('href', '/clientes');
  });

  it('renders Venta Rápida link with href="/ventas"', () => {
    renderAtRoute('/');
    const link = screen.getByText('Venta Rápida').closest('a');
    expect(link).toHaveAttribute('href', '/ventas');
  });

  it('renders Reportes link with href="/reportes"', () => {
    renderAtRoute('/');
    const link = screen.getByText('Reportes').closest('a');
    expect(link).toHaveAttribute('href', '/reportes');
  });

  it('renders Cerrar Turno link with href="/cierre"', () => {
    renderAtRoute('/');
    const link = screen.getByText('Cerrar Turno').closest('a');
    expect(link).toHaveAttribute('href', '/cierre');
  });

  it('renders Ajustes link with href="/ajustes"', () => {
    renderAtRoute('/');
    const link = screen.getByText('Ajustes').closest('a');
    expect(link).toHaveAttribute('href', '/ajustes');
  });

  it('highlights active link with bg-surface-container-high class on /inventario', () => {
    renderAtRoute('/inventario');
    const link = screen.getByText('Inventario').closest('a');
    expect(link).toHaveClass('bg-surface-container-high');
  });

  it('does not apply active class to non-active links', () => {
    renderAtRoute('/inventario');
    // Inicio should NOT have the active class when we're on /inventario
    const inicioLink = screen.getByText('Inicio').closest('a');
    expect(inicioLink).not.toHaveClass('bg-surface-container-high');
  });

  it('shows store name from config', () => {
    mockConfig.config = { store_name: 'Mi Tienda' };
    renderAtRoute('/');

    expect(screen.getByText('Mi Tienda')).toBeInTheDocument();
  });

  it('shows "La Tiendita" fallback when config is null', () => {
    // mockConfig.config is already null by default
    renderAtRoute('/');

    expect(screen.getByText('La Tiendita')).toBeInTheDocument();
  });

  it('shows subtitle "Gestión de Negocio"', () => {
    renderAtRoute('/');

    expect(screen.getByText('Gestión de Negocio')).toBeInTheDocument();
  });

  it('calls fetchConfig on mount', () => {
    renderAtRoute('/');

    expect(mockConfig.fetchConfig).toHaveBeenCalled();
  });
});
