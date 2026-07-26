# National service plan

Hearth's product goal is national: anyone in the United States should be able to enter a ZIP
code or opt into location and find relevant help. The bundled Gainesville records remain a
demonstration dataset until a production directory service is connected.

## What now exists

The browser no longer assumes it can download every resource. It uses a bounded, query-based
provider contract:

```text
Browser
  -> GET /v1/resources/search?q=&category=&zip=&lat=&lng=&limit=&cursor=
  -> Hearth directory service
       -> normalized, deduplicated search index
       -> source adapters and review queue
```

Set `VITE_HEARTH_API_BASE_URL` to the public URL of the Hearth directory service. The browser
then uses the national provider automatically. Without that variable, it uses the honest
Gainesville demonstration provider.

Provider credentials must stay in the directory service. Never place a 211, HRSA, or other
secret in a `VITE_*` variable: Vite embeds those variables in public browser JavaScript.

The first directory-service implementation now lives in `worker/`:

- a Cloudflare Worker exposes the existing `GET /v1/resources/search` contract;
- D1 migrations create normalized resource, ZIP-centroid, and import-audit tables;
- the HRSA adapter imports 18,885 active national health-center sites from the current daily CSV;
- the SAMHSA adapter merges the official mental-health and substance-use directories into 19,362
  public-address facilities with decoded services and structured phone/intake contacts;
- the Census adapter imports 33,791 official 2025 ZCTA centroids for no-cost nearby ZIP search;
- every imported result retains government provenance and is labeled as not independently
  confirmed by Hearth.

The complete no-cost setup and deployment procedure is in `FREE-NATIONAL-BACKEND.md`. The
production service is deployed at
<https://hearth-directory.automaticworkflowllc.workers.dev>; the public frontend identifies it as
a national health-center pilot rather than implying complete multi-category coverage.

## Recommended national source stack

No single public source has reliable, real-time coverage of every Hearth category. Use a layered
index with source-specific adapters and transparent provenance.

1. **211 National Data Platform — primary community-services backbone.** Its V2 APIs expose
   Search, Query, and Export capabilities and report broad U.S. coverage. Production access is
   permissioned, so Hearth needs an approved account and a server-side credential.
   - <https://apiportal.211.org/>
   - <https://apiportal.211.org/get-started-overview>
   - <https://register.211.org/Home/FAQs>
2. **HRSA health-center data — authoritative health supplement.** HRSA publishes downloadable
   Health Center Service Delivery Sites data, refreshed daily, and also offers registered web
   services.
   - <https://data.hrsa.gov/topics/health-centers>
   - <https://data.hrsa.gov/tools/web-services>
3. **SAMHSA national directories — implemented behavioral-health supplement.** The N-SUMHSS
   public-use research file does not expose the facility names, addresses, or phone numbers Hearth
   needs for listings. SAMHSA's official 2025 mental-health and substance-use Excel directories
   do include those contact details and service codes. Hearth imports those workbooks, merges exact
   locations across both directories, omits records whose public street address is withheld, and
   uses ZIP centroids only as disclosed approximate map positions. Treat the result as an annual,
   facility-reported snapshot and verify details before travel.
   - <https://www.samhsa.gov/data/data-we-collect/n-sumhss-national-substance-use-and-mental-health-services-survey/national-directories>
   - <https://www.samhsa.gov/data/data-we-collect/n-sumhss-national-substance-use-and-mental-health-services-survey/datafiles/2024>
4. **Legal Services Corporation — legal-aid seed and reconciliation source.** LSC reports
   129 funded organizations and more than 800 offices nationwide. Ingest office data only from
   a permitted structured source or an explicit partner export; do not scrape a consumer site
   in production.
   - <https://www.lsc.gov/about-lsc/what-legal-aid>

Seasonal or program-specific federal sources can enrich the index but should not be presented as
complete national coverage for a category.

## Search API contract

`GET /v1/resources/search` accepts:

- `q`, `category`, repeated `tag`
- either `zip` or `lat` + `lng`
- `sort` (`relevance`, `name`, `distance`)
- `language`, `wheelchair`
- `limit` (maximum 100), opaque `cursor`

It returns:

```json
{
  "resources": [],
  "total": 0,
  "facets": {
    "languages": [],
    "hasWheelchairData": false
  },
  "nextCursor": null,
  "generatedAt": "2026-07-25T00:00:00Z"
}
```

Each resource uses the shared `Resource` schema in `src/types/index.ts`, including structured
contact methods, provenance, review dates, languages, and accessibility. Facets are returned only
for metadata the service actually has; the UI therefore does not invent language or accessibility
filters.

## Ingestion and deduplication

Normalize every source into a staging record, retain the source record ID and fetched timestamp,
then reconcile in this order:

1. exact source-system identifier;
2. normalized phone or website domain plus ZIP;
3. normalized name plus street address;
4. manual review for possible matches below the automatic confidence threshold.

Never silently overwrite conflicting phone, eligibility, or hours fields. Keep both source values,
choose the displayed value through a documented source-precedence rule, and create a review task.

## Production sequence

1. Authenticate Wrangler to the project's free Cloudflare account and deploy the implemented
   Worker/D1 service.
2. Load the implemented Census, HRSA, and SAMHSA adapters, then connect the public frontend.
3. Obtain permission and credentials for the 211 National Data Platform and add it as the broader
   community-services source.
4. Add a permitted LSC supplement and implement the review workflow in `DATA-OPERATIONS.md`.
5. Run a pilot across several urban, rural, and tribal ZIP codes before making a national-coverage
   claim.
6. Monitor query failures, zero-result ZIPs, stale records, and correction turnaround.

The frontend and first backend implementation are deployed. Broad multi-category coverage still
depends on approved 211 access and a staffed review process.
