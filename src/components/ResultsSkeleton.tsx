import React from 'react';

/**
 * Placeholder cards while the first nearby page loads. Decorative only — the
 * live status text is what screen readers hear.
 */
export const ResultsSkeleton: React.FC = () => (
  <div>
    <p className="sr-only" role="status">
      Loading resources…
    </p>
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-64 rounded-2xl border border-border bg-surface p-5 shadow-sm"
        >
          <div className="h-3 w-20 rounded-full bg-card-hover motion-safe:animate-pulse" />
          <div className="mt-3 h-6 w-3/4 rounded-lg bg-card-hover motion-safe:animate-pulse" />
          <div className="mt-3 h-4 w-full rounded bg-card-hover motion-safe:animate-pulse" />
          <div className="mt-2 h-4 w-5/6 rounded bg-card-hover motion-safe:animate-pulse" />
          <div className="mt-6 h-10 w-36 rounded-xl bg-card-hover motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

export default ResultsSkeleton;
