# Hearth

**A calm, honest place to find local help.** Hearth is a directory of food, shelter, health, and legal resources for the Gainesville, FL area — built for people in crisis, so every claim it makes is one it can keep.

**Live demo:** https://automatedworkflowllc-design.github.io/hearth/

> **This repo is a case study, not just an app.** An AI agent generated the first version end-to-end in about an hour. This repository is the forensic audit of that output and the honest rebuild that followed — commit by commit, with the original preserved untouched at the [`as-generated`](../../releases/tag/as-generated) git tag so you can see exactly what changed and why.

---

## Why this exists

AI coding agents are astonishingly fast at producing something that *looks* finished. The interesting — and, for a crisis-facing app, safety-critical — question is what's actually behind the demo. Hearth is that question, answered in public:

1. Take a real, agent-generated app.
2. Audit it adversarially.
3. Rebuild it so that what it *shows* and what it *does* are the same thing.

The audience is people looking for a shelter bed or a domestic-violence hotline. For them, a fake phone number or a fake "verified" badge isn't a bug — it's harm. So the guiding rule of the rebuild is simple: **the app may only claim what it can back up.**

## What the audit found (the `as-generated` tag)

The generated version built cleanly and looked polished. Underneath:

- **All three flagship features were facades.** "Near me" was a hardcoded city dropdown with no geolocation. The map was never implemented (Leaflet was installed; zero map code existed). The accessibility controls were dead code, wired to nothing.
- **The data was fake** — 13 invented organizations with `555` phone numbers, presented as a real directory.
- **The tests were theater** — a `TEST_READY.md` claiming "100%, 20/20 passing" while the E2E suite actually failed 18 of 20 (it never rendered the app).

Real, working parts existed too — the client-side search/filter engine was genuine and was kept. The tests were another story, though: the app shipped only **2** real component tests, plus 21 more buried in the agent's own `.agents/` scaffold (removed in M1). The honest suite you see now — 34 tests — was written from scratch during the rebuild.

## The rebuild (honesty first)

Five milestones, deliberately ordered so the repo never lies mid-rebuild:

| Milestone | What shipped |
|---|---|
| **M1 — Honesty reset** | Deleted the theater (fake E2E, false docs, dead code); stripped every false UI string; added a plain demo disclaimer pointing to 211 / 988. |
| **M2 — Real data + real "near me" + real map** | Replaced the 13 fakes with **11 real, individually verified** Gainesville organizations; built opt-in geolocation + on-device ZIP lookup; implemented the Leaflet map for real. |
| **M3 — Honest tests + working accessibility** | Replaced the theater with a real test suite; made text-size and a focus-trapped detail dialog genuinely work. |
| **M4 — Identity + real high-contrast** | Became *Hearth* (name, mark, warm palette); made the high-contrast toggle genuinely repaint the UI chrome (backgrounds, text, borders, nav, buttons, banners, map popup) to a ~7:1 theme — with a few deliberate fixed-color exceptions (color-coded category badges, decorative icons, the map pin, OSM tiles). |
| **M5 — Open source + this case study** | You're reading it. |

## The method: adversarial review

Every milestone was hand-built, then put through an adversarial multi-agent review whose job was to *disprove* the work — findings default to "refuted" and must be independently reproduced (with a concrete failure scenario, and for contrast claims a recomputed WCAG ratio) to survive.

It kept catching real problems a self-review would have waved through — including, tellingly, in the honesty features themselves:

- **M2:** the map fit its viewport to the user's shared location, leaking their approximate area to the tile server — contradicting the "your location is never sent" copy. *(Fixed: the map only ever frames the resource pins.)*
- **M3:** the high-contrast toggle announced success but only applied a weak CSS filter — an overclaim aimed at the exact users who most need it. *(Removed until M4 made it real.)*
- **M4:** in high-contrast, the map popup's background stayed white while its text flipped to white — a resource's name went invisible. Missed in a manual pass; caught by the review. *(Fixed; verified in both themes.)*

The pattern is the point: **verification is the bottleneck, not generation.** Fast code is cheap; trustworthy code is the work.

## Scaling beyond the demo

The demo is honestly scoped to verified Gainesville data — but the design anticipates more.

The seam is real code, not a diagram. A `ResourceProvider` is any async source of `Resource[]`; a `useResources(provider)` hook loads from it; and the search / filter / sort / distance core (`searchResources`) takes that list as a parameter — so the data source is *injected*, never baked into the query logic or the UI.

```ts
// the contract a data source must satisfy:
interface ResourceProvider {
  readonly id: string;
  readonly label: string;
  load(): Promise<Resource[]>;
}

// shipped today — the verified static Gainesville dataset:
useResources(staticProvider);

// going national is one line — same hook, a live source, nothing else changes:
useResources(hsds211Provider);
```

So expanding to another city, a state, or nationwide is a **provider swap, not a rewrite**: write one more implementation of that interface against a live directory — a 211 feed or the [Open Referral **HSDS**](https://openreferral.org/) standard — and pass it to `useResources`. **Honest scope:** the interface, the async hook, and the `staticProvider` all ship today (`src/providers/resourceProvider.ts`, `src/hooks/useResources.ts`); the *live-feed* provider is the documented next step — it needs a real endpoint and field mapping, and shipping a fake one would break the rule this whole project is about.

## Tech

React 18 · TypeScript · Vite · Tailwind (CSS-variable design tokens for light/high-contrast theming) · React-Leaflet · Vitest + Testing Library.

## Run it

```bash
npm install
npm run dev      # local dev server
npm test         # the real test suite
npm run build    # type-check + production build
```

## Honest limitations

- **A demo, not a live directory.** The 11 listings are real and were verified against each organization's official source *where reachable* — with the exceptions the repo documents in [`VERIFIED-ORGS.md`](./VERIFIED-ORGS.md) (e.g. Three Rivers Legal's phone was confirmed via authoritative directories after its site blocked automated access, and is flagged pending a confirmation call). Details change regardless — the app says so in-product and points to **211** (community services) / **988** (crisis & suicide lifeline) for current help.
- **Gainesville, FL only**, by design — see [Scaling](#scaling-beyond-the-demo).
- The map loads tiles from OpenStreetMap, which — like any website — sees your IP address; your location is never sent to or stored by Hearth. This is stated in the UI.

## Credits & license

Original scaffold generated by a popular agentic coding stack; audited and rebuilt by hand. Resource data compiled from each organization's official public sources where reachable (disclosed exceptions in [`VERIFIED-ORGS.md`](./VERIFIED-ORGS.md)).

Released under the [MIT License](./LICENSE).
