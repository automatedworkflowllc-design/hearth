# E2E Test Infrastructure & Test Suite Documentation

## Executive Summary
The Community Resource Hub End-to-End (E2E) Test Infrastructure provides a 4-tier opaque-box test framework designed to validate requirement fulfillment (R1, R2, R3) across feature coverage, boundary conditions, cross-feature interactions, and real-world user workflows.

---

## 4-Tier Opaque-Box Methodology

The test suite operates as an opaque-box tester. It exercises the Community Resource Hub strictly through public interface contracts, DOM attribute selectors, user interactions, and state driver abstractions without relying on internal component implementations.

```
+-----------------------------------------------------------------------------------+
|                        4-TIER E2E OPAQUE-BOX TEST ARCHITECTURE                   |
+-----------------------------------------------------------------------------------+
| Tier 1: Feature Coverage                                                         |
|   - Search, Category Filters, Distance Sorting, Map View, Detail Modal, A11y    |
+-----------------------------------------------------------------------------------+
| Tier 2: Boundary & Edge Cases                                                    |
|   - Empty Queries, Zero Matches, Extreme Coordinates, Missing Fields, Special Chars|
+-----------------------------------------------------------------------------------+
| Tier 3: Cross-Feature Interactions                                               |
|   - Combined Search+Filter+Sort+A11y, Dynamic Category Swaps, Filter Reset      |
+-----------------------------------------------------------------------------------+
| Tier 4: Real-World Scenarios                                                     |
|   - Emergency Food Workflow, Low-Vision Seeking, Multi-Service, Mobile View      |
+-----------------------------------------------------------------------------------+
```

---

## Test Inventory & Tier Specifications

### Tier 1: Feature Coverage (7 Tests)
- `T1.1`: **Keyword Search** — Filters resources dynamically by search query matching title, description, or tags.
- `T1.2`: **Category Filtering** — Restricts resources to selected category (`food`, `shelter`, `health`, `legal`).
- `T1.3`: **Distance Sorting** — Sorts resources in ascending order based on Haversine distance from user location.
- `T1.4`: **Map View & Markers** — Verifies map view toggle and marker list matching active filtered resources.
- `T1.5`: **Detail View Modal** — Opens detail modal and verifies complete operational metadata (hours, contact, address, availability).
- `T1.6`: **Accessibility Contrast Mode** — Toggles contrast between `standard` and `high-contrast`.
- `T1.7`: **Accessibility Text Size** — Adjusts font sizing across `normal`, `large`, and `extra-large`.

### Tier 2: Boundary & Edge Cases (5 Tests)
- `T2.1`: **Empty Search Query** — Empty strings and whitespace queries return full dataset without errors.
- `T2.2`: **Zero Matches** — Non-matching search strings return 0 items cleanly with 0 count DOM state.
- `T2.3`: **Extreme Coordinates** — Locations at South Pole (-90, 0) or Date Line (0, 180) calculate without NaN or overflow.
- `T2.4`: **Missing Optional Fields** — Resources with undefined email/website/eligibility render safely without throwing exceptions.
- `T2.5`: **Special Characters & Injections** — Regex metacharacters, quotes, HTML/XSS scripts, and emojis are handled safely.

### Tier 3: Cross-Feature Interactions (4 Tests)
- `T3.1`: **Combined Filter+Search+Distance+High Contrast** — Executes simultaneous query, category, location sort, and high contrast active state.
- `T3.2`: **Dynamic Category Change During Search** — Switching categories updates results instantly while preserving search query.
- `T3.3`: **Resetting Filters Preserves Accessibility** — Resetting category and query returns filters to default while leaving accessibility settings intact.
- `T3.4`: **Map Marker Selection** — Clicking map markers after applying filters opens corresponding detail modal.

### Tier 4: Real-World Scenarios (4 Tests)
- `T4.1`: **Emergency Food Support Workflow** — User sets location, filters food, sorts by distance, checks closest pantry hours and eligibility.
- `T4.2`: **Low-Vision Healthcare Seeking Workflow** — User enables high contrast & extra large text, searches for clinic, retrieves phone contact.
- `T4.3`: **Multi-Service Support Workflow** — User checks shelter availability, then navigates to legal aid for tenant eviction defense.
- `T4.4`: **Mobile Screen / Compact Navigation Workflow** — User switches list/map view, opens marker detail modal, closes modal.

---

## Test Runner Execution

The test suite can be run via npm or directly via Node:

```bash
# Run via npm test script
npm test

# Run via npm explicit script
npm run test:e2e

# Run directly via Node with type stripping
node --experimental-strip-types tests/e2e/run-e2e.js
```

---

## Data & Interface Contracts

The test suite validates compliance with contracts defined in `PROJECT.md`:
1. **Data Engine Interface** (`src/services/resourceService.ts`):
   - `searchResources(query, category, tags, userLocation, sortBy)`
   - `getResourceById(id)`
   - `calculateDistance(lat1, lon1, lat2, lon2)`
2. **Accessibility State** (`src/hooks/useAccessibility.ts`):
   - `contrastMode`, `textSize`, `toggleContrast()`, `setTextSize()`
3. **DOM Contracts**:
   - `data-contrast="standard" | "high-contrast"`
   - `data-text-size="normal" | "large" | "extra-large"`
   - `data-view-mode="list" | "map"`
   - `data-modal-open="true" | "false"`
