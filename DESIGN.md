# Hearth — Design Direction (LOCKED 2026-07-24)

Status: **direction + logo locked, not yet built into the app.** This is the brief for the
next work session. The current app still wears the plain M4b look; the job is to bring *this*
identity into it.

## The idea
State-of-the-art redesign, treating Hearth as a **real product** (national-scale, search-first),
not just a portfolio demo. Voice and feeling: **hope & community** — warm, dignified, *never*
pity or crisis-imagery. The whole category (findhelp, 211, 988…) picks one of {warm, fast,
trustworthy}; Hearth does all three. Tone priority stack: **fast = the floor, trust = the frame,
warmth = the soul.**

Chosen via review + Colin's calls:
- **Energy:** blend of bold-editorial + playful-warm.
- **Imagery:** type & color forward (minimal photos — dodges crisis-photo ethics *and* keeps it fast/light).
- **Build for the help-seeker now**, but a **nonprofit/donor face** is on the table (Colin floated a pivot "eventually"); keep the same design language reusable for both.

## Palette (custom — deliberately not the AI cream+terracotta cliché)
| token | hex | use |
|---|---|---|
| paper | `#fdf7f0` | warm base background |
| paper-2 | `#f8ecdf` | alt warm section |
| ink | `#241a22` | primary text (warm near-black) |
| ink-2 | `#6b5b63` | muted text |
| plum | `#5e2a4d` | primary brand / nav |
| plum-deep | `#3a1830` | deep plum (dark surfaces) |
| amber | `#f2a93b` | the "hearth glow" / warm accent |
| coral | `#ee6c4d` | primary CTA / energy pop |
| sage | `#5f9a72` | positive / "open now" states |

Signature motif: an **amber "hearth-glow"** — a soft radial (amber→coral→transparent) behind hero
headlines. It's the visual anchor of the whole identity.

## Type
- **Display:** Bricolage Grotesque (bold, modern, a little playful) — headings, UI, big numbers.
- **Warm accent:** Fraunces (serif, italic) — hopeful pull-lines ("You belong here.").
- **Body:** system-ui stack.
- Install for the real app: `npm i @fontsource/bricolage-grotesque @fontsource/fraunces` and import
  the weights (Bricolage 500/600/800, Fraunces 600). (In the mockups they were embedded as woff2
  data-URIs to dodge the artifact CSP — the real app should self-host via @fontsource.)

## Logo — the "Ember" (LOCKED)
A warm flame with a small **heart** glowing centered in its core. **"hear·t·h" = heart + warmth** —
the mission in one mark. Final SVG: [`design/hearth-ember.svg`](./design/hearth-ember.svg).
- **Favicon / BrandMark:** use the gradient version (flame = radial amber→coral, heart = white,
  sitting on the flame so it reads on any background). Replace `public/favicon.svg` with it and
  rewrite `src/components/BrandMark.tsx` to render this SVG (it renders its own gradient — it is NOT
  `currentColor`-tinted like the old mark, so drop the `text-primary` on it in the navbar).
- **One-color fallbacks:** all-plum (`#5e2a4d`) or all-coral (`#ee6c4d`) flame with the heart knocked
  out to the background color — for stamps/print where the gradient won't render.

## Non-negotiable UX floor (from the landscape research)
Every screen keeps these regardless of visual direction:
- Modality choice (call / text / chat) — not everyone can safely call.
- Result cards that end in a **real next step**, not a bare phone number.
- A quiet, persistent **"Call/Text 988"** safety affordance.
- **Quick Exit** (Trevor-style) + "clear your history" guidance for DV / monitored-device users.
- Real multilingual + accessibility (we already have working high-contrast + text scaling).
- **List-first, map optional** (never a map-first hero).
- Fast on old phones / low bandwidth.
- Filters that matter: open-now, free/cost, language, distance, eligibility.
- HSDS-fresh data as a visible trust signal.

## Reference artifacts (private, Colin's claude.ai)
- Approved direction (2 faces, full hero): artifact `hearth-v2` — https://claude.ai/code/artifact/42ce9da0-b4c8-4af1-8211-3b446261ac3f
- Final logo/mark sheet: artifact `hearth-ember` — https://claude.ai/code/artifact/80088b21-e338-4991-b16c-4cb16374f8e7
- (Rejected 3-way low-fi deck `hearth-directions` — kept only as a "what not to do" note: system fonts + emoji + fake browser frame read as cheap AI.)

## Next-session build plan (React app, in this repo)
1. Add fonts (`@fontsource/...`), wire into `index.css`.
2. Update the design tokens in `tailwind.config.js` + `index.css` to the palette above
   (keep the existing semantic-token architecture + the real high-contrast set from M4b).
3. Swap the logo: `public/favicon.svg` + `BrandMark.tsx` → the Ember (`design/hearth-ember.svg`).
   Update `index.html` `theme-color` to plum `#5e2a4d` (or nav shade).
4. Rebuild the hero with the amber hearth-glow + Bricolage headline + the hope/community copy.
5. Restyle: search/entry, result cards (warm, rounded, next-step), the 988 + Quick Exit bar,
   the community/hope band. Keep it list-first.
6. Verify BOTH themes + real a11y/perf budgets (Lighthouse via the chrome-devtools MCP).
   NOTE: the claude-in-chrome *screenshot* tool broke last session (deserialize `params.clip.scale`)
   — confirm it works again at the start; the build needs live visual verification.
7. Then decide the live-data source (211 vs Open Referral HSDS) to make the ResourceProvider real.

Full context + history is in the durable memory: `antigrav-community-hub.md`.
