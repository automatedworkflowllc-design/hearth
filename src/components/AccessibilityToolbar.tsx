import React from 'react';
import type { AccessibilityState, TextSize } from '../types/index';

const SIZES: { id: TextSize; label: string; a11y: string }[] = [
  { id: 'normal', label: 'A', a11y: 'Normal text size' },
  { id: 'large', label: 'A+', a11y: 'Large text size' },
  { id: 'extra-large', label: 'A++', a11y: 'Extra large text size' },
];

/**
 * Text-size controls, wired to the (now live) useAccessibility hook: clicking these writes
 * data-text-size onto <html> (index.css scales rem-based type) and persists it.
 *
 * NOTE: the contrast toggle was intentionally REMOVED after the M3 review. Its only real
 * effect was a global filter(130%) -- components still use hardcoded colors, so it did NOT
 * deliver the 7:1 theme its label implied, and announcing "high contrast" success to a
 * low-vision user over a near-cosmetic change is an overclaim. It returns in M4 once the
 * token swap makes surfaces actually flip. Text size, which genuinely works, ships now.
 */
export const AccessibilityToolbar: React.FC<AccessibilityState> = ({ textSize, setTextSize }) => {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Text size">
      <span className="hidden sm:inline text-xs font-medium text-blue-200">Text size</span>
      <div className="flex items-center gap-0.5">
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
      <span aria-live="polite" className="sr-only">{`Text size ${textSize}`}</span>
    </div>
  );
};

export default AccessibilityToolbar;
