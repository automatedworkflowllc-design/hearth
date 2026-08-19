# Hearth

**A calm, honest place to find help.** Hearth is being built as a national directory of food,
shelter, health, legal, and community-support resources for people who may be under stress.

**Live demo:** <https://automatedworkflowllc-design.github.io/hearth/>  
**Nearby example (Gainesville ZIP in the link):** <https://automatedworkflowllc-design.github.io/hearth/?zip=32601>

> The public build connects to nationwide HRSA health-center, SAMHSA behavioral-health,
> EPA/Hunger Free America food-assistance, and seasonal USDA SUN Meals layers, positioned with
> Census ZIP data. Shelter, housing, legal, and broader community-support coverage is still being
> added; Hearth directs people to 211 rather than implying those categories are complete.

## Why this exists

Hearth began as an AI-generated application and became a forensic rebuild. The original output is
preserved at the `as-generated` tag. The rebuild's governing rule is simple: the app may only claim
what it can back up. In a crisis-facing directory, a fake phone number or false “verified” badge is
harm, not polish.

The audit found:

- 13 invented organizations with `555` phone numbers;
- a hardcoded “near me” control and no implemented map;
- accessibility controls that were not connected;
- a claimed test suite that did not actually render the app.

The rebuild replaced those facades with source-backed demonstration records, opt-in GPS and ZIP
search, a working map, real high-contrast/text-size controls, structured contact methods,
source-level review states, and an honest automated test suite.

## National architecture

The browser uses a query-based provider. It never needs to download a national dataset or contain
provider credentials:

```ts
interface ResourceProvider {
  readonly id: string;
  readonly label: string;
  readonly coverage: 'local-demo' | 'national';
  search(request: ResourceSearchRequest): Promise<ResourceSearchResponse>;
}
```

- With no API configuration, `staticProvider` queries the reviewed Gainesville demonstration data.
- With `VITE_HEARTH_API_BASE_URL`, the app queries
  `GET /v1/resources/search` on the protected Hearth directory service.
- National ZIPs are sent to that service for nearby matching; GPS remains strictly opt-in.
- National need filters distinguish year-round food pantries and kitchens from kids' summer
  meals, medical care, mental health, substance-use treatment, and detox.
- Language and accessibility filters appear only when the provider supplies reviewed metadata.

The backend implementation includes a Cloudflare Worker/D1 search service, an 18,885-site HRSA
importer, a 19,362-facility deduplicated SAMHSA importer, a guarded 6,134-location
EPA/Hunger Free America pantry-and-kitchen importer, a guarded 49,298-site 2026 USDA summer-meals
importer, and 33,791 Census ZIP centroids. Seasonal date windows keep only currently operating
summer meal sites visible. See
[FREE-NATIONAL-BACKEND.md](./FREE-NATIONAL-BACKEND.md) for setup,
[NATIONAL-SERVICE.md](./NATIONAL-SERVICE.md) for the source strategy, and
[DATA-OPERATIONS.md](./DATA-OPERATIONS.md) for review cadence and corrections.

## Data trust

Each resource can contain:

- multiple typed contact methods (phone, SMS, website, chat, intake, email);
- named official/government/directory sources;
- reviewed-at and review-due dates;
- an exception note when a critical detail is not directly confirmed;
- explicitly documented language and accessibility metadata.

The interface does not translate missing metadata into a claim. Details that can change quickly
carry “call before traveling” guidance, and every detail view has an account-free correction link.

The current local source record is [VERIFIED-ORGS.md](./VERIFIED-ORGS.md).
The working backlog is [ROADMAP.md](./ROADMAP.md). How to contribute is in
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Tech

React 18 · TypeScript · Vite · Tailwind · React-Leaflet · Vitest + Testing Library

## Run

```bash
npm install
npm run dev
npm test
npm run build
```

Optional environment:

```bash
VITE_HEARTH_API_BASE_URL=https://directory.example.org
VITE_RESOURCE_REPORT_EMAIL=automatedworkflowllc@gmail.com
```

Do not place upstream provider secrets in `VITE_*` variables. They are embedded in public browser
JavaScript.

## Honest limitations

- The deployed service provides national proximity search across HRSA health centers, SAMHSA
  behavioral-health facilities, an EPA-republished 2024 Hunger Free America food-assistance
  snapshot, and currently operating USDA summer meal sites for children. The bundled Gainesville
  dataset remains the development fallback when the national API is not configured.
- The EPA food layer does not include hours, phones, or eligibility and EPA does not guarantee
  its accuracy or completeness. Hearth only publishes direct pantry and kitchen records with a
  usable website and tells people to check before traveling. It is useful coverage, not a claim
  that every pantry is included or currently open.
- Production is checked every six hours. Guarded EPA, USDA, HRSA, and SAMHSA refreshes refuse
  suspicious upstream datasets before touching production.
- Records change. Hearth shows review status but is not an emergency dispatch service. The product
  directs people to 211 for current community referrals, 988 for crisis support, and 911 for
  immediate danger.
- The map loads OpenStreetMap tiles, so its tile server sees the visitor's IP address. Resource
  markers, not the user's precise location, determine the requested map viewport.

## License

Released under the [MIT License](./LICENSE).
