# Contributing to Hearth

Hearth is a crisis-facing directory. A wrong phone number or a false “verified” badge is harm, not polish. The governing rule: **the app may only claim what it can back up.**

## Before you write code

1. Read [README.md](./README.md) for product scope and honest limitations.
2. Read [DESIGN.md](./DESIGN.md), especially **Hard-won gotchas** (token opacity, Quick Exit, contrast).
3. Check [ROADMAP.md](./ROADMAP.md) so the change matches the current priority.

## Local setup

```bash
npm install
npm run dev
npm test
npm run build
```

Without `VITE_HEARTH_API_BASE_URL`, the app uses the reviewed Gainesville demonstration data. That is intentional.

## Pull requests

Use the PR template. Keep diffs focused. Do not “improve” distance to a decimal place, do not invent coverage for shelter/housing/legal aid, and do not add analytics.

If a listing is wrong, prefer a [listing-correction issue](./.github/ISSUE_TEMPLATE/listing-correction.md) or the in-app “Report outdated information” link over silently editing national import scripts unless you are changing the importer itself.
