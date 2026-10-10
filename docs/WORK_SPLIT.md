# Work split — Azra ↔ Nitu (plus non-coders)
*Two coders. Split by vertical so neither blocks the other. The seam between you is `docs/API_CONTRACT.md` + fixture JSON — agree it in the first 30 minutes, then don't talk about it again until integration.*

**Clock:** it is Saturday afternoon. Submission Sunday 12:00 PM. **Feature freeze Saturday 10:00 PM.** Sunday morning is stability, deck, and five rehearsals.

## Azra — `app/` (student + counselor surfaces), integration, deck
Reuse the AeroBin scaffold (React 19 · Vite · TS · Tailwind · shadcn · Zustand · Recharts · Leaflet). Build against `engine/fixtures/*.json` from minute one; flip to the live API Saturday night.

| # | Deliverable | Target | Notes |
|---|---|---|---|
| A1 | Scaffold + routing + fixture loader (`VITE_USE_FIXTURES=1`) | Sat 2 PM | Mobile-first; no auth beyond a fake student picker |
| A2 | **Check-in** (Challenge 1): 8 dimensions × placeholder items, retake by dimension, total + dimension scores, trend sparklines (localStorage) | Sat 5 PM | We don't have the real 18 items — label as placeholder until ScarletWell shares the short form |
| A3 | **Today card** (Challenge 3 surface): last excursion + "why" attribution bars, uncertainty state, one exercise-snack suggestion, dining-menu ranked list | Sat 7 PM | Consumes `/predict`, `/attribute`, `/optimize`, `/next_meal` |
| A4 | **Nearby map**: `data/rutgers_resources.json` geocoded, filter by low dimension, rank by fit then distance, campus toggle (NB / Newark / Camden) | Sat 8 PM | Geocode once with Amazon Location (or Nominatim fallback) and commit lat/lng into the JSON |
| A5 | **Counselor view** (Challenge 2): opt-in gated list, per-student dimension trends, sleep/activity/glucose-stability trend, scale entry (PHQ/GAD), vulnerable-point flags, aggregate campus heatmap | Sat 10 PM | Aggregate from `engine/fixtures/aggregate.json` (synthetic students) |
| A6 | **Share/consent** screens: counselor sharing, aggregate contribution, grade upload (private) — with consent copy reviewed by Neuro + Cyber | Sat 10 PM | |
| A7 | **Predicted-vs-observed Day-8 chart** + metrics table + baseline comparison (the Challenge-3 deliverable viz) | Sat 10 PM | Data from `/eval` |
| A8 | Deck, 4-min script, backup video, five rehearsals | Sun 11 AM | Owns the pitch |

## Nitu — `engine/` (data, model, attribution, API)
Python 3.11 · pandas · numpy · scikit-learn · numpyro/jax (or pymc) · fastapi · uvicorn. Write `engine/fixtures/*.json` **first** (hand-made, shaped per the contract) so Azra is unblocked by Sat 1 PM; replace with real outputs as modules land.

| # | Deliverable | Target | Notes |
|---|---|---|---|
| N0 | **Fixtures for every endpoint** in `docs/API_CONTRACT.md` | Sat 1 PM | Unblocks the whole front end |
| N1 | **CGMacros loader**: rows are 1-min (both CGMs interpolated) → resample to the 5-min challenge grid; keep `device`; meals with macros + photo path; Fitbit HR/METs (METs are ×10); `bio.csv` join | Sat 3 PM | Dexcom-vs-Libre bias up to 58.7 mg/dL — never mix without offset. MetaboNet: pyarrow filters only (see `data/DATASETS.md`). Shipped in PR #2 |
| N2 | **Meal metrics**: per meal → pre-meal baseline (15-min median), g30/60/90/120, peak, Δ, time-to-peak, iAUC | Sat 4 PM | This is the eval target |
| N3 | **Baseline + eval harness**: Elastic Net on engineered features; leave-last-day-out per participant; RMSE per metric, per group (healthy/pre/T2D) | Sat 6 PM | Cite arXiv 2609.11872; (stretch) fine-tuned Chronos-Bolt |
| N4 | **TWIN model**: hierarchical meal-response model, 5 per-person params, population prior from CGMacros, posterior per person, forward sim with credible bands → all 5 metrics | Sat 9 PM | Must beat Elastic Net on postprandial RMSE on ≥1 metric; report honestly if not |
| N5 | **Parameter-recovery test** on synthetic people with known parameters | Sat 9 PM | One plot. Proves identifiability; also calibrates to the organizers' synthetic generator |
| N6 | **Residual attribution**: fit residual → decompose over events (sleep from Fitbit, RHR shift, exercise bouts, user events) with literature priors; "insufficient prior" flag when posterior ≈ prior | Sat 10 PM | Neuro supplies the prior table (`engine/attribution/priors.yaml`) |
| N7 | **Optimizer + next-meal picker**: same-meal counterfactuals (hour, order, post-meal walk) ranked; EIG over a dining-hall menu | Sat 10 PM | Post-meal exercise only; pre-meal ≈ rest per evidence |
| N8 | **FastAPI** serving the contract; CORS; `/eval` returns the Day-8 predicted-vs-observed payload | Sat 10 PM | Deploy on an EC2/App Runner or run locally for demo; whichever is stable |
| N9 | Stretch: Comprehend Medical free-text → event parser; HealthLake FHIR load of one synthetic student (reuse Azure samples' mapping) | Sun AM only if N1–N8 are green | Only name on a slide if running |

## Non-coders (so the coders never context-switch)
- **Neuro:** `engine/attribution/priors.yaml` — per event type: expected direction, magnitude (mg/dL or % iAUC), duration, source URL. Review all in-app copy for tone (no fear) and clinical accuracy. Presents the problem slide.
- **Cyber:** consent copy for A6; data-flow diagram (device → app → engine → counselor), what's stored where, k-anonymity threshold for aggregate; one security slide. Review `API_CONTRACT.md` for anything that would carry PHI.
- **Finance:** Vlada pulls (CGM pricing, MA plan counts, cost of a T2D conversion) + the value-prop slide from `SOURCE_OF_TRUTH.md` §6.
- **Defense (if not coding):** pair with Nitu on N4/N5 math — identifiability, priors, forward simulation. If a third coder appears, they take N6 + N7 outright.

## Integration checkpoints
- **Sat 1 PM** — contract agreed, fixtures committed, app renders Today card from fixtures.
- **Sat 6 PM** — baseline numbers exist; check-in + map work on a phone.
- **Sat 10 PM** — freeze. Live API wired. Everything demoable.
- **Sun 8–11 AM** — bug-fix only, deck, rehearse ×5, record backup.
- **Sun 11:30** — submit.

## Rules for both
- Branch per task (`azra/a3-today-card`, `nitu/n4-twin`); merge to `main` often; `main` always runs.
- No PHI, ever. All data is public (CGMacros/MetaboNet) or synthetic.
- Every number rendered in the UI carries a `source` field from the engine.
- If a module won't make Sat 10 PM, cut it and say so in `docs/STATUS.md` — don't let it leak into Sunday.

---
## AMENDMENT (Sat 2 PM) — rebalanced split
Azra's list was A1–A8 plus the deck; Nitu has a full engine plus free UI capacity. Moved the **analytics-heavy surfaces** to Nitu so each coder owns a vertical end to end. Design tokens/components: `docs/UI_DESIGN.md`.

| Owner | Scope |
|---|---|
| **Azra** | A1 scaffold (owns `app/` skeleton, router, fixture loader, tailwind tokens from `UI_DESIGN.md`) · A2 Check-in · A3 Today card · A4 Nearby map · A8 deck + rehearsal · final integration |
| **Nitu** | Engine N0–N9 · **A5 Counselor view** (`app/src/pages/counselor/*`) · **A6 Share/consent** (`app/src/pages/share/*`) · **A7 Eval / predicted-vs-observed** (`app/src/pages/eval/*`) · shared `<Band />` component (`app/src/components/Band.tsx`) |

**Collision rule:** each person only edits their own `app/src/pages/<surface>/` folders. Shared files (`router`, `tailwind.config`, `components/`) — Azra owns; Nitu adds new files only, or asks. Merge straight to `main`, small commits, `git pull --rebase` before push.

## Added after the Gemini thread review
- Nitu N6: nocturnal HR dip as the sleep proxy; dawn index feature; medication classes as fixed modifiers from priors.yaml (see SOURCE_OF_TRUTH §4.1).
- Azra A3: study-focus reading of the curve (steadier window, dip copy) per SOURCE_OF_TRUTH §2.6. No red zones.
