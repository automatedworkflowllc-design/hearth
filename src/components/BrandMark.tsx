import React from 'react';

interface BrandMarkProps {
  className?: string;
  title?: string;
}

/**
 * Hearth brand mark: "the Ember" -- a warm flame with a heart glowing at its core.
 * "hear-t-h = heart + warmth." Renders its own gradient (NOT currentColor-tinted, unlike
 * the previous pin+heart mark) so it reads correctly on any background without relying on
 * text-color context. Mirrored exactly in public/favicon.svg.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({ className, title = 'Hearth' }) => (
  <svg viewBox="0 0 64 64" role="img" aria-label={title} className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="hearth-ember" cx="50%" cy="38%" r="65%">
        <stop offset="0" stopColor="#f7c25a" />
        <stop offset="0.6" stopColor="#ee6c4d" />
        <stop offset="1" stopColor="#c9472f" />
      </radialGradient>
    </defs>
    <path
      d="M32 7c1 8 6 12 10 17 4 5 5 9 5 13a15 15 0 0 1-30 0c0-5 2-8 5-11 0 3 1 5 3 6 3-9-1-14 7-25Z"
      fill="url(#hearth-ember)"
    />
    <path
      d="M32 44c-3.7-2.6-6-4.9-6-7.4a3.1 3.1 0 0 1 6-1 3.1 3.1 0 0 1 6 1c0 2.5-2.3 4.8-6 7.4Z"
      fill="#ffffff"
    />
  </svg>
);

export default BrandMark;
