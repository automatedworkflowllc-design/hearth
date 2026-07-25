# Live data sources for the ResourceProvider — verified 2026-07-25

Research for making the `ResourceProvider` seam real (a live feed instead of the bundled
Gainesville dataset). 48 candidates were scouted and each was then **adversarially verified by
actually hitting the endpoint or the pricing page** — not trusted from a docs blurb.

## The headline

**There is no single free, national, all-category source.** The good aggregated directories are
the product being sold, so they are gated:

| Source | Reality |
|---|---|
| findhelp (Aunt Bertha) | **Paid.** Annual subscription, no public price list, no free tier. |
| Unite Us | **Paid** enterprise. No pricing published, no free tier. |
| iCarol (the RDMS most 211s actually run) | **Paid** add-on to a subscription. No free tier. |
| 211 National Data Platform (United Way) | **Needs approval.** Free for a 211 to use internally; third-party production access is not open signup. |
| Regional / state 211 open data feeds | **Essentially do not exist.** Searched hard; the only open 211 datasets are *call statistics*, not service directories. |

So a live Hearth cannot be "plug in the 211 API." It has to be assembled.

## What IS genuinely free and keyless (verified live)

All of these returned real data to an unauthenticated request during verification.

| Source | Category | Notes |
|---|---|---|
| **SAMHSA FindTreatment locator** — `findtreatment.gov/locator/exportsAsJson/v2` | Substance use + mental health | Verified live: a Gainesville query returned 21 real facilities. Best free source for behavioral health. |
| **HRSA health centers / FQHCs** — `data.hrsa.gov/data/download` | Health | Bulk CSV/XLSX, HTTP 200 verified. Includes **sliding-fee-scale** clinics — exactly the right population for a crisis finder. |
| **HUD Housing Counseling agencies** — `data.hud.gov/Housing_Counselor/searchByLocation` | Housing (advisory) | Verified live for Gainesville. Counseling only — **not emergency beds**. |
| **USDA SNAP retailers** — ArcGIS FeatureServer | Food retail | 253,894 records. See the caution below. |
| **USDA Summer Meals sites** — bulk CSV | Free food for children | 49,836 rows, verified 17 MB download. Seasonal. |
| **IRS EO Business Master File** (+ ProPublica Nonprofit Explorer API) | Org registry | Free, no key. Confirms an org is a real registered nonprofit — a *validation* layer, not a service directory. |
| **Open Referral UK** — 10 council feeds | Multi | Real, live, continuously compliance-tested HSDS 3.0. **UK only** — useful as a reference implementation, not for US data. |

## Two cautions that matter for a crisis app

**1. "Accepts EBT" ≠ "free food."** The USDA SNAP retailer file is mostly corner stores and gas
stations. Showing it raw would send a hungry person to a convenience store expecting help. It must
be filtered, or used only as a supplementary layer.

**2. Do not use `feedam.org` ("Feed America").** It looks like the jackpot — free, no key, US-wide,
real HSDS 3.0, 310k locations — and the endpoint genuinely works. It was **refuted on data-integrity
and licensing grounds**, with specifics:
- **Freshness is fake.** `assured_date` is a batch-import stamp, not per-record verification: 200
  sampled records shared an identical `assured_date` *and* `last_modified` to the second.
- **Org modelling is broken.** Houston Food Bank, North Texas Food Bank and Capital Area Food Bank —
  three unrelated nonprofits — all sit under one `organization_id`.
- **Junk and category contamination.** One organization is literally named `"transport" vehicle`
  with an FQHC description; elementary schools appear as food-assistance locations.
- **No third-party corroboration.** No IRS 990 filings on record; NTEE code is K99
  (philanthropy/other), not food; the claimed adoption by findhelp / United Way / Unite Us is
  self-published marketing with no independent trace. The name and domain shadow the far larger
  *Feeding America*.

For a product whose entire brand is that its listings are true, this fails the bar. Noted here so
nobody rediscovers it and thinks it is a shortcut.

## The honest gaps

- **Emergency shelter beds** — no free programmatic national source. HUD's HIC/PIT data is
  statistical (counts for reporting), not a bookable/visitable directory. This is the hardest gap.
- **Legal aid** — LSC publishes grantee info but only as an address/ZIP lookup page, not a usable
  feed, and it covers only LSC-funded orgs.

## Recommended shape

A **layered provider**, which is what the seam was built for:

1. **Verified local data** (today's Gainesville set) — highest quality, human-checked, dated.
2. **Federal category feeds** — HRSA (health), SAMHSA (behavioral health), HUD (housing counseling),
   USDA (food) for national baseline coverage.
3. **HSDS feeds** where a region publishes one.

Rule to carry over from the rest of this project: **never show a "verified" date we did not earn.**
Federal records get a "source: HRSA, updated <file date>" provenance line — not a verification claim.
