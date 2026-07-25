# Hearth — Design Direction (LOCKED 2026-07-24)

Status: **BUILT — this direction is live in the app** (commits `78d7b5b`, `97a31b5`), verified
in-browser in both themes at desktop and mobile. Lighthouse (mobile): **Accessibility 100,
Best Practices 100, SEO 100**. Not yet pushed to the public GitHub Pages site — that is Colin's call.

This file remains the source of truth for *why* the design is the way it is. Everything below
describes what shipped, except the "Next-session build plan" section, which is now done and kept
only as a record of the order it was executed in.

### Hard-won gotchas (cost real debugging — do not regress)
- **Never use Tailwind opacity modifiers on the `var()`-backed tokens** (`text-on-nav/70`,
  `bg-primary/10`, `border-primary/40`). Tailwind cannot apply alpha to a raw `var()` color, so the
  declaration is invalid and *silently dropped* — the element falls back to inherited color. This
  made the footer body text dark-on-dark invisible. Use a real token instead (e.g. `--text-on-nav-muted`).
- **Never hardcode a `var(--...)` into a class** (`text-[color:var(--bg-nav-hover)]`): tokens that
  are backgrounds in one theme become invisible text in the other.
- **Coral must be dark enough for the tinted surfaces, not just white.** `#c9472f` passed on white
  (4.74:1) but failed on `--bg-card-hover` (4.08:1). The shipped `--color-primary: #b03d28` passes both.
- **Quick Exit must not own a bare Escape** — Escape also closes the resource modal, so a single-press
  trigger ejected users off the site. It requires 3 presses within 1.5s (Trevor Project pattern).

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

## Critique fixes — MUST apply in the build (from the 2026-07-24 adversarial critique)
The home preview was critiqued (a11y/contrast · craft · crisis-UX · honesty), verified adversarially
(6 findings correctly refuted as mock-artifacts / mis-applied standards). Confirmed, transferable fixes:

**Accessible palette (the warm colors fail WCAG AA as text — this is load-bearing):**
- `--coral-text: #c9472f` for ALL coral text/CTA fills (white-on-#c9472f = 4.74:1 ✓). Reserve bright
  `--coral #ee6c4d` for decorative/glow/large-fill ONLY — never text, never a white-text button.
- Food category → warm brown `#8a4a12` (NOT sage green — reserve green for status only).
- Chips: open-now text `#35684a` on `#e7f1ea`; free text `#7a3d0f` on `#fbeee0`.
- Never ad-hoc light text — hint/microcopy use `--ink2 #6b5b63`. Tokenize the app border (`--line3 #d8c4b2`).
- Re-verify EVERY final text/bg pair ≥4.5:1 (≥3:1 large ≥24px / bold).

**Accessibility (build):** global `:focus-visible` ring on every interactive; use real `<a>/<button>`
(mock used spans), pad primary CTAs toward ~44px; replace ALL emoji icons with an inline-SVG set
(currentColor) — cross-platform + brand-consistent; keep `aria-hidden` on decorative glyphs; give the
988 bar a landmark role + accessible name, persistent across scroll/routes.

**Safety / copy (some were real bugs):** 911 for immediate danger, 988 only for "need to talk," and
surface the DV hotline **1-800-799-7233** (the Quick-Exit audience). Calm "quiet-persistent" framing —
no pulsing alarm. Quick Exit must be **sticky/fixed**, unambiguous ("Leave quickly" + door icon), fire
on **ESC** → neutral site, plus a "clear your history" link. Language switcher **visible on mobile**
(never `.hideSm`). Per-card modality = reveal call/text/chat (not phone-only); one clear primary
("What to expect →"). Add one-tap "Use my location" (with privacy note); spell out cryptic chips.

**Honesty:** "verified" must carry a date (HSDS last-updated) or soften to "listed from public
sources." Scope free/private to Hearth's OWN behavior ("Always free to search · no account · no
tracking") — never imply every org is free; drop absolute "always" on privacy unless guaranteed with
zero third-party requests. Distance precision must match input (ZIP-centroid → "~1 mi", not "1.2 mi").
Every operational chip (Walk-in / 24-7 / EN·ES / beds) is a dated verified field or it's omitted;
"Call to confirm" on high-stakes ones.

**Craft:** reserve coral for the primary CTA + one accent (demote secondary links to plum/ink); define
a small type-scale token set + snap sizes; consistent radius (12/18/22 + pills).

**Do NOT chase (correctly refuted):** the "44px target-size = AA" claim (spacing exception is met; the
padding is a nice-to-have, not required), an sr-only heading on the stats band (AAA), and "open-now
implies real-time" (intended pattern; the freshness pipeline covers it).

Full context + history is in the durable memory: `antigrav-community-hub.md`.
