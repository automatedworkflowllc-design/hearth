# Project: Community Resource Hub

## Architecture
React 18 + Vite application with client-side resource search engine, interactive map view, accessibility controls, and responsive UI grid.

- `src/components/`: Modular UI components (Navbar, Header, ResourceMap, ResourceList, ResourceCard, FilterBar, AccessibilityToolbar, ResourceDetailModal)
- `src/services/`: Local Resource Data Engine (data search, distance calculation, filtering, sorting)
- `src/data/`: Realistic mock datasets (`resources.ts`)
- `src/hooks/`: Custom React hooks (`useResources`, `useAccessibility`, `useGeoLocation`)
- `src/types/`: TypeScript definitions (`Resource`, `FilterOptions`, `Location`, `AccessibilityState`)
- `tests/`: Automated unit tests and E2E test suites

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Test Suite | Build opaque-box E2E test suite (Tiers 1-4) & infrastructure | none | DONE |
| 1 | Foundation & Project Setup | React/Vite project setup, components shell, test framework | none | IN_PROGRESS |
| 2 | Data Engine & Search Service | Client-side filtering, sorting, distance calculation, mock dataset & unit tests | M1 | PLANNED |
| 3 | Interactive UI, Map View & Accessibility | Map view, detail view, high contrast, font size toggle, responsive layout | M1, M2 | PLANNED |
| 4 | Final Verification & Hardening | 100% E2E test suite pass + Tier 5 adversarial hardening | E2E, M1, M2, M3 | PLANNED |

## Interface Contracts
### Data Engine Interface (`src/services/resourceService.ts`)
- `searchResources(query: string, category: string, tags: string[], userLocation?: {lat: number, lng: number}, sortBy?: 'distance'|'name'|'relevance'): Resource[]`
- `getResourceById(id: string): Resource | undefined`
- `calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number`

### Accessibility State (`src/hooks/useAccessibility.ts`)
- `contrastMode: 'standard' | 'high-contrast'`
- `textSize: 'normal' | 'large' | 'extra-large'`
- `toggleContrast(): void`
- `setTextSize(size: 'normal' | 'large' | 'extra-large'): void`

## Code Layout
- Root directory: React + Vite project setup (`package.json`, `vite.config.ts`, `index.html`)
- Source code in `src/`
- Tests in `tests/` and `src/__tests__/`
