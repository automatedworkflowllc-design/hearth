# Low-cost national backend

Hearth can serve real nationwide records without buying a commercial directory platform. The
initial stack is:

- the existing GitHub Pages frontend;
- a Cloudflare Worker exposing `GET /v1/resources/search`;
- Cloudflare D1 for the normalized public directory;
- HRSA's daily national health-center CSV as the first authoritative layer;
- SAMHSA's official national mental-health and substance-use treatment directories;
- EPA's republished Hunger Free America food-pantry and soup-kitchen layer;
- USDA's official seasonal SUN Meals Site Finder layer for free meals for children;
- U.S. Census ZCTA centroids for ZIP-to-nearby search;
- the 211 National Data Platform free trial as the next, broader community-services source.

This is an alpha data stack, not a claim that every Hearth category has national coverage.

Production API: <https://hearth-directory.automaticworkflowllc.workers.dev>

## Why Cloudflare D1

The free plan currently provides 100,000 Worker requests per day, 5 million D1 rows read per day,
100,000 rows written per day, and 5 GB of D1 storage. Index writes count toward the write allowance.
Hearth's public search traffic fits comfortably, but a full 49,298-site USDA refresh writes about
443,000 table-and-index rows. Automated weekly USDA refreshes therefore require Workers Paid
(minimum monthly platform charge; D1 includes 50 million writes per month) or a future delta-import
optimization. The current account accepted the production load and continued serving queries,
consistent with Paid-plan limits.

Official limits:

- <https://developers.cloudflare.com/workers/platform/limits/>
- <https://developers.cloudflare.com/workers/platform/pricing/#d1>

## What is implemented

- `worker/src/index.ts` validates and bounds public queries, resolves ZIP centroids, performs
  parameterized D1 searches, calculates distances, and returns Hearth's existing resource schema.
- `worker/migrations/0001_initial.sql` creates the resource, ZIP-centroid, and import-audit tables;
  `0002_structured_contacts.sql` adds source-backed phone and intake contact arrays; and
  `0003_availability_window.sql` adds date-window enforcement for seasonal programs.
- `scripts/import-hrsa.mjs` converts the official HRSA CSV into an idempotent D1 import. Missing
  records are tombstoned instead of silently deleted.
- `scripts/import-samhsa.mjs` reads the two official Excel directories and their service-code
  tabs, merges exact cross-directory locations, preserves intake lines, and generates a guarded
  idempotent import. Listings without a public street address are intentionally omitted.
- `scripts/import-usda-summer-meals.mjs` resolves USDA’s current official ArcGIS app and layer,
  validates site status, program, service model, location, season, dates, and meal schedule,
  excludes explicit test records, and preserves exact published coordinates and operating dates.
- `scripts/import-epa-food-assistance.mjs` imports direct pantries and kitchens from EPA's
  republished Hunger Free America layer, requires complete locations and usable websites, and
  excludes food banks and unsafe records.
- Imported HRSA, SAMHSA, EPA, and USDA listings are clearly marked as source-backed exceptions,
  not independently verified Hearth records.

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

Download the official SAMHSA directories and generate the deduplicated behavioral-health import:

```powershell
Invoke-WebRequest `
  -Uri "https://www.samhsa.gov/data/sites/default/files/reports/rpt57009/2025_SU_Facilities_for_All_City_All.xlsx" `
  -OutFile ".\work\samhsa-substance-use.xlsx"
Invoke-WebRequest `
  -Uri "https://www.samhsa.gov/data/sites/default/files/reports/rpt57010/2025_MH_Facilities_for_All_City_All.xlsx" `
  -OutFile ".\work\samhsa-mental-health.xlsx"
npm run directory:ingest:samhsa -- `
  --substance-use=".\work\samhsa-substance-use.xlsx" `
  --mental-health=".\work\samhsa-mental-health.xlsx" `
  --output="worker\data\samhsa.sql"
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

Resolve USDA’s current official summer-meals layer and generate the guarded seasonal import:

```powershell
npm run directory:ingest:usda-summer-meals -- `
  --output="worker\data\usda-summer-meals.sql"
```

Generate the guarded year-round pantry and kitchen import:

```powershell
npm run directory:ingest:epa-food -- `
  --output="worker\data\epa-food-assistance.sql"
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
npx wrangler d1 execute hearth-directory --local `
  --config worker\wrangler.jsonc `
  --file worker\data\usda-summer-meals.sql
npx wrangler d1 execute hearth-directory --local `
  --config worker\wrangler.jsonc `
  --file worker\data\epa-food-assistance.sql
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
3. Generate current Census, HRSA, SAMHSA, EPA food-assistance, and USDA SUN Meals imports and load
   each with `npx wrangler d1 execute hearth-directory --remote --config worker/wrangler.jsonc --file <generated-file>`.
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
- `.github/workflows/refresh-samhsa.yml` checks the official directory workbooks monthly, requires
  15,000–25,000 deduplicated public-address facilities and a fully recognized service codebook,
  then applies the import and tests a known-good behavioral-health search.
- `.github/workflows/refresh-usda-summer-meals.yml` runs weekly from May through October, resolves
  the layer from USDA’s official site-finder app, requires 30,000–80,000 clean sites across at
  least 45 state/territory codes, and tests current food results during June–August.
- `.github/workflows/refresh-epa-food-assistance.yml` runs monthly, requires 4,000–8,000 direct
  locations across at least 45 state/territory codes, and refuses to import a collapsed pantry or
  soup-kitchen layer.
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
2. Expand year-round food beyond the implemented EPA snapshot, then add permitted legal-aid,
   shelter, and housing source adapters.
3. Measure zero-result rates by ZIP and category before changing Hearth's coverage language.
