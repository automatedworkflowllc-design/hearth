# Technical Analysis & Architecture Specification: Milestone 1 (Foundation & Project Setup)

## Executive Summary
This document provides the complete architecture specification, configuration blueprints, component skeletons, and verification methods for **Milestone 1: Foundation & Project Setup** of the **Community Resource Hub** application.

The project is built on **React 18** with **Vite**, **TypeScript**, **Tailwind CSS**, **Lucide React**, **Leaflet**, and **Vitest**. It establishes a high-performance, accessible single-page application foundation ready for subsequent data engine (Milestone 2) and interactive UI/map integration (Milestone 3).

---

## 1. System Environment & Package Dependencies

### Environment Constraints
- **Node.js**: v24.18.0 (Verified active runtime)
- **npm**: v11.18.0 (Verified active package manager)
- **Operating System**: Windows (PowerShell / CMD shell support required)

### Dependency Specification (`package.json`)

#### Production Dependencies (`dependencies`)
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `react` | `^18.3.1` | Core UI library |
| `react-dom` | `^18.3.1` | DOM renderer for React |
| `lucide-react` | `^0.395.0` | Accessible SVG icon set for navigation, categories, and controls |
| `leaflet` | `^1.9.4` | Open-source interactive map engine |
| `react-leaflet` | `^4.2.1` | React bindings for Leaflet map component rendering |
| `clsx` | `^2.1.1` | Conditional CSS class constructor |
| `tailwind-merge` | `^2.3.0` | Tailwind CSS utility class merger without styling conflicts |

#### Development Dependencies (`devDependencies`)
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `vite` | `^5.3.1` | Dev server and lightning-fast bundler |
| `@vitejs/plugin-react` | `^4.3.1` | Vite plugin for React Fast Refresh and JSX transformation |
| `typescript` | `^5.4.5` | Static type checker |
| `@types/react` | `^18.3.3` | Type definitions for React |
| `@types/react-dom` | `^18.3.0` | Type definitions for React DOM |
| `@types/node` | `^20.14.0` | Type definitions for Node.js modules |
| `@types/leaflet` | `^1.9.11` | Type definitions for Leaflet |
| `tailwindcss` | `^3.4.4` | Utility-first CSS styling engine |
| `postcss` | `^8.4.38` | CSS post-processor for Tailwind |
| `autoprefixer` | `^10.4.19` | Automatic vendor prefixer for cross-browser CSS |
| `vitest` | `^1.6.0` | Vite-native unit testing framework |
| `@testing-library/react` | `^16.0.0` | DOM testing utilities for React components |
| `@testing-library/jest-dom` | `^6.4.5` | Custom DOM element matchers (`toBeInTheDocument`, etc.) |
| `@testing-library/user-event` | `^14.5.2` | Simulation of realistic browser event interactions |
| `jsdom` | `^24.1.0` | Headless browser DOM environment for Vitest |

---

## 2. Recommended Directory Structure

```
c:\Users\hisbo\Documents\antigravtest\
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── App.tsx
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ResourceMap.tsx (stub for M3)
│   │   ├── ResourceList.tsx (stub for M2/M3)
│   │   ├── ResourceCard.tsx (stub for M2/M3)
│   │   ├── FilterBar.tsx (stub for M2/M3)
│   │   ├── AccessibilityToolbar.tsx (stub for M3)
│   │   └── ResourceDetailModal.tsx (stub for M3)
│   ├── data/
│   │   └── resources.ts (stub data provider for M2)
│   ├── hooks/
│   │   ├── useResources.ts (stub hook)
│   │   ├── useAccessibility.ts (stub hook)
│   │   └── useGeoLocation.ts (stub hook)
│   ├── services/
│   │   └── resourceService.ts (stub interface implementation for M2)
│   └── types/
│       └── index.ts (Type definitions & interface contracts)
└── tests/
    ├── setup.ts (Vitest matchers setup)
    ├── components/
    │   └── Layout.test.tsx (Unit test suite for Layout & base components)
    └── services/
        └── resourceService.test.ts (Stub test file for data engine)
```

---

## 3. Configuration Files Blueprint

### 3.1 `package.json`
```json
{
  "name": "community-resource-hub",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.395.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.5",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/leaflet": "^1.9.11",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.1.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.3.1",
    "vitest": "^1.6.0"
  }
}
```

### 3.2 `vite.config.ts`
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
  },
});
```

### 3.3 `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3.4 `tsconfig.node.json`
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### 3.5 `index.html`
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Community Resource Hub</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
  </head>
  <body class="bg-gray-50 text-gray-900 min-h-screen antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 3.6 `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
```

### 3.7 `postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 3.8 `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-scale: 1;
}

body {
  font-size: calc(1rem * var(--font-scale));
}

.high-contrast {
  filter: contrast(130%);
}

.high-contrast body {
  background-color: #000000 !important;
  color: #ffffff !important;
}

.leaflet-container {
  width: 100%;
  height: 100%;
  z-index: 10;
}
```

---

## 4. TypeScript Interface Contracts (`src/types/index.ts`)

```typescript
export interface Location {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export interface HoursOfOperation {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

export type ResourceCategory = 'food' | 'shelter' | 'health' | 'legal' | 'support';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  location: Location;
  phone: string;
  email?: string;
  website?: string;
  hours: HoursOfOperation[];
  eligibility: string;
  services: string[];
  tags: string[];
  isAvailable: boolean;
  distanceMiles?: number;
}

export interface FilterOptions {
  searchQuery: string;
  category: string;
  tags: string[];
  sortBy: 'distance' | 'name' | 'relevance';
  userLocation?: {
    lat: number;
    lng: number;
  };
}

export type ContrastMode = 'standard' | 'high-contrast';
export type TextSize = 'normal' | 'large' | 'extra-large';

export interface AccessibilityState {
  contrastMode: ContrastMode;
  textSize: TextSize;
  toggleContrast: () => void;
  setTextSize: (size: TextSize) => void;
}
```

---

## 5. Core Base Components Skeleton Design

### 5.1 `src/components/Navbar.tsx`
```tsx
import React from 'react';
import { HeartHandshake, MapPin, Search } from 'lucide-react';

interface NavbarProps {
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchClick }) => {
  return (
    <nav className="bg-brand-900 text-white shadow-md border-b border-brand-800" aria-label="Main Navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-brand-600 p-2 rounded-lg text-white">
            <HeartHandshake className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight block">Community Hub</span>
            <span className="text-xs text-blue-200 block hidden sm:block">Local Resource Finder</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onSearchClick}
            className="flex items-center space-x-1 bg-brand-800 hover:bg-brand-700 text-white px-3 py-1.5 rounded-md text-sm transition focus:ring-2 focus:ring-white"
            aria-label="Jump to search"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span className="hidden md:inline">Search Resources</span>
          </button>
          <div className="flex items-center space-x-1 text-xs text-blue-200 bg-brand-800 px-2.5 py-1 rounded-full">
            <MapPin className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
            <span>Local Region</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
```

### 5.2 `src/components/Header.tsx`
```tsx
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-brand-800 to-brand-600 text-white py-8 px-4 sm:px-6 lg:px-8 shadow-inner">
      <div className="max-w-7xl mx-auto text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Find Local Support & Community Services
        </h1>
        <p className="mt-2 text-base sm:text-lg text-blue-100 max-w-3xl">
          Quickly discover food pantries, emergency shelters, healthcare clinics, legal assistance, and support programs near you.
        </p>
      </div>
    </header>
  );
};

export default Header;
```

### 5.3 `src/components/Footer.tsx`
```tsx
import React from 'react';
import { PhoneCall, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 border-t border-gray-800 mt-auto" aria-label="Site Footer">
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
```

### 5.4 `src/components/Layout.tsx`
```tsx
import React from 'react';
import Navbar from './Navbar';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased">
      <Navbar />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
```

### 5.5 `src/App.tsx`
```tsx
import React from 'react';
import Layout from './components/Layout';

export const App: React.FC = () => {
  return (
    <Layout>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Milestone 1: Project Foundation Ready
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto mb-6">
          The React + Vite + TypeScript application core has been initialized with Tailwind CSS, Lucide icons, and testing setup.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
          Ready for Milestone 2 (Data Engine & Search Service)
        </div>
      </div>
    </Layout>
  );
};

export default App;
```

---

## 6. Unit Test Infrastructure & Verification Plan

### 6.1 `tests/setup.ts`
```typescript
import '@testing-library/jest-dom';
```

### 6.2 `tests/components/Layout.test.tsx`
```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Layout from '../../src/components/Layout';

describe('Layout Base Component', () => {
  it('renders navbar, header, footer, and child content', () => {
    render(
      <Layout>
        <div data-testid="test-content">Test Child Component</div>
      </Layout>
    );

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /find local support/i })).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo', { name: /site footer/i })).toBeInTheDocument();
  });
});
```

### 6.3 Windows Verification Execution Commands
To execute verification in Windows PowerShell:

1. **Install dependencies**:
   ```powershell
   npm install
   ```
2. **Type Checking & Production Build**:
   ```powershell
   npm run build
   ```
   *Expected output: TypeScript compilation succeeds with zero errors, and Vite outputs built assets into `dist/`.*

3. **Automated Unit Testing**:
   ```powershell
   npm test
   ```
   *Expected output: Vitest executes in single-run mode, passing all tests.*

---

## 7. Next Steps & Handoff to Implementer

1. Implementer creates/verifies root configuration files (`package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `tailwind.config.js`, `postcss.config.js`).
2. Implementer creates `src/` directory tree with `types/index.ts`, `index.css`, `main.tsx`, and core UI component skeletons (`Navbar.tsx`, `Header.tsx`, `Footer.tsx`, `Layout.tsx`, `App.tsx`).
3. Implementer runs `npm install`, `npm run build`, and `npm test` to verify build and test runner execution.
