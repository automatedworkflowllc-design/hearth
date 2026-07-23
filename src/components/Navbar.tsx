import React from 'react';
import { HeartHandshake, Search } from 'lucide-react';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import type { AccessibilityState } from '../types/index';

interface NavbarProps {
  onSearchClick?: () => void;
  accessibility?: AccessibilityState;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchClick, accessibility }) => {
  return (
    <nav
      className="bg-brand-900 text-white shadow-md border-b border-brand-800"
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-brand-600 p-2 rounded-lg text-white flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight block">Community Resource Hub</span>
            <span className="text-xs text-blue-200 hidden sm:block">Local Support & Assistance Finder</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onSearchClick}
            className="flex items-center space-x-1 bg-brand-800 hover:bg-brand-700 text-white px-3 py-1.5 rounded-md text-sm transition focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Jump to search"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span className="hidden md:inline">Search Resources</span>
          </button>
          {accessibility && <AccessibilityToolbar {...accessibility} />}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
