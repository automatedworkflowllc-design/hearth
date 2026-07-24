import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-nav text-on-nav py-8 px-4 sm:px-6 lg:px-8 shadow-inner" role="banner">
      <div className="max-w-7xl mx-auto text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Find Local Support & Community Services
        </h1>
        <p className="mt-2 text-base sm:text-lg text-on-nav/85 max-w-3xl">
          Quickly discover food pantries, emergency shelters, healthcare clinics, legal assistance, and support programs near you.
        </p>
      </div>
    </header>
  );
};

export default Header;
