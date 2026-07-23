import React from 'react';
import type { Resource } from '../types/index';
import { MapPin, Phone, Clock, ExternalLink, Info } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onSelect: (resource: Resource) => void;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  food: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  shelter: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  health: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  legal: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  support: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onSelect }) => {
  const categoryStyle = categoryColors[resource.category.toLowerCase()] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const hoursDisplay = typeof resource.hours === 'string'
    ? resource.hours
    : resource.hours.map(h => `${h.day}: ${h.closed ? 'Closed' : `${h.open}-${h.close}`}`).join(', ');

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 p-5 transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}>
            {resource.category}
          </span>
          <div className="flex items-center gap-1.5">
            {typeof resource.distanceMiles === 'number' && (
              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                {resource.distanceMiles.toFixed(1)} mi
              </span>
            )}
            {resource.availability && (
              // Static service descriptor (e.g. "By appointment"), not a live/open-now claim.
              <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                {resource.availability}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors mb-2">
          {resource.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-4">
          {resource.description}
        </p>

        {/* Key Attributes */}
        <div className="space-y-2 text-xs text-slate-600 mb-4">
          {resource.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{resource.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{hoursDisplay}</span>
          </div>
          {resource.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <a href={`tel:${resource.phone}`} className="hover:underline text-blue-600 font-medium">
                {resource.phone}
              </a>
            </div>
          )}
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {resource.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onSelect(resource)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          View Full Details
        </button>
        {resource.website && (
          <a
            href={resource.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            Website <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
