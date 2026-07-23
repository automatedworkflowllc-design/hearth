# Community Resource Hub

A React + Vite single-page app for discovering local community support resources
(food pantries, shelters, health clinics, legal aid). **This repo is a teardown /
rebuild case study**: it was first produced end-to-end by an automated agent coding
system (captured untouched at the `as-generated` git tag), then audited and is being
rebuilt honestly. See the audit + milestone plan referenced at the bottom.

> **Status:** demo. Listings are illustrative sample data, not a verified live
> directory. The app shows an in-product disclaimer pointing to 211 / 988.

## Architecture (what actually exists in `src/`, as of the M1 honesty reset)
- `components/`: `Layout`, `Navbar`, `Header`, `Footer`, `FilterPanel`, `ResourceCard`,
  `ResourceDetailModal`. (No map component yet — see plan M2. No accessibility toolbar
  yet — see plan M3.)
- `services/resourceService.ts`: client-side search/filter/sort + a Haversine
  `calculateDistance` (the distance-sort path is not yet wired into the UI — plan M2).
- `data/resources.ts`: sample dataset (currently fabricated placeholder data — being
  replaced with verified real resources in plan M2).
- `hooks/useAccessibility.ts`: contrast / text-size state hook (present but **not yet
  wired into the rendered UI** — plan M3).
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
- Detail view with full info + contact links: **yes** (map markers: not yet — M2).
- Fully responsive: **largely**, pending the M3/M4 accessibility + styling pass.
- Reusable components + automated tests for search/filter: **partial** — real unit tests
  are being (re)built in plan M3; the original agent-written E2E suite was test theater
  (it never rendered the app and failed 18/20) and has been removed.

## Provenance
- `as-generated` tag = unmodified agent output (contains its original, partly-false docs).
- Audit (15 confirmed findings) + 5-milestone rebuild plan live in the developer's
  workspace archive; a public case-study README is produced in the final milestone.
