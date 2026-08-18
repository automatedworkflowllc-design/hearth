import React from 'react';
import type { ContactMethod, Resource } from '../types/index';
import {
  Clock,
  ExternalLink,
  Languages,
  MapPin,
  MessageSquareText,
  Phone,
  Accessibility,
} from 'lucide-react';
import { getPrimaryContact } from '../utils/contact';
import { getReviewState } from '../services/dataQuality';
import { formatResourcePlace } from '../utils/place';

interface ResourceCardProps {
  resource: Resource;
  onSelect: (resource: Resource) => void;
}

const categoryColors: Record<string, string> = {
  food: 'text-cat-food',
  shelter: 'text-cat-shelter',
  health: 'text-cat-health',
  legal: 'text-cat-legal',
  support: 'text-cat-support',
};

const categoryAccents: Record<string, string> = {
  food: 'border-l-cat-food',
  shelter: 'border-l-cat-shelter',
  health: 'border-l-cat-health',
  legal: 'border-l-cat-legal',
  support: 'border-l-cat-support',
};

function approxDistance(miles: number): string {
  if (miles < 1) return 'under 1 mi';
  return `~${Math.round(miles)} mi`;
}

function formatReviewDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

function ContactIcon({ contact }: { contact: ContactMethod }) {
  if (contact.type === 'phone') return <Phone className="h-3.5 w-3.5" aria-hidden="true" />;
  if (contact.type === 'sms') return <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />;
  return <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onSelect }) => {
  const categoryKey = resource.category.toLowerCase();
  const categoryClass = categoryColors[categoryKey] ?? 'text-main';
  const accentClass = categoryAccents[categoryKey] ?? 'border-l-primary';
  const primaryContact = getPrimaryContact(resource);
  const reviewDate = resource.review?.reviewedAt ?? resource.lastVerified;
  const reviewState = getReviewState(resource);
  const place = formatResourcePlace(resource);
  const sourceName = resource.review?.sources[0]?.name;
  const externalContact =
    primaryContact && ['website', 'chat', 'intake'].includes(primaryContact.type);

  const hoursDisplay = typeof resource.hours === 'string'
    ? resource.hours
    : resource.hours.map((hour) => `${hour.day}: ${hour.closed ? 'Closed' : `${hour.open}-${hour.close}`}`).join(', ');

  return (
    <article className={`flex h-full flex-col rounded-2xl border border-border border-l-4 ${accentClass} bg-surface p-5 shadow-sm transition-all duration-200 hover:bg-card-hover hover:shadow-md`}>
      <span className={`font-display text-xs font-extrabold uppercase tracking-wider ${categoryClass}`}>
        {resource.category}
      </span>

      <h3 className="mt-1.5 font-display text-lg font-bold text-main">{resource.name}</h3>

      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{resource.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {typeof resource.distanceMiles === 'number' && (
          <span className="rounded-full bg-card-hover px-2.5 py-1 text-xs font-bold text-main">
            {approxDistance(resource.distanceMiles)}
          </span>
        )}
        {resource.availability && (
          <span className="rounded-full bg-card-hover px-2.5 py-1 text-xs font-bold text-main">
            {resource.availability}
          </span>
        )}
        {resource.languages?.map((language) => (
          <span key={language.code} className="inline-flex items-center gap-1 rounded-full bg-card-hover px-2.5 py-1 text-xs font-bold text-main">
            <Languages className="h-3 w-3" aria-hidden="true" /> {language.label}
          </span>
        ))}
        {resource.accessibility?.wheelchair === 'yes' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-card-hover px-2.5 py-1 text-xs font-bold text-main">
            <Accessibility className="h-3 w-3" aria-hidden="true" /> Wheelchair access documented
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2 text-xs text-muted">
        {place && (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <span>{place}</span>
          </div>
        )}
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <span className="line-clamp-2">{hoursDisplay}</span>
        </div>
        {sourceName && (
          <p>Listed by {sourceName}</p>
        )}
        {reviewDate && (
          <p className={reviewState === 'current' ? 'text-muted' : 'font-semibold text-primary'}>
            {reviewState === 'exception' || reviewState === 'needs-review' ? 'Needs confirmation · ' : 'Listing reviewed '}
            <time dateTime={reviewDate}>{formatReviewDate(reviewDate)}</time>
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
        <button
          onClick={() => onSelect(resource)}
          className="min-h-11 rounded-xl bg-primary px-3.5 py-2 font-display text-xs font-bold text-inverse transition-colors hover:bg-primary-hover"
        >
          What to expect →
        </button>
        {primaryContact && (
          <a
            href={primaryContact.href}
            target={externalContact ? '_blank' : undefined}
            rel={externalContact ? 'noopener noreferrer' : undefined}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-primary hover:bg-card-hover hover:underline"
          >
            <ContactIcon contact={primaryContact} />
            {primaryContact.label}
          </a>
        )}
      </div>
    </article>
  );
};
