# Work split v3: Azra, Nitu, Arnav, Kavish (plus non-coders)
*Four builders. Split by surface so neither blocks the other. The seam is `docs/API_CONTRACT.md` plus fixture JSON. Build on fixtures first, flip to live Saturday night.*

**Clock:** Saturday evening. Submission Sunday 12:00 PM. **Feature freeze Saturday 10 PM.** Sunday morning is stability, deck, five rehearsals.

## The demo path (everything serves this)
1. Check-in: Maya answers 3 of 8 dimensions on her phone.
2. Feedback: strongest dimension first, then two lower ones, each with one step and one place.
3. Resource: map opens, the chosen place is not the closest, the "why this one" card explains fit over distance.
4. Trend: her term so far, exam weeks shaded.
5. Staff view: Camden financial dips in term-bill week; the decision panel says what to do.
6. Privacy and scaling slide.

## Azra: `app/` student surface, integration, deck
| # | Deliverable | Target | Notes |
|---|---|---|---|
| A1 | Check-in with partial answers: dimension picker, items from `app/src/data/inventory.ts`, per-dimension score on answered items only | Sat 8 PM | Real 18 items replace placeholders as soon as they are typed in |
| A3 | Map: Google Maps when `VITE_GOOGLE_MAPS_API_KEY` is set, Leaflet otherwise; markers from `/resources`; "why this one" card; campus toggle NB, Newark, Camden | Sat 10 PM | Fit before distance; crisis footer always present |
| A5 | Consent screen: two toggles, off by default | Sat 10 PM | Cyber reviews the copy |
| A6 | Deck, 4-minute script, backup video, five rehearsals | Sun 11 AM | |

## Arnav: UI and UX (`docs/prompts/ARNAV_UIUX.md` is the full brief)
| # | Deliverable | Target | Notes |
|---|---|---|---|
| R1 | Feedback page `app/src/pages/feedback/`: cards strongest first, next step, resource row with the "why this one" sheet, off-campus links, crisis footer | Sat 8 PM | Reads the check-in localStorage, falls back to the fixture |
| R2 | `components/Map.tsx`: Google Maps when the key is set, Leaflet otherwise; coordinate with Azra before wiring Nearby | Sat 9 PM | Key in `app/.env.local`, never committed |
| R3 | Trend page `app/src/pages/trend/` with calendar shading | Sat 10 PM | |
| R4 | Screenshots for the deck | Sun 9 AM | |

## Kavish: data points (`docs/prompts/KAVISH_DATA.md` is the full brief)
| # | Deliverable | Target | Notes |
|---|---|---|---|
| K1 | `data/wellness_events.json`: 10 to 20 real upcoming events, all three campuses, sourced | Sat 9 PM | Events outrank places in the ranker inside 7 days |
| K2 | Newark and Camden resources into `data/rutgers_resources.json`, 15 to 25 each, sourced | Sat 10 PM | |
| K3 | Academic calendar dates verified, `verified: true` | Sat 10 PM | |
| K4 | Hours and URLs for the top 20 resources | Sun 9 AM | Makes "open now" real |
| K5 | `docs/EVIDENCE.md`: inventory validation citation, ScarletWell grants, two or three sourced context numbers, findhelp link check | Sun 9 AM | |

## Nitu: `engine/` recommendation, aggregate, staff surface
| # | Deliverable | Target | Notes |
|---|---|---|---|
| N1 | Fixtures for `/checkin/feedback`, `/resources`, `/aggregate`, `/aggregate/dips` per the contract | Sat 7 PM | Unblocks A2 to A4 |
| N2 | Resource ranker: fit then distance, weights in `engine/recommend/weights.yaml`, events outrank places inside 7 days | Sat 8 PM | Vivian's rule |
| N3 | Feedback templates by (dimension, band) plus Bedrock polish with template fallback | Sat 9 PM | Guardrails: forbidden words list from the source of truth 2.5 |
| N4 | Aggregate endpoint over `data/synthetic/wellness_aggregate_weekly.json`; k >= 5 enforced server-side | Sat 9 PM | |
| N5 | Dip detector: week-over-week drop > 0.3 or lowest week, tied to the overlapping stressor | Sat 9 PM | The Challenge 2 deliverable |
| N6 | Staff view page `app/src/pages/staff/`: heatmap, overlay bands, dip list, need-vs-resource gap, decision panel | Sat 10 PM | Synthetic label on screen |
| N7 | Stretch: Bedrock natural-language question over the aggregate | Sun AM only if N1 to N6 are green | Name on a slide only if it runs |

## Non-coders
- **Doctors:** review every feedback template string; write the one-paragraph interpretation for each injected dip; privacy paragraph with Cyber.
- **Cyber:** consent copy; data-flow diagram (phone, engine, aggregate); k-anonymity statement; one slide.
- **Neuro:** tone review of the student app; opening slide.
- **Finance:** the "what Rutgers gets" slide (allocation, scheduling, dining, events, grants) with the ScarletWell grant programs named.
- **Defense:** pair with Kavish on K2 if free; otherwise rehearsal timing and the backup video.

## Checkpoints
- **Sat 7 PM:** fixtures committed; check-in renders partial scores.
- **Sat 9 PM:** feedback and map on a phone; aggregate endpoint answers.
- **Sat 10 PM:** freeze. Live API wired. Everything on the demo path works twice in a row.
- **Sun 8 to 11 AM:** bug fixes only, deck, rehearse five times, record backup.
- **Sun 11:30:** submit.

## Rules for both
- Branch per task, merge to `main` often, `main` always runs, `git pull --rebase` before push.
- Small single-purpose commits with messages an engineer can read. No em dashes anywhere.
- Each person edits only their own `app/src/pages/<surface>/` folders. Shared files (router, tailwind config, components) are Azra's; Nitu adds new files only.
- Synthetic data is labelled synthetic on screen. Every number has a source.
- If a module will not make 10 PM, cut it and say so in `docs/STATUS.md`.
