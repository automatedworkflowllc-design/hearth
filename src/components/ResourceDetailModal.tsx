import React from 'react';
import type { Resource } from '../types/index';
import { X, MapPin, Phone, Mail, Globe, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface ResourceDetailModalProps {
  resource: Resource | null;
  onClose: () => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({ resource, onClose }) => {
  if (!resource) return null;

  const hoursDisplay = typeof resource.hours === 'string'
    ? resource.hours
    : resource.hours.map(h => `${h.day}: ${h.closed ? 'Closed' : `${h.open}-${h.close}`}`).join('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            {resource.category}
          </span>
          {resource.availability && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {resource.availability}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-extrabold text-slate-900 mb-3">{resource.name}</h2>

        {/* Description */}
        <p className="text-sm text-slate-700 leading-relaxed mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
          {resource.description}
        </p>

        {/* Info Grid */}
        <div className="space-y-4 text-sm text-slate-700 mb-6">
          {resource.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-semibold">Address</strong>
                <span>{resource.address}</span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-semibold">Hours of Operation</strong>
              <pre className="font-sans whitespace-pre-wrap text-slate-600 text-xs mt-0.5">{hoursDisplay}</pre>
            </div>
          </div>

          {resource.eligibility && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-semibold">Eligibility Requirements</strong>
                <span className="text-slate-600">{resource.eligibility}</span>
              </div>
            </div>
          )}

          {/* Contact Section */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resource.phone && (
              <a
                href={`tel:${resource.phone}`}
                className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>{resource.phone}</span>
              </a>
            )}
            {resource.email && (
              <a
                href={`mailto:${resource.email}`}
                className="flex items-center gap-2 p-3 bg-slate-50 text-slate-700 rounded-xl font-medium hover:bg-slate-100 transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">{resource.email}</span>
              </a>
            )}
          </div>

          {resource.website && (
            <a
              href={resource.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors mt-2"
            >
              <Globe className="w-4 h-4" />
              Visit Official Website
            </a>
          )}
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
            {resource.tags.map(tag => (
              <span key={tag} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
