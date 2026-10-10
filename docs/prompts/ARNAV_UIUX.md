# Arnav: UI and UX for ScarletWell, live

*Paste this whole file into your agent (Claude Code, Cursor, Gemini) as the first message, or read it yourself. It assumes no prior context.*

## Where you are
Rutgers Health Hack 2026, "Wellness, Reimagined" track. Submission is Sunday 12:00 PM, judging 1 PM. Feature freeze Saturday 10 PM; after that only fixes. The team is building **ScarletWell, live**: a phone check-in on the Rutgers Wellness Inventory (8 dimensions: emotional, environmental, financial, intellectual, occupational, physical, social, spiritual) that returns a friendly reply per dimension, one next step, and one real place or event near the student, ranked by **fit first, distance second** (mentor Vivian: "the closest might not be the best"). A second screen for Rutgers staff shows an aggregate, never-individual view of which dimension dips on which campus in which week.

Repo: https://github.com/azrabano23/health-hack. Read `docs/SOURCE_OF_TRUTH.md` sections 2 and 3 first (10 minutes), then `docs/API_CONTRACT.md` "v3 endpoints", then `docs/AZRA_START.md` for how the app is wired.

## Run it
```bash
git clone https://github.com/azrabano23/health-hack && cd health-hack
cd app && npm i && npm run dev        # runs on fixtures, no backend needed
```
Open the URL on your phone too (same wifi, use the network URL Vite prints). The student surface is designed at 390 px wide.

## How the app is built (so you do not fight it)
- React 19, Vite, TypeScript, Tailwind 4, Zustand, Recharts, react-leaflet. Pages self-register: create `app/src/pages/<name>/index.tsx` exporting `route` and a default component; never edit `App.tsx` to add a page.
- Data only through `@/api/client` (`api.feedback(...)`, `api.resources(...)`, `api.aggregateWeekly()`, `api.aggregateDips()`). Types in `@/api/types`. Fixtures load by default from `engine/fixtures/*.json`; `VITE_USE_FIXTURES=0` with the engine running hits the live API.
- Design tokens live in `app/src/styles/index.css` (`@theme`): `canvas` background, `surface` cards, `ink` text, `soft` secondary text, `rule` borders, `teal` eyebrows, `acid` accent (yellow), `acid-soft` for win cards. Fonts: Figtree display, Inter body, IBM Plex Mono for labels. Shared pieces in `app/src/components/ui.tsx`: `Card`, `Eyebrow`, `Title`, `Toggle`, `Source`. **The code is the design system; `docs/UI_DESIGN.md` is older and describes a glucose product. Where they differ, follow the code and the rules below.**
- Ownership: one folder per surface, one owner per folder. Azra owns `pages/checkin`, `pages/nearby`, `pages/today`, `pages/eat`. Nitu owns `pages/home`, `pages/share`, `pages/counselor`, `pages/eval`, `components/Band.tsx`, and everything in `engine/`. You own the folders listed under your deliverables. Shared files (`components/ui.tsx`, `styles/index.css`, `api/*`, `App.tsx`): add new files freely; edit existing ones only in a tiny commit, pushed immediately, and say so in Discord.
- `App.tsx` types `owner` as `"azra" | "nitu"`. In your first commit add `"arnav"` to that union (one line) so your pages can declare you.

## Copy and visual rules (hard, from the source of truth)
- Friend, not clinician. Allowed words: carrying you, steady, stretched, lined up with, one small thing, nice work, when you are ready. **Forbidden anywhere in the student app:** bad, risk, risky, warning, danger, should, must, any diagnosis word. No red, orange, or green that means good or bad. Scores are shown as a dot on a 1 to 5 line labelled "stretched" at 1 and "flourishing" at 5, never as a grade.
- Strength first. The strongest dimension is always the first card.
- One next step and one place per lower dimension. Never a list of ten.
- The crisis footer (CAPS 848-932-7884, 988) appears quietly on every feedback screen, never as a reaction to a score.
- Every number shown has a `source` (use the `Source` component).
- Two taps to anything. No modals for consent.
- Works at 390 px with a 16 px gutter and no horizontal scroll; also fine on a laptop.
- Synthetic data is labelled "synthetic" on screen on the staff view.

## Your deliverables, in order

### 1. Feedback page: `app/src/pages/feedback/` (Saturday 8 PM)
Route `/feedback`, `student: true`, order 3.5 (sits after Check-in). Reads `api.feedback({ scores })`; on fixtures it returns Maya's three answered dimensions from `engine/fixtures/checkin.feedback.json`. Render:
- Opening line (`opening`).
- One card per `cards[]` entry in the given order: dimension name, the 1 to 5 dot line, `message`. For `band !== "strong"`: `next_step`, then the top `resource` as a compact row (name, `why`, distance or "online", phone), then "Also nearby" with `alternatives`, then "Off campus" with `off_campus[]` links (label, opens in a new tab, small `source` line saying findhelp, University Hospital Newark).
- A "why this one" sheet on the resource row: a short explanation that fit comes before distance, listing the fit reasons from `why` and the `distance_km`. Copy the ranking weights from `engine/recommend/weights.yaml` into a small constant with a comment that says where they came from, and show them as plain words ("serves this dimension +1.0, same campus +0.4, each km away -0.25").
- The crisis footer.
Hand-off from Check-in: Azra's check-in page saves answers to localStorage under the key `checkin`; read the latest entry's `scores`, lower-case the dimension names, and pass them to `api.feedback`. If there is no entry, use the fixture and label it "sample".

### 2. Map component: `app/src/components/Map.tsx` (Saturday 9 PM)
One component used by Nearby and by the Feedback resource row. Props: `markers: {id, name, lat, lng, selected?}[]`, `center`, `zoom`, `onSelect(id)`.
- When `import.meta.env.VITE_GOOGLE_MAPS_API_KEY` is set, render Google Maps with `@vis.gl/react-google-maps` (`npm i @vis.gl/react-google-maps`), light custom style, marker for each item, selected marker larger in `acid`.
- Otherwise render the existing Leaflet map (OpenStreetMap tiles) with the same props so fixtures mode works with no key.
- The key lives in `app/.env.local` (already git-ignored). Never commit it. Ask Azra for the key.
- Skip markers with null coordinates (online programs).
Then coordinate with Azra on Discord before swapping `pages/nearby/index.tsx` to use it; that folder is hers. Offer a small PR she can merge.

### 3. Trend page: `app/src/pages/trend/` (Saturday 10 PM)
Route `/trend`, `student: true`, order 4.5. Reads the `checkin` localStorage history (same shape as above) and draws one small sparkline per dimension across the term with the latest value highlighted, plus one sentence of change ("Financial is up since September"). Shade exam weeks using `data/academic_calendar_fall2026.json` (import it with a relative path, the fixtures already import from outside `app/` this way); draw the periods marked `approximate: true` with a lighter fill and a "dates approximate" note. No numbers without the 1 to 5 scale shown.

### 4. Staff view polish (only if Nitu asks, Sunday morning at the latest)
Nitu owns `pages/staff/`. If he asks, help with the heatmap readability (one hue, lightness encodes the mean, n shown on hover, "synthetic" label visible), the stressor bands on the week axis, and the dip list wording. Do not start this unasked.

### 5. Screenshots for the deck (Sunday 9 AM)
Six phone screenshots at 390 px (check-in, feedback with the "why this one" sheet open, map with a selected marker, trend) and two laptop screenshots of the staff view. Put them in `docs/screenshots/` and open a PR.

## Working rules
- Branch `arnav/<thing>`, small single-purpose commits with messages an engineer can read (`feedback: resource row with why-this-one sheet`), **no em dashes anywhere**, `git pull --rebase` before every push, PR to `main`.
- `cd app && npm run typecheck` must pass before every push.
- Do not touch `engine/`. If a field is missing from the API, say what you need in Discord; the contract, fixture, and types change together in one commit.
- Ask in Discord when a rule above and a design instinct disagree. The rules win on the demo path.

## Definition of done
Feedback, Map, and Trend render on fixtures on a phone with no console errors, typecheck clean, screenshots in the PR description. Judges will see Feedback and the map for about 90 seconds; make those two excellent before touching anything else.
