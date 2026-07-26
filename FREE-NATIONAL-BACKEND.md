# Free national backend

Hearth can begin serving real nationwide records without a paid platform. The initial stack is:

- the existing GitHub Pages frontend;
- a Cloudflare Worker exposing `GET /v1/resources/search`;
- Cloudflare D1 for the normalized public directory;
- HRSA's daily national health-center CSV as the first authoritative layer;
- U.S. Census ZCTA centroids for ZIP-to-nearby search;
- the 211 National Data Platform free trial as the next, broader community-services source.

This is an alpha data stack, not a claim that every Hearth category has national coverage.

Production API: <https://hearth-directory.automaticworkflowllc.workers.dev>

## Why Cloudflare D1

The free plan currently provides 100,000 Worker requests per day, 5 million D1 rows read per day,
100,000 rows written per day, and 5 GB of D1 storage. Unlike the Supabase free plan, it does not
pause the database after a week without traffic. Hearth's public directory query is a good fit for
those limits while the service is young.

Official limits:

- <https://developers.cloudflare.com/workers/platform/limits/>
- <https://developers.cloudflare.com/workers/platform/pricing/#d1>

## What is implemented

- `worker/src/index.ts` validates and bounds public queries, resolves ZIP centroids, performs
  parameterized D1 searches, calculates distances, and returns Hearth's existing resource schema.
- `worker/migrations/0001_initial.sql` creates the resource, ZIP-centroid, and import-audit tables.
- `scripts/import-hrsa.mjs` converts the official HRSA CSV into an idempotent D1 import. Missing
  records are tombstoned instead of silently deleted.
- Imported HRSA listings are clearly marked as source-backed exceptions, not independently
  verified Hearth records.

## Local proof

Download the current HRSA CSV:

```powershell
Invoke-WebRequest `
  -Uri "https://data.hrsa.gov/DataDownload/DD_Files/Health_Center_Service_Delivery_and_LookAlike_Sites.csv" `
  -OutFile ".\work\hrsa-health-centers.csv"
```

Generate an import file:

```powershell
npm run directory:ingest:hrsa -- `
  --input=".\work\hrsa-health-centers.csv" `
  --output="worker\data\hrsa.sql"
```

Download and extract the Census ZCTA Gazetteer, then generate the ZIP-centroid import:

```powershell
Invoke-WebRequest `
  -Uri "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gaz_zcta_national.zip" `
  -OutFile ".\work\2025-zcta.zip"
Expand-Archive ".\work\2025-zcta.zip" ".\work\2025-zcta"
npm run directory:ingest:zcta -- `
  --input=".\work\2025-zcta\2025_Gaz_zcta_national.txt" `
  --output="worker\data\zcta.sql"
```

Create and migrate the local D1 database:

```powershell
npm run directory:migrate:local
npx wrangler d1 execute hearth-directory --local `
  --config worker\wrangler.jsonc `
  --file worker\data\hrsa.sql
npx wrangler d1 execute hearth-directory --local `
  --config worker\wrangler.jsonc `
  --file worker\data\zcta.sql
npm run directory:dev
```

Then test:

```text
http://127.0.0.1:8787/v1/resources/search?zip=32601&category=health
```

## Production deployment and maintenance

The production database and Worker were created on July 26, 2026. For future changes:

1. Run `npx wrangler login` if the workstation is not authenticated.
2. Apply new migrations with `npx wrangler d1 migrations apply hearth-directory --remote --config worker/wrangler.jsonc`.
3. Generate current Census/HRSA imports and load each with `npx wrangler d1 execute hearth-directory --remote --config worker/wrangler.jsonc --file <generated-file>`.
4. Deploy Worker changes with `npx wrangler deploy --config worker/wrangler.jsonc`.
5. Keep `VITE_HEARTH_API_BASE_URL` set to the production API URL during the frontend build.

Do not place a 211 or HRSA web-service token in any `VITE_*` variable. Later provider credentials
belong in Worker secrets.

### Automated checks and refreshes

- `.github/workflows/production-monitor.yml` runs every six hours and checks the public page,
  database-backed health response, CORS policy, a known-good ZIP search, and invalid-input handling.
- `.github/workflows/refresh-directory.yml` runs every Monday: it downloads the official HRSA CSV,
  refuses to continue if fewer than 15,000 active rows normalize successfully, applies the
  idempotent import to D1, and reruns the production monitor.
- The refresh workflow requires a scoped `CLOUDFLARE_API_TOKEN` repository secret and a
  `CLOUDFLARE_ACCOUNT_ID` repository variable. The token should be limited to the Hearth
  Cloudflare account and only the permissions Wrangler needs to edit D1.
- `GET /health` returns live active-resource and ZIP-centroid counts plus the latest completed
  import. It returns HTTP 503 when data is missing or the latest import is more than 14 days old.

Run the same monitor from a workstation with:

```powershell
npm run check:production
```

## Broader free data sequence

1. Request the 211 National Data Platform free trial at <https://apiportal.211.org/get-started-overview>.
2. Add SAMHSA behavioral-health and other federal category adapters.
3. Measure zero-result rates by ZIP and category before changing Hearth's coverage language.
