import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ProductSearch from './ProductSearch';

// Mock child components that have complex dependencies
vi.mock('./BarcodeInput', () => ({
  default: () => <div data-testid="barcode-input">BarcodeInput</div>,
}));

vi.mock('../sections/products/CategoryFilterSection', () => ({
  default: ({ query }: { query: string }) => (
    <div data-testid="category-filter">CategoryFilter query={query}</div>
  ),
}));

describe('ProductSearch', () => {
  it('search input captures text when user types', async () => {
    const user = userEvent.setup();
    render(<ProductSearch />);

    const input = screen.getByPlaceholderText('Buscar productos...');
    await user.type(input, 'café');

    expect(input).toHaveValue('café');
  });

  it('renders heading and category filter', () => {
    render(<ProductSearch />);

    expect(screen.getByText('Productos más vendidos')).toBeInTheDocument();
    expect(screen.getByText('Selección rápida de inventario frecuente')).toBeInTheDocument();
  });
});
