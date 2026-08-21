import React from 'react';
import { MapPin, Search, Phone } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'Choose a need',
    body: 'Search or pick food, medical care, or behavioral-health support.',
  },
  {
    icon: MapPin,
    title: 'Enter a ZIP',
    body: 'Use a ZIP code or opt into device location. Hearth does not store it.',
  },
  {
    icon: Phone,
    title: 'Call before you go',
    body: 'Listings can change. Confirm hours, eligibility, and intake first.',
  },
];

export const HowItWorks: React.FC = () => (
  <section aria-labelledby="how-hearth-works" className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
    <h2 id="how-hearth-works" className="font-display text-sm font-extrabold text-main">
      How Hearth works
    </h2>
    <ol className="mt-4 grid gap-3 sm:grid-cols-3">
      {STEPS.map(({ icon: Icon, title, body }, index) => (
        <li key={title} className="flex gap-3 rounded-xl bg-card-hover p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface font-display text-sm font-extrabold text-primary">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-display text-sm font-bold text-main">
              <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
          </div>
        </li>
      ))}
    </ol>
  </section>
);

export default HowItWorks;
