import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import QuickExit from './QuickExit';
import type { AccessibilityState } from '../types/index';

interface LayoutProps {
  children: React.ReactNode;
  onSearchClick?: () => void;
  accessibility?: AccessibilityState;
}

/**
 * Site chrome only. The page-level hero (with its own <h1>) now lives in App.tsx / Hero.tsx --
 * Layout previously also rendered a large duplicate banner (the old Header.tsx) with its own
 * competing headline, which was dropped as part of the 2026-07-24 redesign. Navbar is wrapped
 * in a real <header> so the "banner" landmark still exists, structurally, without reintroducing
 * a second visual hero.
 */
export const Layout: React.FC<LayoutProps> = ({ children, onSearchClick, accessibility }) => {
  return (
    <div className="min-h-screen flex flex-col bg-app text-main antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-inverse focus:rounded-md focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      <header>
        <Navbar onSearchClick={onSearchClick} accessibility={accessibility} />
      </header>

      {/* pb-24 keeps the last controls clear of the fixed Quick Exit button, which would
          otherwise sit on top of them (it overlapped "Use my location" at mobile widths). */}
      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 focus:outline-none"
      >
        {children}
      </main>

      <Footer />
      <QuickExit />
    </div>
  );
};

export default Layout;
