import React from 'react';
import { Search } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import type { AccessibilityState } from '../types/index';

interface NavbarProps {
  onSearchClick?: () => void;
  accessibility?: AccessibilityState;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchClick, accessibility }) => {
  return (
    <nav
      className="bg-nav text-on-nav shadow-md border-b border-nav-hover"
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-surface p-1.5 rounded-lg flex items-center justify-center">
            <BrandMark className="w-7 h-7" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight block">Hearth</span>
            <span className="text-xs text-on-nav-muted hidden sm:block">Find local support near you</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onSearchClick}
            className="flex items-center space-x-1 bg-nav-hover hover:bg-nav-hover text-on-nav px-3 py-1.5 rounded-md text-sm transition focus:outline-none focus:ring-2 focus:ring-white"
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
