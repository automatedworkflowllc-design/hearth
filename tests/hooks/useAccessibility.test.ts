import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAccessibility } from '../../src/hooks/useAccessibility';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-text-size');
  document.documentElement.removeAttribute('data-contrast');
});

describe('useAccessibility persistence', () => {
  it('applies the chosen text size to <html> and persists it', () => {
    const { result } = renderHook(() => useAccessibility());
    act(() => result.current.setTextSize('extra-large'));
    expect(document.documentElement.dataset.textSize).toBe('extra-large');
    expect(JSON.parse(localStorage.getItem('crh-accessibility')!).textSize).toBe('extra-large');
  });

  it('restores a saved preference on mount', () => {
    localStorage.setItem('crh-accessibility', JSON.stringify({ contrast: 'standard', textSize: 'large' }));
    const { result } = renderHook(() => useAccessibility());
    expect(result.current.textSize).toBe('large');
  });

  it('falls back to defaults on corrupt storage', () => {
    localStorage.setItem('crh-accessibility', '{not valid json');
    const { result } = renderHook(() => useAccessibility());
    expect(result.current.textSize).toBe('normal');
    expect(result.current.contrastMode).toBe('standard');
  });
});
