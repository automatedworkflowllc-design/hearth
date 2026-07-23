import React from 'react';
import { PhoneCall, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      className="bg-gray-900 text-gray-300 py-8 border-t border-gray-800 mt-auto"
      role="contentinfo"
      aria-label="Site Footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h2 className="text-white font-semibold text-lg mb-2">Community Resource Hub</h2>
          <p className="text-xs text-gray-400">
            Providing accessible, real-time community service discovery for everyone.
          </p>
        </div>

        <div>
          <h3 className="text-white font-medium text-sm mb-2 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-blue-400" aria-hidden="true" />
            Emergency Contacts
          </h3>
          <ul className="text-xs space-y-1 text-gray-400">
            <li>Community Services Hotline: <span className="text-white font-mono">211</span></li>
            <li>Crisis Support: <span className="text-white font-mono">988</span></li>
            <li>Emergency Services: <span className="text-white font-mono">911</span></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-medium text-sm mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Accessibility & Privacy
          </h3>
          <p className="text-xs text-gray-400">
            Designed to WCAG 2.1 AA standards. Zero personal data tracking.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-4 border-t border-gray-800 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Community Resource Hub. Open Source & Non-profit Initiative.
      </div>
    </footer>
  );
};

export default Footer;
