import React from 'react';

interface BrandMarkProps {
  className?: string;
  title?: string;
}

/**
 * Hearth brand mark: a map pin (place) with a heart (care) -- a resource-finder for people
 * who need help, in one glyph that reads at 16px. The pin is `currentColor` so it inherits
 * the brand teal from context; the heart is a light cut-out. Mirrored exactly in
 * public/favicon.svg (which also fixes the previously-404'd favicon).
 */
export const BrandMark: React.FC<BrandMarkProps> = ({ className, title = 'Hearth' }) => (
  <svg viewBox="0 0 32 32" role="img" aria-label={title} className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 3C10.48 3 6 7.48 6 13c0 7.5 10 16 10 16s10-8.5 10-16C26 7.48 21.52 3 16 3z"
      fill="currentColor"
    />
    <path
      transform="translate(9.3 5.6) scale(0.56)"
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="#f8fafc"
    />
  </svg>
);

export default BrandMark;
