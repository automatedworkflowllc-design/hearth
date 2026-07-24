import React, { useEffect, useId, useRef } from 'react';
import type { Resource } from '../types/index';
import { X, MapPin, Phone, Mail, Globe, Clock, CheckCircle2 } from 'lucide-react';

interface ResourceDetailModalProps {
  resource: Resource | null;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({ resource, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Accessible dialog behavior. Hooks run unconditionally (before the early return) so
  // React's hook order is stable whether or not a resource is open.
  useEffect(() => {
    if (!resource) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // scroll-lock the page behind the dialog

    // Move focus onto the first real focusable inside the dialog (not the tabIndex=-1 panel):
    // focusing the panel let Shift+Tab escape the trap, since the panel is not in the cycle.
    const initial = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    (initial && initial.length ? initial[0] : panelRef.current)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.(); // return focus to whatever opened the dialog
    };
  }, [resource, onClose]);

  if (!resource) return null;

  const hoursDisplay =
    typeof resource.hours === 'string'
      ? resource.hours
      : resource.hours.map((h) => `${h.day}: ${h.closed ? 'Closed' : `${h.open}-${h.close}`}`).join('\n');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose(); // click on the backdrop closes
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-surface rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-border p-6 relative focus:outline-none"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-muted p-1.5 rounded-full hover:bg-card-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/30">
            {resource.category}
          </span>
          {resource.availability && (
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 bg-card-hover text-main rounded-full">
              {resource.availability}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 id={titleId} className="text-2xl font-extrabold text-main mb-3">
          {resource.name}
        </h2>

        {/* Description */}
        <p className="text-sm text-main leading-relaxed mb-6 bg-app p-4 rounded-xl border border-border">
          {resource.description}
        </p>

        {/* Info Grid */}
        <div className="space-y-4 text-sm text-main mb-6">
          {resource.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="block text-main font-semibold">Address</strong>
                <span>{resource.address}</span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="block text-main font-semibold">Hours of Operation</strong>
              <pre className="font-sans whitespace-pre-wrap text-muted text-xs mt-0.5">{hoursDisplay}</pre>
            </div>
          </div>

          {resource.eligibility && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="block text-main font-semibold">Eligibility</strong>
                <span className="text-muted">{resource.eligibility}</span>
              </div>
            </div>
          )}

          {resource.lastVerified && (
            <p className="text-xs text-muted">Details last verified {resource.lastVerified}.</p>
          )}

          {/* Contact Section */}
          <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resource.phone && (
              <a
                href={`tel:${resource.phone}`}
                className="flex items-center gap-2 p-3 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{resource.phone}</span>
              </a>
            )}
            {resource.email && (
              <a
                href={`mailto:${resource.email}`}
                className="flex items-center gap-2 p-3 bg-app text-main rounded-xl font-medium hover:bg-card-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{resource.email}</span>
              </a>
            )}
          </div>

          {resource.website && (
            <a
              href={resource.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-colors mt-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Globe className="w-4 h-4" aria-hidden="true" />
              Visit Official Website
            </a>
          )}
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
            {resource.tags.map((tag) => (
              <span key={tag} className="text-xs bg-card-hover text-main px-2.5 py-1 rounded-md font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceDetailModal;
