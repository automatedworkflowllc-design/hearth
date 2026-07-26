import React from 'react';
import { HeartHandshake, MessageSquareText, Phone, ShieldAlert } from 'lucide-react';

/**
 * Calm, scan-friendly crisis contacts with direct call and text actions.
 * The wording distinguishes 911 emergencies from 988 emotional support.
 */
export const SafetyBar: React.FC = () => (
  <section
    role="region"
    aria-label="Emergency contacts"
    className="rounded-2xl border border-border bg-surface p-2"
  >
    <h2 className="sr-only">Immediate and crisis support</h2>
    <div className="grid gap-2 md:grid-cols-3">
      <div className="rounded-xl bg-card-hover p-3">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-display text-xs font-extrabold uppercase tracking-wide text-main">Immediate danger</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">If you or someone else is in immediate danger.</p>
          </div>
        </div>
        <a
          href="tel:911"
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-inverse transition-colors hover:bg-primary-hover"
        >
          <Phone className="h-4 w-4" aria-hidden="true" /> Call 911
        </a>
      </div>

      <div className="rounded-xl bg-card-hover p-3">
        <div className="flex items-start gap-2.5">
          <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-display text-xs font-extrabold uppercase tracking-wide text-main">Need someone to talk to?</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">988 offers free, confidential crisis support 24/7.</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href="tel:988"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-2 text-sm font-bold text-inverse transition-colors hover:bg-primary-hover"
          >
            <Phone className="h-4 w-4" aria-hidden="true" /> Call 988
          </a>
          <a
            href="sms:988"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border-input bg-surface px-2 py-2 text-sm font-bold text-main transition-colors hover:bg-app"
          >
            <MessageSquareText className="h-4 w-4" aria-hidden="true" /> Text 988
          </a>
        </div>
      </div>

      <div className="rounded-xl bg-card-hover p-3">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-display text-xs font-extrabold uppercase tracking-wide text-main">Domestic violence support</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">Connect with the National Domestic Violence Hotline.</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href="tel:18007997233"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-2 text-sm font-bold text-inverse transition-colors hover:bg-primary-hover"
            aria-label="Call the National Domestic Violence Hotline at 1-800-799-7233"
          >
            <Phone className="h-4 w-4" aria-hidden="true" /> Call
          </a>
          <a
            href="sms:88788"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border-input bg-surface px-2 py-2 text-sm font-bold text-main transition-colors hover:bg-app"
            aria-label="Text START to 88788 for the National Domestic Violence Hotline"
          >
            <MessageSquareText className="h-4 w-4" aria-hidden="true" /> Text START
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default SafetyBar;
