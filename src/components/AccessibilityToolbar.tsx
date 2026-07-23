import React from 'react';
import { Contrast } from 'lucide-react';
import type { AccessibilityState, TextSize } from '../types/index';

const SIZES: { id: TextSize; label: string; a11y: string }[] = [
  { id: 'normal', label: 'A', a11y: 'Normal text size' },
  { id: 'large', label: 'A+', a11y: 'Large text size' },
  { id: 'extra-large', label: 'A++', a11y: 'Extra large text size' },
];

/**
 * Contrast + text-size controls, wired to the (now live) useAccessibility hook. Styled for
 * the dark navbar. Uses aria-pressed so screen readers announce the active state; text-size
 * changes are announced via the aria-live region.
 */
export const AccessibilityToolbar: React.FC<AccessibilityState> = ({
  contrastMode,
  textSize,
  toggleContrast,
  setTextSize,
}) => {
  const highContrast = contrastMode === 'high-contrast';
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Accessibility settings">
      <button
        type="button"
        onClick={toggleContrast}
        aria-pressed={highContrast}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-white ${
          highContrast ? 'bg-white text-brand-900' : 'bg-brand-800 text-white hover:bg-brand-700'
        }`}
      >
        <Contrast className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">High contrast</span>
      </button>

      <div className="flex items-center gap-0.5" role="group" aria-label="Text size">
        {SIZES.map((s) => {
          const active = textSize === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setTextSize(s.id)}
              aria-pressed={active}
              aria-label={s.a11y}
              className={`min-w-[2rem] rounded-md px-2 py-1.5 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-white ${
                active ? 'bg-white text-brand-900' : 'bg-brand-800 text-white hover:bg-brand-700'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <span aria-live="polite" className="sr-only">
        {`Contrast ${highContrast ? 'high' : 'standard'}, text size ${textSize}`}
      </span>
    </div>
  );
};

export default AccessibilityToolbar;
