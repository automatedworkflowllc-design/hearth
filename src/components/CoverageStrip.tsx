import React from 'react';
import { Phone, CheckCircle2 } from 'lucide-react';

interface CoverageStripProps {
  nationalDirectory: boolean;
}

const SEARCHABLE = [
  'Food pantries & kitchens',
  "Kids' summer meals",
  'Medical care',
  'Mental health',
  'Substance-use help',
  'Detox',
];

/**
 * Honest coverage, scannable at a glance. National search is real for the listed
 * needs; shelter, housing, and legal aid are still a 211 referral — never implied.
 */
export const CoverageStrip: React.FC<CoverageStripProps> = ({ nationalDirectory }) => {
  if (!nationalDirectory) {
    return (
      <div role="alert" className="rounded-2xl border-l-4 border-accent bg-card-hover px-4 py-3 text-sm text-main">
        <strong>Local demonstration directory.</strong> These are real, recently-reviewed Gainesville, FL
        resources shown while the national data connection is being completed. The interface is national-ready,
        but this build must not imply coverage it does not yet have. For current help, call{' '}
        <a className="font-semibold underline" href="tel:211">211</a> (community services) or{' '}
        <a className="font-semibold underline" href="tel:988">988</a> (crisis &amp; suicide lifeline).
      </div>
    );
  }

  return (
    <section
      id="directory-coverage"
      aria-labelledby="coverage-heading"
      className="grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5 md:grid-cols-2"
    >
      <div>
        <h2 id="coverage-heading" className="font-display text-sm font-extrabold text-main">
          What Hearth can search
        </h2>
        <p className="mt-1 text-xs text-muted">
          National food, medical, and behavioral-health directories. Confirm details before traveling.
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {SEARCHABLE.map((label) => (
            <li
              key={label}
              className="inline-flex items-center gap-1 rounded-full bg-card-hover px-2.5 py-1 text-xs font-bold text-main"
            >
              <CheckCircle2 className="h-3 w-3 text-primary" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl bg-card-hover p-4">
        <p className="font-display text-sm font-extrabold text-main">Not in this directory yet</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Shelter, housing, legal aid, and other local help still need a live referral.
          Hearth will not invent those listings.
        </p>
        <a
          href="tel:211"
          className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 font-display text-sm font-bold text-inverse hover:bg-primary-hover"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call 211 for shelter, housing, or legal help
        </a>
      </div>
    </section>
  );
};

export default CoverageStrip;
