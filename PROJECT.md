# Hearth project guide

Hearth is a React + Vite community-resource finder being prepared for national U.S. coverage.
The bundled data remains an honestly labeled Gainesville, Florida demonstration until a protected
national directory service is connected.

## Architecture

- `src/providers/resourceProvider.ts`: query-based provider seam. The static provider searches the
  bundled demo; the national provider calls the configured Hearth proxy.
- `src/hooks/useResources.ts`: abortable provider-query lifecycle and result/facet state.
- `src/types/index.ts`: structured contacts, sources, review state, language/accessibility metadata,
  and the search request/response contract.
- `src/services/resourceService.ts`: client-side search/filter/sort for the small demo provider.
- `src/services/dataQuality.ts`: review-state, review-queue, and honest-facet logic.
- `src/hooks/useGeolocation.ts`: opt-in GPS, local demo ZIP centroids, and coordinate-free national
  ZIP searches.
- `src/components/`: responsive UI, crisis actions, filters, list/map, resource details, corrections,
  and accessibility controls.
- `src/data/resources.ts`: 11 source-backed Gainesville demonstration records.

The public browser must never receive an upstream directory credential. Configure only the Hearth
proxy URL with `VITE_HEARTH_API_BASE_URL`.

## Product and operations

- [README.md](./README.md): product overview and honest limitations.
- [NATIONAL-SERVICE.md](./NATIONAL-SERVICE.md): national source stack and API contract.
- [DATA-OPERATIONS.md](./DATA-OPERATIONS.md): publication, review, and correction runbook.
- [DESIGN.md](./DESIGN.md): visual system and interaction guidance.
- [VERIFIED-ORGS.md](./VERIFIED-ORGS.md): local demo provenance.

## Run and verify

```bash
npm install
npm run dev
npm test
npm run build
```

GitHub Pages deployment remains a static frontend. National operation therefore requires a
separately hosted directory API with appropriate data-provider permission, caching, monitoring,
and review operations.
