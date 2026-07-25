import React from 'react';
import { Search, ShieldCheck } from 'lucide-react';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

/** Shared so the navbar's "Search Resources" button can move focus here. */
export const SEARCH_INPUT_ID = 'hearth-search';

/**
 * The single page hero (replaces the old duplicate Header.tsx banner + in-App hero div).
 * Owns the real, controlled search input -- FilterPanel no longer duplicates it. The amber
 * "hearth glow" is decorative (aria-hidden, suppressed in high-contrast via index.css).
 */
export const Hero: React.FC<HeroProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-app px-5 py-10 sm:px-8 sm:py-14">
      <div
        aria-hidden="true"
        className="hearth-glow absolute -top-24 -right-16 h-80 w-80 rounded-full opacity-70 blur-2xl"
        style={{ background: 'radial-gradient(circle at center, rgba(242,169,59,0.55), rgba(238,108,77,0.28) 42%, transparent 68%)' }}
      />
      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card-hover px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-primary">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Free · private · no account
        </span>

        <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-main sm:text-5xl">
          Everyone deserves a <span className="text-primary">warm place</span> to turn.
        </h1>

        <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
          Find food, a safe place to stay, health care, and legal help from real, recently-verified
          organizations near you.{' '}
          <span className="font-serif italic text-brand">You belong here.</span>
        </p>

        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm sm:max-w-lg"
        >
          {/* The ring lives on the wrapper (focus-within) because the input itself is chrome-less
              inside this pill -- without it the primary search field had no visible focus at all. */}
          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl bg-app px-3.5 py-2.5 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[color:var(--focus-ring-color)]">
            <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <input
              id={SEARCH_INPUT_ID}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="What do you need? (food, a bed tonight…)"
              aria-label="Search resources"
              className="w-full bg-transparent text-sm font-medium text-main placeholder:text-muted focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-2.5 font-display text-sm font-bold text-inverse transition-colors hover:bg-primary-hover"
          >
            Find help →
          </button>
        </form>
      </div>
    </section>
  );
};

export default Hero;
