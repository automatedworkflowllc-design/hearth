import React, { useEffect, useId, useRef } from 'react';
import type { ContactMethod, Resource } from '../types/index';
import {
  Accessibility,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Languages,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  X,
} from 'lucide-react';
import { getResourceContacts } from '../utils/contact';
import { getReviewState } from '../services/dataQuality';
import { formatResourcePlace } from '../utils/place';

interface ResourceDetailModalProps {
  resource: Resource | null;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
const REPORT_EMAIL =
  import.meta.env.VITE_RESOURCE_REPORT_EMAIL?.trim() || 'automatedworkflowllc@gmail.com';

function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function reportHref(resource: Resource): string {
  const subject = `Hearth listing update: ${resource.name}`;
  const body = [
    `Listing: ${resource.name}`,
    `Listing ID: ${resource.id}`,
    '',
    'What information appears outdated?',
    '',
    'What is the correct information?',
    '',
    'Source URL or public phone number used to confirm the correction:',
    '',
    'Please do not include private, medical, or other sensitive personal information.',
  ].join('\n');
  return `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function ContactIcon({ contact }: { contact: ContactMethod }) {
  if (contact.type === 'phone') return <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />;
  if (contact.type === 'sms') return <MessageSquareText className="h-4 w-4 shrink-0" aria-hidden="true" />;
  if (contact.type === 'email') return <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />;
  if (contact.type === 'intake') return <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />;
  return <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({ resource, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!resource) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const initial = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    (initial && initial.length ? initial[0] : panelRef.current)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Tab' && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [resource, onClose]);

  if (!resource) return null;

  const hoursDisplay =
    typeof resource.hours === 'string'
      ? resource.hours
      : resource.hours.map((hour) => `${hour.day}: ${hour.closed ? 'Closed' : `${hour.open}-${hour.close}`}`).join('\n');
  const contacts = getResourceContacts(resource);
  const reviewDate = resource.review?.reviewedAt ?? resource.lastVerified;
  const reviewState = getReviewState(resource);
  const place = formatResourcePlace(resource);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl focus:outline-none"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-muted transition-colors hover:bg-card-hover hover:text-main"
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="mb-3 flex flex-wrap items-center gap-2 pr-10">
          <span className="inline-flex rounded-full border border-border bg-card-hover px-3 py-1 text-xs font-semibold uppercase tracking-wider text-main">
            {resource.category}
          </span>
          {resource.availability && (
            <span className="inline-flex rounded-full bg-card-hover px-2.5 py-1 text-xs font-medium text-main">
              {resource.availability}
            </span>
          )}
        </div>

        <h2 id={titleId} className="mb-3 font-display text-2xl font-extrabold text-main">
          {resource.name}
        </h2>

        <p className="mb-6 rounded-xl border border-border bg-app p-4 text-sm leading-relaxed text-main">
          {resource.description}
        </p>

        <div className="mb-6 space-y-4 text-sm text-main">
          {place && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <strong className="block font-semibold text-main">Address</strong>
                <span>{place}</span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <strong className="block font-semibold text-main">Hours</strong>
              <pre className="mt-0.5 whitespace-pre-wrap font-sans text-xs text-muted">{hoursDisplay}</pre>
              <span className="mt-1 block text-xs text-muted">Call before traveling when availability is time-sensitive.</span>
            </div>
          </div>

          {resource.eligibility && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#35684a]" aria-hidden="true" />
              <div>
                <strong className="block font-semibold text-main">Eligibility</strong>
                <span className="text-muted">{resource.eligibility}</span>
              </div>
            </div>
          )}

          {resource.languages?.length ? (
            <div className="flex items-start gap-3">
              <Languages className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <strong className="block font-semibold text-main">Documented language access</strong>
                <span className="text-muted">
                  {resource.languages.map((language) => `${language.label} (${language.access})`).join(', ')}
                </span>
              </div>
            </div>
          ) : null}

          {resource.accessibility && (
            <div className="flex items-start gap-3">
              <Accessibility className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <strong className="block font-semibold text-main">Documented accessibility</strong>
                <span className="text-muted">
                  Wheelchair access: {resource.accessibility.wheelchair}
                  {resource.accessibility.notes?.length ? ` · ${resource.accessibility.notes.join(' · ')}` : ''}
                </span>
              </div>
            </div>
          )}

          {contacts.length > 0 && (
            <div className="grid grid-cols-1 gap-2 border-t border-border pt-4 sm:grid-cols-2">
              {contacts.map((contact) => {
                const external = ['website', 'chat', 'intake'].includes(contact.type);
                return (
                  <a
                    key={`${contact.type}-${contact.href}`}
                    href={contact.href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2.5 font-semibold transition-colors ${
                      contact.primary
                        ? 'border-primary bg-primary text-inverse hover:bg-primary-hover'
                        : 'border-border-input bg-surface text-main hover:bg-card-hover'
                    }`}
                  >
                    <ContactIcon contact={contact} />
                    <span className="min-w-0">
                      <span className="block text-xs">{contact.label}</span>
                      <span className="block truncate text-xs font-normal">{contact.value}</span>
                    </span>
                    {external && <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {resource.review && (
          <section
            className={`rounded-xl border p-4 ${
              reviewState === 'current' ? 'border-border bg-app' : 'border-primary bg-card-hover'
            }`}
            aria-labelledby={`${titleId}-review`}
          >
            <div className="flex items-start gap-2">
              {reviewState === 'current' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              )}
              <div>
                <h3 id={`${titleId}-review`} className="font-display text-sm font-bold text-main">
                  {reviewState === 'current' ? 'Listing review record' : 'Confirmation needed'}
                </h3>
                {reviewDate && (
                  <p className="mt-1 text-xs text-muted">
                    Reviewed <time dateTime={reviewDate}>{formatDate(reviewDate)}</time>
                    {' · '}next review due <time dateTime={resource.review.reviewDueAt}>{formatDate(resource.review.reviewDueAt)}</time>
                  </p>
                )}
                {resource.review.note && <p className="mt-2 text-xs text-main">{resource.review.note}</p>}
                {resource.review.sources.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {resource.review.sources.map((source) => (
                      <li key={source.url}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline"
                        >
                          {source.name} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <a
            href={reportHref(resource)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-card-hover hover:underline"
          >
            <Mail className="h-4 w-4" aria-hidden="true" /> Report outdated information
          </a>
          <p className="mt-1 text-xs text-muted">
            Opens your email app with the listing details. Do not include private or sensitive personal information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailModal;
