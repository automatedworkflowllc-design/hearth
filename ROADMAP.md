# Hearth roadmap

This is the working backlog for product and operations. It is not a promise of coverage. Items move only when a real source, review process, and honest UI exist.

Live site: <https://automatedworkflowllc-design.github.io/hearth/>  
Directory health: <https://hearth-directory.automaticworkflowllc.workers.dev/health>

## Now — product quality

- Keep the national ZIP-first search calm and honest (no “0 resources” before a location is chosen).
- Preserve accessibility: high-contrast, text size, Quick Exit, crisis numbers without JavaScript.
- Review copy for leftover “always / verified / complete” claims after each UI change.

## Next — coverage that still does not exist

These gaps are product-defining. Do not fake them with demo rows.

| Need | Status | Likely path |
|---|---|---|
| Emergency shelter & housing | **Not in the national index** | 211 National Data Platform (permissioned) or a similarly accountable source |
| Legal aid | **Not in the national index** | 211 or a first-party legal-aid directory with review |
| Hours, phones, eligibility for EPA pantries | **Missing from upstream** | Do not invent; keep “check the site / Hunger Hotline” |
| Languages & wheelchair access | **Only when the source documents them** | Facets already hide when metadata is absent |

## Later — operations

- 211 (or equivalent) access request and server-side credentials — never `VITE_*`.
- Tighter nearby ranking so a Gainesville ZIP is not dominated by 60–75 mile listings without explanation.
- i18n UI only after listings carry reviewed language fields.
- Independent review of high-stakes local records in `VERIFIED-ORGS.md`.

## Explicitly out of scope until the data is real

- A “verified” badge without a review date and named source.
- Open-now filters without current hours.
- Analytics, accounts, or tracking pixels.
- `feedam.org` as a national feed (rejected; see [DATA-SOURCES.md](./DATA-SOURCES.md)).

## How work is tracked

GitHub issues use the templates in `.github/ISSUE_TEMPLATE/`. Bugs, enhancements, and listing corrections are separate so a wrong phone number is not buried in a design thread.
