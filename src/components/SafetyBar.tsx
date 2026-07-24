import React from 'react';

/**
 * Persistent crisis-line bar. Real tel: links, correctly scoped by need (a critique caught
 * the earlier draft copy routing "immediate danger" to 988 -- 988 is the Suicide & Crisis
 * Lifeline, not an emergency-danger line; danger needs 911, and the domestic-violence
 * hotline is surfaced explicitly since Quick Exit exists precisely for that audience).
 * A calm, non-alarming region -- no pulsing, no "danger" framing as the lead -- since most
 * visitors need food or a bed, not acute crisis intervention.
 */
export const SafetyBar: React.FC = () => (
  <div
    role="region"
    aria-label="Emergency contacts"
    className="rounded-xl border border-border bg-card-hover px-4 py-3 text-sm text-main"
  >
    In immediate danger, call{' '}
    <a href="tel:911" className="font-bold text-primary underline">911</a>. Need to talk to someone?
    Call or text{' '}
    <a href="tel:988" className="font-bold text-primary underline">988</a>{' '}
    (Suicide &amp; Crisis Lifeline, free &amp; confidential, 24/7). Experiencing domestic violence?
    Call the National DV Hotline:{' '}
    <a href="tel:18007997233" className="font-bold text-primary underline">1-800-799-7233</a>.
  </div>
);

export default SafetyBar;
