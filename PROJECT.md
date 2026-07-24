# Hearth

A React + Vite single-page app for discovering local community support resources
(food pantries, shelters, health clinics, legal aid). **This repo is a teardown /
rebuild case study**: it was first produced end-to-end by an automated agent coding
system (captured untouched at the `as-generated` git tag), then audited and is being
rebuilt honestly. See the audit + milestone plan referenced at the bottom.

> **Status:** demo (Gainesville, FL). Listings are real, recently-verified local
> resources shown as a demonstration — not a guaranteed-current live directory. The app
> shows an in-product disclaimer pointing to 211 / 988.

## Architecture (what actually exists in `src/`, as of M4b)
- `components/`: `Layout`, `Navbar`, `Header`, `Footer`, `FilterPanel`, `LocationControl`,
  `AccessibilityToolbar` (text-size + real high-contrast), `ResourceCard`, `ResourceMap` (react-leaflet),
  `ResourceDetailModal` (a real focus-trapped dialog).
- `services/resourceService.ts`: client-side search/filter/sort incl. distance sort + a
  Haversine `calculateDistance`; annotates `distanceMiles` when a user location is set.
- `data/resources.ts`: 11 real, verified Gainesville-area resources (source of record:
  `VERIFIED-ORGS.md`). `data/gainesvilleZips.ts`: offline ZIP centroids for the near-me fallback.
- `hooks/useGeolocation.ts`: opt-in geolocation (GPS + on-device ZIP), never fires on mount.
  `hooks/useAccessibility.ts`: **wired as of M3** — text-size controls apply/persist to `<html>`.
  (High-contrast tokens exist in index.css but aren't consumed by components yet, so that
  control is deferred to M4's token swap rather than shipped as a near-cosmetic filter.)
- `types/index.ts`: `Resource`, `Location`, `FilterOptions`, accessibility types.
- `tests/`: Vitest + Testing Library component tests.

## Actual interface (as implemented, not aspirational)
```ts
searchResources(
  query?: string,
  category?: string,
  cityFilter?: string,
  tags?: string[],
  userLocation?: Location,
  sortBy?: 'distance' | 'name' | 'relevance',
  dataset?: Resource[]
): Resource[]

getResourceById(id: string, dataset?: Resource[]): Resource | undefined
calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number
```
(The canonical signature may be refactored to an options object during the test rebuild;
this document will be updated from the code, never ahead of it.)

## Run
- `npm install`
- `npm run dev` — local dev server
- `npm run build` — typecheck + production build
- `npm test` — Vitest suite (curated; runs only `tests/**` and `src/**` specs)

## Honest status of the original acceptance criteria
- Builds cleanly (`npm run build`): **yes.**
- Search filters by keyword / tag / category: **yes.**
- Detail view with full info + contact links: **yes**; interactive map with markers +
  opt-in "near me" (GPS / on-device ZIP) + distance sort: **yes** (M2).
- Fully responsive: **largely**, pending the M3/M4 accessibility + styling pass.
- Reusable components + automated tests for search/filter: **yes** — 20 real Vitest tests
  (service unit tests, App integration, and accessibility wiring), all green from one
  command (`npm test`). The original agent-written E2E suite was test theater (it never
  rendered the app and failed 18/20) and was removed.

## Provenance
- `as-generated` tag = unmodified agent output (contains its original, partly-false docs).
- Audit (15 confirmed findings) + 5-milestone rebuild plan live in the developer's
  workspace archive; a public case-study README is produced in the final milestone.
