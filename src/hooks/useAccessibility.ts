import { useState, useCallback, useEffect } from 'react';
import type { ContrastMode, TextSize, AccessibilityState } from '../types/index.ts';

const STORAGE_KEY = 'crh-accessibility';
const TEXT_SIZES: TextSize[] = ['normal', 'large', 'extra-large'];

function loadInitial(): { contrast: ContrastMode; textSize: TextSize } {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        contrast: p.contrast === 'high-contrast' ? 'high-contrast' : 'standard',
        textSize: TEXT_SIZES.includes(p.textSize) ? p.textSize : 'normal',
      };
    }
  } catch {
    /* corrupt/unavailable storage -> defaults */
  }
  return { contrast: 'standard', textSize: 'normal' };
}

/**
 * Accessibility preferences (contrast + text size), applied to <html> and persisted.
 *
 * Before M3 this hook existed but was wired to NOTHING (audit finding: dead code). It now
 * writes `data-contrast` / `data-text-size` onto document.documentElement -- which is what
 * the rules in index.css key on -- so the toolbar controls actually change the page, and
 * the choice survives a reload via localStorage.
 */
export function useAccessibility(): AccessibilityState {
  const [initial] = useState(loadInitial);
  const [contrastMode, setContrastMode] = useState<ContrastMode>(initial.contrast);
  const [textSize, setTextSizeState] = useState<TextSize>(initial.textSize);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = contrastMode;
    root.dataset.textSize = textSize;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ contrast: contrastMode, textSize }));
    } catch {
      /* storage unavailable (private mode) -- the in-page effect still applies */
    }
  }, [contrastMode, textSize]);

  const toggleContrast = useCallback(() => {
    setContrastMode((prev) => (prev === 'standard' ? 'high-contrast' : 'standard'));
  }, []);

  const setTextSize = useCallback((size: TextSize) => setTextSizeState(size), []);

  return { contrastMode, textSize, toggleContrast, setTextSize };
}
