import React from 'react';
import { PhoneCall, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      className="bg-nav text-on-nav/80 py-8 border-t border-nav-hover mt-auto"
      role="contentinfo"
      aria-label="Site Footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h2 className="text-on-nav font-semibold text-lg mb-2">Hearth</h2>
          <p className="text-xs text-on-nav/70">
            A demonstration app for discovering local community services.
          </p>
        </div>

        <div>
          <h3 className="text-on-nav font-medium text-sm mb-2 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-on-nav/80" aria-hidden="true" />
            Emergency Contacts
          </h3>
          <ul className="text-xs space-y-1 text-on-nav/70">
            <li>Community Services Hotline: <span className="text-on-nav font-mono">211</span></li>
            <li>Crisis Support: <span className="text-on-nav font-mono">988</span></li>
            <li>Emergency Services: <span className="text-on-nav font-mono">911</span></li>
          </ul>
        </div>

        <div>
          <h3 className="text-on-nav font-medium text-sm mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Accessibility & Privacy
          </h3>
          <p className="text-xs text-on-nav/70">
            Zero personal data tracking, no analytics, no cookies.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-4 border-t border-nav-hover text-center text-xs text-on-nav/70">
        &copy; {new Date().getFullYear()} Hearth — an open-source demonstration project.
      </div>
    </footer>
  );
};

export default Footer;
