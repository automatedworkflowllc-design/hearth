import React from 'react';
import type { Resource } from '../types/index';
import { MapPin, Phone, Clock, ExternalLink, Info } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onSelect: (resource: Resource) => void;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  food: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  shelter: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  health: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  legal: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  support: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onSelect }) => {
  const categoryStyle = categoryColors[resource.category.toLowerCase()] || {
    bg: 'bg-app',
    text: 'text-main',
    border: 'border-border',
  };

  const hoursDisplay = typeof resource.hours === 'string'
    ? resource.hours
    : resource.hours.map(h => `${h.day}: ${h.closed ? 'Closed' : `${h.open}-${h.close}`}`).join(', ');

  return (
    <div className="bg-surface rounded-xl shadow-sm hover:shadow-md border border-border p-5 transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}>
            {resource.category}
          </span>
          <div className="flex items-center gap-1.5">
            {typeof resource.distanceMiles === 'number' && (
              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                {resource.distanceMiles.toFixed(1)} mi
              </span>
            )}
            {resource.availability && (
              // Static service descriptor (e.g. "By appointment"), not a live/open-now claim.
              <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 bg-card-hover text-main rounded-md">
                {resource.availability}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-main hover:text-primary transition-colors mb-2">
          {resource.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted line-clamp-2 mb-4">
          {resource.description}
        </p>

        {/* Key Attributes */}
        <div className="space-y-2 text-xs text-muted mb-4">
          {resource.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted shrink-0 mt-0.5" />
              <span>{resource.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted shrink-0" />
            <span>{hoursDisplay}</span>
          </div>
          {resource.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted shrink-0" />
              <a href={`tel:${resource.phone}`} className="hover:underline text-primary font-medium">
                {resource.phone}
              </a>
            </div>
          )}
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {resource.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-xs bg-card-hover text-muted px-2 py-0.5 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
        <button
          onClick={() => onSelect(resource)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          View Full Details
        </button>
        {resource.website && (
          <a
            href={resource.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-main"
          >
            Website <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
