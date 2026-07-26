# Data operations

Hearth is only useful when people can trust its contact and access information. This runbook
defines how records become displayable and how they stay current.

## Display requirements

A resource may be published when it has:

- a stable Hearth ID, name, category, description, and service area or location;
- at least one structured contact method;
- at least one named source with a source URL;
- `reviewedAt`, `reviewDueAt`, and a review status;
- no unresolved conflict that could send a person to the wrong number or location.

Language and accessibility fields are optional. Omission means “not documented,” not “no.”

## Review states

- **Current:** review due date is more than 30 days away.
- **Due soon:** review due date is within 30 days.
- **Needs review:** review due date has passed.
- **Exception:** an important field lacks direct confirmation or sources conflict.
- **Unknown:** an imported record has not completed Hearth review.

The UI exposes these states instead of applying a generic “verified” badge.

## Suggested cadence

| Field or resource type | Maximum interval |
|---|---:|
| Crisis, shelter intake, domestic-violence, seasonal service | 30 days |
| USDA summer meal site feed during May–October | Weekly |
| Phone, SMS, intake URL, walk-in address, eligibility | 90 days |
| Standard service description and hours | 180 days |
| Stable organization identity | 365 days |
| Upstream government dataset | On each published refresh |

An upstream `updated_at` date is provenance, not proof that a person at the organization confirmed
the listing.

## Review procedure

1. Open every listed official or government source.
2. Compare organization name, service scope, contact methods, address, hours, eligibility, language,
   and access information.
3. Prefer the organization's current official page for operational details; retain conflicting
   directory data as evidence.
4. If the official source is inaccessible or ambiguous, make a direct confirmation call or mark
   the record as an exception with a plain-language note.
5. Record reviewer, timestamp, sources, changes, and the next due date.
6. Never infer wheelchair access or service language from photos, an address, or generic site copy.

## Correction reports

Every detail view includes “Report outdated information.” Reports should reach a monitored
directory-operations inbox without requiring an account.

Triage targets:

- wrong crisis or domestic-violence contact: immediately;
- disconnected number, incorrect address, closed program: within one business day;
- hours, eligibility, description, access metadata: within three business days.

The report link asks people not to include health, immigration, legal, housing, or other sensitive
personal details. Do not add free-form case-intake fields to this directory workflow.

For production, `VITE_RESOURCE_REPORT_EMAIL` may override the monitored inbox. The committed
fallback is `automaticworkflowllc@gmail.com`, confirmed by the project owner.

## Source outages and removals

- If one source is down, preserve the last known value, show its review state, and queue a retry.
- If a phone or address is contradicted by another authoritative source, hide the disputed action
  until reviewed.
- If an organization closes, preserve an internal tombstone and source evidence so a later import
  cannot resurrect the stale record.
- If a provider requests removal, verify the requester and retain only the minimal audit record.

## Metrics

Monitor:

- records current, due soon, overdue, exception, and unknown;
- median and 95th-percentile correction turnaround;
- disconnected-contact and wrong-address reports;
- zero-result rate by ZIP and category;
- duplicate rate by source;
- provider ingestion age and failed refreshes.

Do not use personal search histories for analytics. Aggregate operational metrics at a level that
cannot reconstruct an individual's help-seeking activity.
