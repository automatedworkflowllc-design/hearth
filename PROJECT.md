# Hearth project guide

Hearth is a React + Vite community-resource finder expanding toward national U.S. coverage.
The public build now connects to a protected national health-center pilot; the bundled Gainesville
records remain the local-development fallback.

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
- `worker/`: Cloudflare Worker search API and D1 schema.
- `scripts/import-hrsa.mjs`: batched import for 18,885 active HRSA health-center sites.
- `scripts/import-zcta.mjs`: batched import for 33,791 Census ZIP centroids.

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

GitHub Pages remains the static frontend; the deployed Cloudflare Worker/D1 service supplies the
national health-center pilot. Broader operation still requires additional permitted data sources,
monitoring, and review operations.
