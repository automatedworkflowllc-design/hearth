import React from 'react';
import Navbar from './Navbar';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  onSearchClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onSearchClick }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-700 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      <Navbar onSearchClick={onSearchClick} />
      <Header />

      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none"
      >
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
