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
3. **SAMHSA facility data — behavioral-health supplement.** The public N-SUMHSS files include
   national facility location and service data. Treat each release as a dated snapshot.
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

1. Obtain permission and credentials for the 211 National Data Platform.
2. Build the directory service and a scheduled ingestion worker in a private backend repository.
3. Load 211 plus HRSA/SAMHSA/LSC supplements into a geospatial search index.
4. Implement the review and correction workflow in `DATA-OPERATIONS.md`.
5. Run a pilot across several urban, rural, and tribal ZIP codes before making a national-coverage
   claim.
6. Configure `VITE_HEARTH_API_BASE_URL`, deploy the frontend, and monitor query failures,
   zero-result ZIPs, stale records, and correction turnaround.

The frontend implementation is ready for that service. The remaining blocker is operational:
approved national data access plus a protected backend and review process.
