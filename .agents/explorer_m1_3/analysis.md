# Technical Analysis & Architecture Specification: Mock Data, Data Engine & Unit Testing Strategy

**Agent**: Explorer 3 (Milestone 1 - Foundation & Project Setup)  
**Date**: 2026-07-22  
**Target Path**: `c:\Users\hisbo\Documents\antigravtest\.agents\explorer_m1_3\analysis.md`  

---

## Executive Summary

This report establishes the data domain models, data engine contracts, state management architecture, and automated unit testing strategy for the **Community Resource Hub** application.

Key achievements in this specification:
1. **TypeScript Schemas & Interfaces**: Complete, strongly-typed schemas for `Resource`, `Location`, `Hours`, `Contact`, `FilterOptions`, `AccessibilityState`, and search result wrappers.
2. **Data Engine Contract & Algorithmic Design**: Detailed specification for `searchResources`, tag/category filtering, keyword relevance scoring, distance calculation via the **Haversine Formula**, sorting strategies, and pagination logic.
3. **State Management Architecture**: Custom React hook contracts (`useResources`, `useAccessibility`, `useGeoLocation`) with clear state transitions, side effects, and accessibility persistence.
4. **Automated Unit Testing Framework**: Comprehensive Vitest + React Testing Library plan with isolated unit test suites for data engine functions, custom hooks, and core UI components.

---

## 1. Domain Data Models & TypeScript Interfaces

All domain types will reside in `src/types/resource.ts` and `src/types/accessibility.ts`.

### 1.1 Category & Status Enums/Types

```typescript
export type ResourceCategory = 
  | 'food' 
  | 'shelter' 
  | 'health' 
  | 'legal' 
  | 'support';

export type AvailabilityStatus = 'open' | 'limited' | 'full' | 'closed';

export type DayOfWeek = 
  | 'monday' 
  | 'tuesday' 
  | 'wednesday' 
  | 'thursday' 
  | 'friday' 
  | 'saturday' 
  | 'sunday';
```

### 1.2 Location Interface

```typescript
export interface Location {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  neighborhood?: string;
  lat: number;
  lng: number;
  accessNotes?: string;
  distanceMiles?: number; // Computed property when userLocation is provided
}
```

### 1.3 Operational Schedule & Hours Interface

```typescript
export interface DailyHours {
  day: DayOfWeek;
  open: string;  // Format: "08:00" or "8:00 AM"
  close: string; // Format: "17:00" or "5:00 PM"
  isClosed?: boolean;
}

export interface Hours {
  schedule: DailyHours[];
  description: string; // e.g. "Mon-Fri 8:00 AM - 5:00 PM"
  holidayNotes?: string;
  isOpen247?: boolean;
}
```

### 1.4 Contact Information Interface

```typescript
export interface Contact {
  phone: string;
  email?: string;
  website?: string;
  hotline?: string;
  tty?: string;
  contactPerson?: string;
  preferredMethod?: 'phone' | 'email' | 'walk-in' | 'website';
}
```

### 1.5 Resource Entity Interface

```typescript
export interface Resource {
  id: string;
  name: string;
  organizationName?: string;
  category: ResourceCategory;
  description: string;
  shortDescription?: string;
  location: Location;
  hours: Hours;
  contact: Contact;
  tags: string[];
  servicesProvided: string[];
  eligibility?: string;
  availabilityStatus: AvailabilityStatus;
  languagesSpoken: string[];
  wheelchairAccessible: boolean;
  lastVerified: string; // ISO date string (e.g. "2026-06-15")
  featured?: boolean;
}
```

### 1.6 Search & Filter Options Interface

```typescript
export type SortOption = 'distance' | 'name' | 'relevance' | 'availability';

export interface UserCoordinates {
  lat: number;
  lng: number;
}

export interface FilterOptions {
  query?: string;
  category?: ResourceCategory | 'all';
  tags?: string[];
  userLocation?: UserCoordinates | null;
  maxDistanceMiles?: number;
  availabilityStatus?: AvailabilityStatus | 'all';
  wheelchairOnly?: boolean;
  sortBy?: SortOption;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}
```

### 1.7 Accessibility State Interface

```typescript
export type ContrastMode = 'standard' | 'high-contrast';
export type TextSize = 'normal' | 'large' | 'extra-large';

export interface AccessibilityState {
  contrastMode: ContrastMode;
  textSize: TextSize;
  toggleContrast: () => void;
  setTextSize: (size: TextSize) => void;
  resetAccessibility: () => void;
}
```

---

## 2. Data Engine Contract & Core Algorithms

The client-side resource data engine will be located in `src/services/resourceService.ts`.

### 2.1 Public API Interface Contract

```typescript
export interface IResourceService {
  searchResources(
    query?: string,
    category?: string,
    tags?: string[],
    userLocation?: UserCoordinates | null,
    sortBy?: SortOption
  ): Resource[];

  filterResources(options: FilterOptions): PaginatedResult<Resource>;

  getResourceById(id: string): Resource | undefined;

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number;
}
```

### 2.2 Haversine Distance Formula Specification

The distance between two geographic coordinates on Earth is computed using the Great-Circle distance formula (Haversine formula).

$$\Delta \phi = \frac{(lat_2 - lat_1) \cdot \pi}{180}, \quad \Delta \lambda = \frac{(lon_2 - lon_1) \cdot \pi}{180}$$

$$\phi_1 = \frac{lat_1 \cdot \pi}{180}, \quad \phi_2 = \frac{lat_2 \cdot \pi}{180}$$

$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1) \cdot \cos(\phi_2) \cdot \sin^2\left(\frac{\Delta \lambda}{2}\right)$$

$$c = 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$

$$d = R \cdot c \quad \text{where } R = 3958.8 \text{ miles}$$

#### Algorithmic Implementation Design

```typescript
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Edge Case 1: Identical coordinates
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  // Edge Case 2: Invalid or missing coordinates
  if (
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2) ||
    lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
    lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180
  ) {
    return Infinity;
  }

  const EARTH_RADIUS_MILES = 3958.8;
  const toRad = (degree: number) => (degree * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  // Clamp 'a' to [0, 1] to prevent NaN from floating point precision errors
  const clampedA = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
  const rawDistance = EARTH_RADIUS_MILES * c;

  // Round to 1 decimal place for user-facing distance display
  return Math.round(rawDistance * 10) / 10;
}
```

### 2.3 Search & Filter Pipeline Specification

The `filterResources` function executes a multi-stage deterministic pipeline:

```
[Raw Resources Dataset]
       │
       ▼
 [1. Category Filter] ───► Filter by exact category (or pass if 'all')
       │
       ▼
 [2. Tag Matching]    ───► Match selected tags (AND / OR strategy)
       │
       ▼
 [3. Accessibility]   ───► Filter wheelchairAccessible if active
       │
       ▼
 [4. Availability]    ───► Filter status (open, limited, etc.)
       │
       ▼
 [5. Keyword Search]  ───► Tokenize query, match name, description, tags, calculate score
       │
       ▼
 [6. Distance Calculation] ► Attach distanceMiles if userLocation is provided
       │
       ▼
 [7. Distance Range]  ───► Filter distanceMiles <= maxDistanceMiles
       │
       ▼
 [8. Multi-Criteria Sort] ► Sort by distance, relevance, name, or availability
       │
       ▼
 [9. Pagination Slice]───► Apply slice((page-1)*limit, page*limit)
       │
       ▼
 [Paginated Result Output]
```

#### Field Relevance Weight Matrix (for `sortBy === 'relevance'`)

| Resource Field | Match Type | Score Weight |
|---|---|---|
| `name` | Exact / Substring | 10 pts |
| `category` | Exact match | 8 pts |
| `tags` | Exact tag match | 6 pts |
| `servicesProvided` | Substring match | 5 pts |
| `organizationName` | Substring match | 4 pts |
| `description` | Substring match | 3 pts |
| `location.city` | Substring match | 2 pts |

---

## 3. State Management & Custom React Hooks Architecture

### 3.1 `useResources` Hook Architecture (`src/hooks/useResources.ts`)

Manages client-side resource search, filter state, sorting, and user location synchronization.

```typescript
export interface UseResourcesReturn {
  resources: Resource[];
  allResources: Resource[];
  loading: boolean;
  error: string | null;
  filters: FilterOptions;
  totalCount: number;
  totalPages: number;
  selectedResource: Resource | null;
  setSearchQuery: (query: string) => void;
  setCategory: (category: ResourceCategory | 'all') => void;
  setTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  setSortBy: (sort: SortOption) => void;
  setUserLocation: (location: UserCoordinates | null) => void;
  setWheelchairOnly: (enabled: boolean) => void;
  setMaxDistance: (distance?: number) => void;
  setPage: (page: number) => void;
  setSelectedResource: (resource: Resource | null) => void;
  resetFilters: () => void;
}
```

### 3.2 `useAccessibility` Hook Architecture (`src/hooks/useAccessibility.ts`)

Provides centralized accessibility controls, syncing changes with `document.documentElement` CSS attributes and `localStorage`.

```typescript
// Initial default state
const DEFAULT_ACCESSIBILITY_STATE: AccessibilityState = {
  contrastMode: 'standard',
  textSize: 'normal',
  toggleContrast: () => {},
  setTextSize: () => {},
  resetAccessibility: () => {},
};

// Side Effects executed by hook:
// 1. Sync contrastMode attribute: document.documentElement.dataset.contrast = contrastMode
// 2. Sync textSize attribute: document.documentElement.dataset.textSize = textSize
// 3. Persist to localStorage key 'community_hub_accessibility'
```

### 3.3 `useGeoLocation` Hook Architecture (`src/hooks/useGeoLocation.ts`)

Provides accessible browser location retrieval with graceful fallback to default city center coordinates.

```typescript
export interface GeoLocationState {
  coordinates: UserCoordinates | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
  clearLocation: () => void;
}
```

---

## 4. Automated Vitest Unit Testing Strategy

### 4.1 Framework & Test Environment Setup

- **Runner**: Vitest
- **DOM Environment**: `jsdom` (via `vitest-dom` and `@testing-library/react`)
- **Assertion Extensions**: `@testing-library/jest-dom`
- **Config File**: `vite.config.ts` (or `vitest.config.ts`)

```typescript
// vitest.config.ts proposal
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
});
```

### 4.2 Test Matrix & Suite Specifications

#### Test Suite 1: `tests/unit/resourceService.test.ts` (Data Engine Core)

1. **Haversine Distance Unit Tests**:
   - `calculateDistance` returns `0` for identical coordinates `(37.7749, -122.4194)`.
   - `calculateDistance` computes correct distance between San Francisco `(37.7749, -122.4194)` and Oakland `(37.8044, -122.2712)` (~8.4 miles).
   - Handles negative lat/lng (Southern/Western hemispheres).
   - Returns `Infinity` for invalid inputs (`NaN`, `null`, out of range numbers).
2. **Category Filtering Tests**:
   - Category `'food'` returns only resources where `category === 'food'`.
   - Category `'all'` returns all resources.
   - Case-insensitive category match (`'FOOD'` matches `'food'`).
3. **Tag Filtering Tests**:
   - Filter by tag `['wheelchair-accessible']` returns matching resources.
   - Filter by multiple tags `['food-pantry', 'free']` returns items matching all specified tags.
   - Filtering with non-existent tag returns empty array `[]`.
4. **Keyword Search & Relevance Sorting Tests**:
   - Search query `"pantry"` matches resources with "pantry" in name or description.
   - Search query `"shelter"` matches shelter category and tags.
   - Sort by `'relevance'` ranks exact name match higher than description match.
5. **Distance Sorting & Filtering Tests**:
   - Given `userLocation`, resources are sorted strictly by `distanceMiles` ascending.
   - Given `maxDistanceMiles: 5`, excludes resources located further than 5 miles.
6. **Pagination Tests**:
   - `page: 1, limit: 5` returns first 5 items and `totalPages` calculation.
   - `page: 2, limit: 5` returns next 5 items.
   - Out of bounds page returns empty `items` array without error.

#### Test Suite 2: `tests/unit/useAccessibility.test.ts` (Accessibility Hook)

1. **Contrast Toggle**:
   - Toggles state between `'standard'` and `'high-contrast'`.
   - Updates `document.documentElement.dataset.contrast`.
2. **Text Size Adjustment**:
   - Sets text size to `'large'` or `'extra-large'`.
   - Updates `document.documentElement.dataset.textSize`.
3. **Persistence**:
   - Reads initial values from `localStorage` if present.

#### Test Suite 3: `tests/unit/useResources.test.ts` (Resource Data Hook)

1. **Initial Load**:
   - Populates resources array with initial dataset.
   - Sets `loading: false`.
2. **Filter State Actions**:
   - Calling `setCategory('shelter')` filters items and updates total count.
   - Calling `resetFilters()` restores full dataset and default sort.

#### Test Suite 4: `tests/unit/components/FilterBar.test.tsx` (UI Component)

1. **Rendering**:
   - Renders search text input, category options, and tag badges.
2. **User Interaction**:
   - Typing in search input triggers `onSearchChange`.
   - Selecting category button triggers `onCategoryChange`.
3. **Accessibility Attributes**:
   - Search input has accessible label (`aria-label="Search resources"`).
   - Category buttons have `aria-pressed` or `aria-selected` attributes.

---

## 5. Architectural Recommendations for Implementation

1. **Co-location of Test Files**:
   - Keep unit tests organized under `tests/unit/` for service and logic, and `tests/unit/components/` for React component render tests.
2. **Strict TypeScript Types**:
   - Enforce explicit typing on all data engine returns and parameter signatures to prevent downstream runtime errors.
3. **Robust Mock Dataset (`resources.ts`)**:
   - Include at least 20 realistic mock community resources covering all 5 categories (`food`, `shelter`, `health`, `legal`, `support`) with realistic coordinates in a defined metro region (e.g. San Francisco or New York).

---
