import React from 'react';
import { PhoneCall, ShieldCheck } from 'lucide-react';
import { BrandMark } from './BrandMark';

export const Footer: React.FC = () => {
  return (
    <footer
      className="bg-nav text-on-nav-muted py-10 border-t border-nav-hover mt-auto"
      role="contentinfo"
      aria-label="Site Footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <BrandMark className="h-8 w-8 shrink-0" title="" />
            <h2 className="text-on-nav font-display font-bold text-lg">Hearth</h2>
          </div>
          <p className="text-xs leading-relaxed text-on-nav-muted">
            A free, no-account directory for finding food, medical, and behavioral-health
            help near you. Shelter, housing, and legal aid are not complete here — dial{' '}
            <a href="tel:211" className="text-on-nav font-semibold underline">211</a>.
          </p>
        </div>

        <div>
          <h3 className="text-on-nav font-medium text-sm mb-2 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-on-nav-muted" aria-hidden="true" />
            Emergency Contacts
          </h3>
          <ul className="text-xs space-y-1.5 text-on-nav-muted">
            <li>Community services: <a href="tel:211" className="text-on-nav font-mono underline">211</a></li>
            <li>Crisis support: <a href="tel:988" className="text-on-nav font-mono underline">988</a></li>
            <li>Emergency services: <a href="tel:911" className="text-on-nav font-mono underline">911</a></li>
            <li>National DV Hotline: <a href="tel:18007997233" className="text-on-nav font-mono underline">1-800-799-7233</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-on-nav font-medium text-sm mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-on-nav-muted" aria-hidden="true" />
            Privacy &amp; source
          </h3>
          <p className="text-xs leading-relaxed text-on-nav-muted">
            No accounts, no analytics cookies, no advertising. Map tiles come from
            OpenStreetMap, which like any website can see your IP address.
          </p>
          <p className="mt-2 text-xs">
            <a
              href="https://github.com/automatedworkflowllc-design/hearth"
              className="text-on-nav font-semibold underline"
            >
              Open-source on GitHub
            </a>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-4 border-t border-nav-hover text-center text-xs text-on-nav-muted">
        &copy; {new Date().getFullYear()} Hearth — MIT licensed. Listings are sourced from
        public directories and may change; call before traveling.
      </div>
    </footer>
  );
};

export default Footer;
