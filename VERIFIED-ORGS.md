# Verified Gainesville, FL resource organizations (M2 data of record)

Source of truth for the real dataset that replaces the fabricated `src/data/resources.ts`.
Every org's name + phone + address was confirmed against the org's OWN official site (or an
authoritative directory where noted) on **2026-07-22**. Independently re-verified by the
lead dev: the **St. Francis House closure** (dropped, see bottom) and the **Peaceful Paths
24-hr hotline**. Coordinates are intentionally left blank here — they will be **geocoded from
these verified street addresses** in the data-swap step, never hand-guessed.

Category maps to the `Resource` type: Food→`food`, Shelter→`shelter`, Health→`health`,
Legal→`legal`, Community→`support`.

## Food
1. **Bread of the Mighty Food Bank** — `food`
   - Regional food bank for Alachua/Gilchrist/Levy/Union counties; distributes via partner agencies.
   - Phone (352) 336-0839 · 325 NW 10th Ave, Gainesville, FL 32601 · https://breadofthemighty.org
   - Hours: office 8–4, receiving 7–2; **visits by appointment only** (not a walk-up pantry).
   - src: https://breadofthemighty.org/contact-us · verified ✓

## Shelter
2. **GRACE Marketplace** — `shelter`
   - Low-barrier housing-first shelter: beds, meals (Café 131), showers, case management, outreach.
   - Phone (352) 792-0800 · 3055 NE 28th Dr, Gainesville, FL 32609 · https://www.gracemarketplace.org
   - Hours: 7am–7pm daily (sheltered guests 24/7). Eligibility: low-barrier, no ID/sobriety req.
   - src: https://www.gracemarketplace.org/how-we-help · verified ✓
3. **Family Promise of Gainesville** — `shelter`
   - Emergency shelter, meals, case management for families with minor children.
   - Phone (352) 378-2030 · **mailing only: P.O. Box 5189, Gainesville, FL 32627** · https://www.familypromisegvl.org
   - Hours: call to confirm. Eligibility: families w/ minor children; **by referral / phone intake, NO walk-ins**.
   - src: https://www.familypromisegvl.org · verified ✓
   - ⚠ NO public physical address (P.O. box only) → **no map pin**; present as call-first. A "229 SW 5th St" in third-party directories is NOT official — do not use.

## Health
4. **Helping Hands Clinic** — `health`
   - Free primary medical + psychiatric care, on-site pharmacy, meals, showers, referrals.
   - Phone (352) 519-5542 · 509 NE 1st St, Suite 306, Gainesville, FL 32601 · https://helpinghandsclinic.us
   - Hours: Mon 2:30–7pm (signup ends 5:30); Wed clinic at GRACE 3–5:30. Free.
   - src: https://helpinghandsclinic.us · verified ✓
5. **Equal Access Clinic Network (UF)** — `health`
   - Student-run free WALK-IN primary care (+ specialty nights); no appointment, first-come.
   - Phone: **none published** → present as walk-in, show NO phone (a 352-273-9425 directory number is UNVERIFIED).
   - Rotating weeknight sites: Mon 12909 NW 39th Ave 32606; Tue 410 NE Waldo Rd 32601; Wed 1936 NE 8th Ave 32641; Thu 1707 N Main St 32609 (all ~5:30–6pm). Free.
   - src: https://equalaccess.med.ufl.edu/about-us · verified ✓ (phone UNVERIFIED)
   - ⚠ Rotating locations → represent as one entry describing the schedule; pin the Thu/Main St site or omit pin.
6. **ACORN Clinic** — `health`
   - Low-cost dental (and, per directories, medical) care for low-income/rural N-central FL.
   - Phone (352) 485-2772 (dental, official) · 23320 N State Road 235, Brooker, FL 32622 · https://acornclinic.org
   - Hours: Mon–Thu 8–4. Income-based.
   - src: https://acornclinic.org/contact/ · verified ✓
   - ⚠ Medical line (352) 485-1133 is directory-only (not on official site). ~25 mi from Gainesville (Brooker) — will sort far by distance, which is correct.

## Legal
7. **Three Rivers Legal Services (Gainesville)** — `legal`
   - Free civil legal services for low-income clients (abused/disabled/elderly focus).
   - Phone (352) 372-0519 · 1000 NE 16th Ave, Gainesville, FL 32601 · https://www.trls.org
   - Hours: Mon–Fri 8:30–5. Eligibility: ~≤200% FPL.
   - src: FL Attorney General victim-services dir + probono.net + statesidelegal.org · verified ✓ (via directories)
   - ⚠ Official site returned HTTP 403 to automated fetch → phone confirmed via 3 authoritative directories, NOT the org site. **Human confirmation call recommended before publishing.**
8. **Southern Legal Counsel** — `legal`
   - FL statewide public-interest firm: disability, LGBTQ+ equality, rights of people experiencing homelessness.
   - Phone (352) 271-8890 · 1229 NW 12th Ave, Gainesville, FL 32601 · https://www.southernlegal.org
   - Hours: Mon–Fri 9–5. Intake via online Legal Request Form (not walk-in general aid).
   - src: https://www.southernlegal.org/contact · verified ✓

## Community
9. **United Way of North Central Florida (2-1-1)** — `support`
   - Runs the free, confidential 24/7 2-1-1 helpline to food/housing/health/crisis resources.
   - Phone: dial **211** or (352) 332-4636 (24/7); office (352) 331-2800 · 6031 NW 1st Pl, Gainesville, FL 32607 · https://www.unitedwayncfl.org/211
   - Hours: 211 line 24/7; office Mon–Fri 8:30–4:30.
   - src: https://www.unitedwayncfl.org/contact-us · verified ✓ — the region's best single "start here" line.
10. **Peaceful Paths Domestic Abuse Network** — `support`
    - DV center: 24-hr crisis hotline, emergency shelter, counseling, legal-injunction help (Alachua/Bradford/Union).
    - Hotline (352) 377-8255 · text (352) 727-0948 · admin (352) 377-5690 · 2100 NW 53rd Ave, Suite A, Gainesville, FL 32653 · https://www.peacefulpaths.org
    - Hours: hotline 24/7. **Re-verified by lead dev 2026-07-22.**
    - src: https://www.peacefulpaths.org · verified ✓✓
    - ⚠ Correct domain is peacefulpaths**.org** (peacefulpaths.com is an unrelated NJ org).
11. **Catholic Charities Gainesville** — `support` (also functions as walk-up Food)
    - Emergency assistance: food pantry, utility/rent help, outreach, ESOL, pregnancy/adoption services.
    - Phone (352) 372-0294 · 1701 NE 9th St, Gainesville, FL 32609 · https://www.catholiccharitiesgainesville.org
    - Hours: food pantry Mon–Thu 9:30–12:30; office hours conflicting on site → call to confirm.
    - src: https://www.catholiccharitiesgainesville.org/contact · verified ✓
    - Note: real walk-up PANTRY — surface under Food too, since Bread of the Mighty is appointment-only.

## Dropped (critical stale-candidate catch)
- **St. Francis House** — **CLOSED.** Day services ended 2026-03-20; Main St emergency + cold-night
  shelter permanently closed 2026-04-16 (funding). Only the Arbor House women/children transitional
  program continues. Independently confirmed by lead dev via WCJB, the Independent Florida Alligator,
  WUFT, and the org's own stfrancishousegnv.com notice. **Never list as walk-in meals/shelter** —
  sending someone in crisis to a closed shelter is the exact harm this app exists to prevent.

## Category health
- Health (3) and Community (3) strong; Shelter (2) and Legal (2) adequate; **Food is thin** — Bread of
  the Mighty is appointment-only, so real walk-up food = Catholic Charities pantry + GRACE meals
  (tag those under Food too). A follow-up could verify 1–2 dedicated neighborhood pantries.

## Carry-forward flags for the data-swap step
- Geocode all street addresses → lat/lng (never guess). Family Promise = no pin (P.O. box). Equal Access = rotating (schedule in description).
- Show NO phone for Equal Access; keep ACORN medical line off (dental line only); mark TRLS "call to confirm" until a human dials it.
- Every card/detail shows a `lastVerified: 2026-07-22` date; keep the permanent 211/988 strip.
