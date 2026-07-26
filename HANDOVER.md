# Hearth — handover

Written 2026-07-25 for a reviewer with no prior context. Everything below was verified against
the repo at commit `895f850`, not recalled.

---

## 1. What this is

**Hearth** is a local resource finder for people in crisis — food, shelter, health care, legal aid.
It is also a **case study**: the first version was generated end-to-end by an AI agent in about an
hour, and this repo is the forensic audit of that output plus the honest rebuild that followed.

The original, untouched agent output is preserved at the git tag **`as-generated`** — diff against
it to see exactly what changed and why.

- **Live:** https://automatedworkflowllc-design.github.io/hearth/
- **Repo:** https://github.com/automatedworkflowllc-design/hearth (public, MIT)

The audience is the thing that drives every decision: someone looking for a shelter bed at 11pm.
For them a wrong phone number or a fake "verified" badge isn't a bug, it's harm. So the governing
rule of the whole project is **the app may only claim what it can back up.**

## 2. Current state (verified)

| | |
|---|---|
| Build | clean (`tsc && vite build`) |
| Tests | **40 passing / 9 files** |
| Lighthouse (mobile) | Accessibility **100**, Best Practices **100**, SEO **100** |
| Working tree | clean |
| **Unpushed** | **2 commits** — `afb9a27` (token sweep fixes) and `895f850` (DATA-SOURCES.md) |

⚠️ **The live site does not yet include the last two commits.** Everything through `60c6494` is
deployed. Pushing to `main` triggers the Pages workflow, which runs the test suite before deploying.

## 3. Read these first, in this order

| File | Why |
|---|---|
| `README.md` | The case study. Audit findings, the five milestones, the method. |
| `DESIGN.md` | The design system + **"Hard-won gotchas"** — read that section before touching any styling. |
| `DATA-SOURCES.md` | Verified research on live data feeds. Explains why the app is still on static data. |
| `VERIFIED-ORGS.md` | Source-of-record for the 11 real orgs, including disclosed verification exceptions. |
| `PROJECT.md` | Architecture as-built. |

## 4. Architecture in one minute

React 18 + TypeScript + Vite + Tailwind. No backend, no accounts, no tracking.

```
main.tsx → App.tsx → Layout (Navbar / Footer / QuickExit)
                   → Hero (owns the single <h1> + the search input)
                   → SafetyBar (911 / 988 / DV hotline)
                   → FilterPanel → ResourceCard[] | ResourceMap
                   → ResourceDetailModal
```

Data flows through one seam:

```
staticProvider  →  useResources(provider)  →  searchResources(..., resources)  →  UI
(ResourceProvider)     async boundary            filter / sort / distance
```

`ResourceProvider` (`src/providers/resourceProvider.ts`) is the scaling story: swapping the static
Gainesville dataset for a live national feed is one line at the composition root. `load()` is async
precisely so a network source needs no downstream change.

**Theming:** all colors are CSS custom properties in `src/index.css`, mapped to semantic Tailwind
names in `tailwind.config.js`. Two themes: standard (warm) and high-contrast (black/yellow/cyan).
The high-contrast mode is real — it repaints the UI chrome, it is not a filter.

## 5. The method used

Every milestone was hand-built, then put through an **adversarial multi-agent review** whose job was
to *disprove* the work: findings default to REFUTED and must be independently reproduced — with a
concrete failure scenario, and for contrast claims a recomputed WCAG ratio — to survive.

It repeatedly caught things a self-review waved through, including in the honesty features
themselves. A representative sample of confirmed, fixed defects:

- The map fit its viewport to the user's shared location, leaking their area to the tile server —
  while the UI copy said the location is never sent anywhere.
- The high-contrast toggle announced success but only applied a weak CSS filter.
- The map popup rendered white-on-white in high-contrast — a resource's name became invisible.
- Quick Exit hijacked a bare Escape, so closing a dialog ejected the user off the site.
- Tailwind opacity modifiers on `var()`-backed tokens emit invalid CSS that is silently dropped —
  the footer body text was rendering dark-on-dark.
- Category labels were contrast-checked only against the white card; on the black high-contrast card
  one was **1.91:1**.

The last two are the ones worth internalizing: **both were cases where my own code comment asserted
a justification that was incomplete or false.** The review caught the comment, not just the code.

## 6. Where I'd point a fresh reviewer

Honest list of where I think the risk actually is:

1. **`VERIFIED-ORGS.md` provenance.** This is real data about real organizations. Three Rivers Legal's
   phone came from third-party directories (their site blocked automated access) and is flagged
   pending a human confirmation call. **Nobody has made that call.** If any listing is wrong, a person
   in crisis reaches a dead line. This is the highest-stakes thing in the repo and it is data, not code.
2. **Copy that makes claims.** Grep for "verified", "free", "always", "no cost". Each one should be
   traceable to something we actually guarantee. We tightened these twice and still found leftovers.
3. **The high-contrast theme.** It has broken three separate times in ways that only appear when you
   toggle it *and* interact (hover a filter pill, open a map popup, open the modal). Automated tests
   do not catch this. Please toggle it and click around.
4. **`QuickExit`** — a life-safety feature for someone on a monitored device. It fires on 3× Escape
   within 1.5s and ignores auto-repeat. Worth a skeptical look for ways it fires accidentally, or
   fails to fire when needed.
5. **Distance/precision honesty.** Distances derive from ZIP centroids and are shown as `~N mi` on
   purpose. If anyone "improves" that to one decimal, it becomes a false precision claim.
6. **Whether the case study over-claims.** `README.md` is the artifact that brags about not
   overclaiming, which makes it the most dangerous file in the repo. It has been through one
   adversarial pass (8 findings, all confirmed and fixed). A second opinion is welcome.

## 7. Known gaps / open decisions

- **Not pushed:** the 2 commits above.
- **Live data is unbuilt.** `DATA-SOURCES.md` has the verified research: there is no free national
  all-category feed (findhelp/Unite Us/iCarol are paid, 211's platform needs approval). The realistic
  path is a layered provider — verified local data + free federal feeds (HRSA, SAMHSA, HUD, USDA).
  **Emergency shelter beds and legal aid have no usable free feed** — that gap is unsolved.
- **`feedam.org` is a trap.** It looks perfect (free, keyless, US-wide, HSDS 3.0) and was rejected on
  data-integrity grounds. Reasons are in `DATA-SOURCES.md` §2 — please read before "discovering" it.
- **No i18n.** The data has no language fields, so no multilingual UI was faked. Deliberate.
- **`llms.txt`** is the one Lighthouse item left failing; skipped as a speculative convention.

## 8. Running it

```bash
npm install
npm run dev      # dev server
npm test         # 40 tests
npm run build    # tsc + vite build
npm run preview  # serve the production build
```

Deploy is automatic: push to `main` → GitHub Actions runs `npm ci → npm test → npm run build` →
Pages. Config in `.github/workflows/deploy.yml`.

## 9. One request

If you disagree with something here, say so plainly — the entire value of this project is that its
claims survive scrutiny. A finding that kills a claim is worth more than a compliment.
