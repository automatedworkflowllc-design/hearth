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
      <div className="max-w-7xl mx-auto flex min-h-16 flex-wrap items-center gap-y-2 px-4 py-2 sm:h-16 sm:flex-nowrap sm:px-6 sm:py-0 lg:px-8">
        <div className="flex min-w-0 items-center space-x-3">
          <BrandMark className="h-9 w-9 shrink-0 drop-shadow-sm" title="" />
          <div>
            <span className="font-bold text-xl tracking-tight block">Hearth</span>
            <span className="text-xs text-on-nav-muted hidden sm:block">Find support near you</span>
          </div>
        </div>

        <div className="ml-auto flex items-center">
          <button
            onClick={onSearchClick}
            className="flex min-h-11 items-center space-x-1 rounded-md bg-nav-hover px-3 py-1.5 text-sm text-on-nav transition hover:bg-on-nav hover:text-nav focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Jump to search"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span className="hidden md:inline">Search Resources</span>
          </button>
        </div>
        {accessibility && (
          <div className="order-3 w-full border-t border-nav-hover pt-2 sm:order-none sm:ml-4 sm:w-auto sm:border-0 sm:pt-0">
            <AccessibilityToolbar {...accessibility} />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
