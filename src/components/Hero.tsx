import React from 'react';
import {
  Activity,
  ArrowRight,
  BedDouble,
  Brain,
  HeartPulse,
  Pill,
  Scale,
  Search,
  ShieldCheck,
  Utensils,
} from 'lucide-react';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  onCategorySelect: (category: string) => void;
  nationalDirectory?: boolean;
}

/** Shared so the navbar's "Search Resources" button can move focus here. */
export const SEARCH_INPUT_ID = 'hearth-search';

const quickNeeds = [
  { category: 'food', label: 'Food today', icon: Utensils },
  { category: 'shelter', label: 'A safe place', icon: BedDouble },
  { category: 'health', label: 'Health care', icon: HeartPulse },
  { category: 'legal', label: 'Legal help', icon: Scale },
];

const nationalQuickNeeds = [
  { category: 'food-assistance', label: 'Food today', icon: Utensils },
  { category: 'summer-meals', label: "Kids' summer meals", icon: Utensils },
  { category: 'medical-care', label: 'Medical care', icon: HeartPulse },
  { category: 'mental-health', label: 'Mental health', icon: Brain },
  { category: 'substance-use', label: 'Substance-use help', icon: Pill },
  { category: 'detox', label: 'Detox support', icon: Activity },
];

/**
 * Search-first hero with quick paths for people who do not know what to type.
 * The amber glow is decorative and suppressed in high-contrast mode.
 */
export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onCategorySelect,
  nationalDirectory = false,
}) => {
  const displayedQuickNeeds = nationalDirectory ? nationalQuickNeeds : quickNeeds;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-app px-5 py-8 sm:px-8 sm:py-12 lg:px-10">
      <div
        aria-hidden="true"
        className="hearth-glow absolute -top-24 -right-16 h-80 w-80 rounded-full opacity-70 blur-2xl"
        style={{ background: 'radial-gradient(circle at center, rgba(242,169,59,0.55), rgba(238,108,77,0.28) 42%, transparent 68%)' }}
      />

      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)] lg:gap-12">
        <div className="min-w-0 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card-hover px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-primary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Free to search · no account · no tracking
          </span>

          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-main sm:text-5xl">
            Everyone deserves a <span className="text-primary">warm place</span> to turn.
          </h1>

          <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
            {nationalDirectory
              ? 'Find food pantries, community meals, free summer meals for kids, medical care, mental-health support, substance-use treatment, and detox services from national directories.'
              : 'Find food, a safe place to stay, health care, and legal help from real, recently-reviewed organizations near you.'}{' '}
            <span className="font-serif italic text-brand">You belong here.</span>
          </p>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
            className="mt-6 flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm sm:max-w-lg sm:flex-row"
          >
            <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-app px-3.5 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[color:var(--focus-ring-color)]">
              <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <input
                id={SEARCH_INPUT_ID}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={
                  nationalDirectory
                    ? 'Try food pantry, therapy, dental care, detox…'
                    : 'What do you need? (food, a bed tonight…)'
                }
                aria-label="Search resources"
                className="min-h-11 min-w-0 w-full bg-transparent text-sm font-medium text-main placeholder:text-muted focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 font-display text-sm font-bold text-inverse transition-colors hover:bg-primary-hover"
            >
              Find help <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>

        <aside
          className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"
          aria-labelledby="quick-needs-title"
        >
          <p id="quick-needs-title" className="font-display text-sm font-extrabold text-main">
            What do you need right now?
          </p>
          <p className="mt-1 text-xs text-muted">
            {nationalDirectory
              ? 'Choose a need, then enter your location to see relevant services.'
              : 'Choose a starting point. You can change it anytime.'}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {displayedQuickNeeds.map(({ category, label, icon: Icon }) => (
              <button
                key={category}
                type="button"
                onClick={() => onCategorySelect(category)}
                className="group flex min-h-11 items-center gap-3 rounded-xl border border-border bg-app px-3.5 py-2.5 text-left font-display text-sm font-bold text-main transition-colors hover:bg-card-hover"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card-hover text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex-1">{label}</span>
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            ))}
          </div>
          {nationalDirectory && (
            <a
              href="tel:211"
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-app px-3.5 py-2.5 font-display text-sm font-bold text-primary hover:bg-card-hover"
            >
              Need a warm bed, housing, or legal help? Call 211
            </a>
          )}
        </aside>
      </div>
    </section>
  );
};

export default Hero;
