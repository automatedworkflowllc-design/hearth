import React from 'react';
import { Contrast } from 'lucide-react';
import type { AccessibilityState, TextSize } from '../types/index';

const SIZES: { id: TextSize; label: string; a11y: string }[] = [
  { id: 'normal', label: 'A', a11y: 'Normal text size' },
  { id: 'large', label: 'A+', a11y: 'Large text size' },
  { id: 'extra-large', label: 'A++', a11y: 'Extra large text size' },
];

// Shared button skin. Uses on-nav / nav tokens (not bg-surface) so the ACTIVE state stays
// legible in high-contrast: once the nav turns black, a bg-surface active button would be
// black-on-black. bg-on-nav (white in both themes) + text-nav keeps contrast either way.
const btn = (active: boolean) =>
  `min-w-[2rem] rounded-md px-2 py-1.5 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-white ${
    active ? 'bg-on-nav text-nav' : 'bg-nav-hover text-on-nav hover:bg-nav-hover'
  }`;

/**
 * Accessibility controls in the navbar, wired to the live useAccessibility hook (which writes
 * data-contrast / data-text-size onto <html> and persists them to localStorage).
 *
 * The high-contrast toggle is back as of M4b. It was pulled in the M3 review because at that
 * point NO component consumed the contrast tokens, so toggling only ran a weak filter(130%) --
 * announcing "high contrast" over a near-cosmetic change is an overclaim. Now the token-driven
 * surfaces (backgrounds, text, borders, nav, buttons, banners, error text, map popup) flip to
 * the ~7:1 black/yellow/cyan theme. A few elements keep fixed colors by design -- the color-coded
 * category badges (AA-legible in both themes) and small decorative icons -- so this is real,
 * honestly-scoped contrast, not the "everything flips" the earlier wording implied.
 */
export const AccessibilityToolbar: React.FC<AccessibilityState> = ({
  contrastMode,
  textSize,
  toggleContrast,
  setTextSize,
}) => {
  const highContrast = contrastMode === 'high-contrast';
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggleContrast}
        aria-pressed={highContrast}
        aria-label="High contrast"
        className={`inline-flex items-center gap-1.5 ${btn(highContrast)}`}
      >
        <Contrast className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Contrast</span>
      </button>

      <div className="flex items-center gap-1.5" role="group" aria-label="Text size">
        <span className="hidden sm:inline text-xs font-medium text-on-nav/80">Text size</span>
        <div className="flex items-center gap-0.5">
          {SIZES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setTextSize(s.id)}
              aria-pressed={textSize === s.id}
              aria-label={s.a11y}
              className={btn(textSize === s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <span aria-live="polite" className="sr-only">
        {`Contrast ${highContrast ? 'high' : 'standard'}, text size ${textSize}`}
      </span>
    </div>
  );
};

export default AccessibilityToolbar;
