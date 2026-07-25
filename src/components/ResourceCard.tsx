import React from 'react';
import type { Resource } from '../types/index';
import { MapPin, Phone, Clock, ExternalLink } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onSelect: (resource: Resource) => void;
}

// Category colors are token-backed so they flip with the theme. They used to be hardcoded hexes
// chosen against the WHITE card -- which a sweep caught: on the BLACK high-contrast card the plum
// was 1.91:1, i.e. the label all but disappeared in the mode built for low vision. The tokens keep
// the warm hues in the standard theme and go white in high-contrast (21:1); the category is always
// ALSO conveyed as text, so color is never the sole signal either way.
const categoryColors: Record<string, string> = {
  food: 'text-cat-food',        // warm brown (not green: green is reserved for status)
  shelter: 'text-cat-shelter',  // coral
  health: 'text-cat-health',    // plum
  legal: 'text-cat-legal',
  support: 'text-cat-support',  // dark sage
};

/** Distance shown at ZIP/city precision is an estimate, so present it as one. */
function approxDistance(miles: number): string {
  if (miles < 1) return 'under 1 mi';
  return `~${Math.round(miles)} mi`;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onSelect }) => {
  const categoryClass = categoryColors[resource.category.toLowerCase()] ?? 'text-main';

  const hoursDisplay = typeof resource.hours === 'string'
    ? resource.hours
    : resource.hours.map(h => `${h.day}: ${h.closed ? 'Closed' : `${h.open}-${h.close}`}`).join(', ');

  return (
    <div className="bg-surface rounded-2xl shadow-sm hover:shadow-md border border-border p-5 transition-all duration-200 flex flex-col h-full">
      <span className={`font-display text-xs font-extrabold uppercase tracking-wider ${categoryClass}`}>
        {resource.category}
      </span>

      <h3 className="mt-1.5 font-display text-lg font-bold text-main">
        {resource.name}
      </h3>

      <p className="mt-1.5 text-sm text-muted line-clamp-2">
        {resource.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {typeof resource.distanceMiles === 'number' && (
          <span className="rounded-full bg-card-hover px-2.5 py-1 text-xs font-bold text-main">
            {approxDistance(resource.distanceMiles)}
          </span>
        )}
        {resource.availability && (
          // Static service descriptor (e.g. "By appointment"), not a live/open-now claim.
          <span className="rounded-full bg-card-hover px-2.5 py-1 text-xs font-bold text-main">
            {resource.availability}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2 text-xs text-muted">
        {resource.address && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted shrink-0 mt-0.5" aria-hidden="true" />
            <span>{resource.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
          <span>{hoursDisplay}</span>
        </div>
        {resource.lastVerified && (
          <p className="text-xs text-muted">Verified {resource.lastVerified}</p>
        )}
      </div>

      {/* Next step: one clear primary ("what to expect" reduces the fear of walking in cold),
          with the phone as a real tel: link beside it -- never a bare number with no action. */}
      <div className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-border">
        <button
          onClick={() => onSelect(resource)}
          className="rounded-xl bg-primary px-3.5 py-2 font-display text-xs font-bold text-inverse transition-colors hover:bg-primary-hover"
        >
          What to expect →
        </button>
        {resource.phone ? (
          <a
            href={`tel:${resource.phone}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            Call now
          </a>
        ) : resource.website ? (
          <a
            href={resource.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            Website <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </div>
  );
};
