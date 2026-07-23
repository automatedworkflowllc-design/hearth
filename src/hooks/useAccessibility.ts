import { useState, useCallback } from 'react';
import type { ContrastMode, TextSize, AccessibilityState } from '../types/index.ts';

export function useAccessibility(
  initialContrast: ContrastMode = 'standard',
  initialTextSize: TextSize = 'normal'
): AccessibilityState {
  const [contrastMode, setContrastMode] = useState<ContrastMode>(initialContrast);
  const [textSize, setTextSizeState] = useState<TextSize>(initialTextSize);

  const toggleContrast = useCallback(() => {
    setContrastMode(prev => (prev === 'standard' ? 'high-contrast' : 'standard'));
  }, []);

  const setTextSize = useCallback((size: TextSize) => {
    setTextSizeState(size);
  }, []);

  return {
    contrastMode,
    textSize,
    toggleContrast,
    setTextSize,
  };
}

/**
 * Pure class state controller for testing accessibility state outside React hook context
 */
export class AccessibilityController implements AccessibilityState {
  contrastMode: ContrastMode;
  textSize: TextSize;

  constructor(initialContrast: ContrastMode = 'standard', initialTextSize: TextSize = 'normal') {
    this.contrastMode = initialContrast;
    this.textSize = initialTextSize;
  }

  toggleContrast(): void {
    this.contrastMode = this.contrastMode === 'standard' ? 'high-contrast' : 'standard';
  }

  setTextSize(size: TextSize): void {
    this.textSize = size;
  }
}
