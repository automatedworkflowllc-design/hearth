import React from 'react';
import { PhoneCall, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      className="bg-nav text-on-nav-muted py-8 border-t border-nav-hover mt-auto"
      role="contentinfo"
      aria-label="Site Footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h2 className="text-on-nav font-semibold text-lg mb-2">Hearth</h2>
          <p className="text-xs text-on-nav-muted">
            A demonstration app for discovering local community services.
          </p>
        </div>

        <div>
          <h3 className="text-on-nav font-medium text-sm mb-2 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-on-nav-muted" aria-hidden="true" />
            Emergency Contacts
          </h3>
          <ul className="text-xs space-y-1 text-on-nav-muted">
            <li>Community Services Hotline: <a href="tel:211" className="text-on-nav font-mono underline">211</a></li>
            <li>Crisis Support: <a href="tel:988" className="text-on-nav font-mono underline">988</a></li>
            <li>Emergency Services: <a href="tel:911" className="text-on-nav font-mono underline">911</a></li>
            <li>National DV Hotline: <a href="tel:18007997233" className="text-on-nav font-mono underline">1-800-799-7233</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-on-nav font-medium text-sm mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-on-nav-muted" aria-hidden="true" />
            Accessibility & Privacy
          </h3>
          <p className="text-xs text-on-nav-muted">
            Zero personal data tracking, no analytics, no cookies.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-4 border-t border-nav-hover text-center text-xs text-on-nav-muted">
        &copy; {new Date().getFullYear()} Hearth — an open-source demonstration project.
      </div>
    </footer>
  );
};

export default Footer;
