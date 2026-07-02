import { describe, it, expect } from 'vitest';
import { TOAST_DEFAULT_STYLES } from '../toastStyles';

describe('TOAST_DEFAULT_STYLES', () => {
  it('has the expected shape', () => {
    expect(TOAST_DEFAULT_STYLES).toEqual({
      background: '#4b5563',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    });
  });

  it('has correct background color', () => {
    expect(TOAST_DEFAULT_STYLES.background).toBe('#4b5563');
  });

  it('has correct text color', () => {
    expect(TOAST_DEFAULT_STYLES.color).toBe('#fff');
  });

  it('has padding and border radius', () => {
    expect(TOAST_DEFAULT_STYLES.padding).toBe('16px');
    expect(TOAST_DEFAULT_STYLES.borderRadius).toBe('8px');
  });

  it('has only the expected keys', () => {
    expect(Object.keys(TOAST_DEFAULT_STYLES)).toEqual([
      'background',
      'color',
      'padding',
      'borderRadius',
    ]);
  });

  it('is declared with const (compile-time readonly protection via as const)', () => {
    // `as const` provides type-level readonly — not runtime Object.freeze.
    // Verify the values are what we expect.
    expect(TOAST_DEFAULT_STYLES.background).toBe('#4b5563');
    expect(TOAST_DEFAULT_STYLES.color).toBe('#fff');
  });
});
