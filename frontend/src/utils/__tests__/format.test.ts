import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../format';

describe('formatCurrency', () => {
  it('formats a number as COP currency', () => {
    const result = formatCurrency(15000);
    expect(result).toContain('15');
    expect(result).toContain('000');
  });

  it('handles string input', () => {
    const result = formatCurrency('2500');
    expect(result).toContain('2');
    expect(result).toContain('500');
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('handles decimal values by rounding down (no fraction digits)', () => {
    const result = formatCurrency(2500.75);
    expect(result).not.toContain(',');
  });

  it('handles negative numbers', () => {
    const result = formatCurrency(-5000);
    expect(result).toContain('-');
  });

  it('handles large numbers', () => {
    const result = formatCurrency(999999999);
    expect(result).toContain('999');
  });

  it('handles NaN gracefully', () => {
    const result = formatCurrency(NaN);
    // Intl.NumberFormat formats NaN as "NaN" — just verify it doesn't throw
    expect(typeof result).toBe('string');
  });

  it('handles string with decimal', () => {
    const result = formatCurrency('5000.99');
    expect(result).toContain('5');
  });

  it('handles very small numbers', () => {
    const result = formatCurrency(1);
    expect(result).toContain('1');
  });
});
