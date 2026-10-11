# SOURCE OF TRUTH v3: ScarletWell, live · Rutgers Health Hack 2026
*Every agent and every teammate reads this first. It wins over memory. If you learn something that contradicts it, say so and stop. Companion files: `WORK_SPLIT.md` (who, when), `API_CONTRACT.md` (engine and app seam), `MENTOR_NOTES_ANALYSIS.md` (what the mentors said; handwritten notes beat the transcript), `UI_DESIGN.md` (tokens and components). The Saturday-morning glucose plan is parked in `docs/archive/`.*

**Clock:** Saturday 2026-10-10 evening. Submission **Sunday 12:00 PM**, judging 1 PM. Feature freeze **Saturday 10 PM**.

---

## 0. Decision (settled Saturday afternoon)
**Track:** Wellness, Reimagined (Rutgers Health and BMIHAI). **Primary: Challenge 1** (student check-in, feedback, geolocated resources). **Secondary: Challenge 2** (university-wide aggregate view for staff). Challenge 3 is dropped. One product, two surfaces, one submission.

**One sentence:** *ScarletWell today is a Wellness Calendar and resource-links widget on MyRutgers plus a separate Wellness Inventory form that returns a number. We make it a living check-in: answer only what you want, get a friend's reply per dimension, get one next step tied to a real place or event near you (ranked by fit, then distance), watch your own trend, and, if you opt in, contribute to a k-anonymous campus picture that tells Rutgers where need is rising before midterms do.*

**Why this wins here.** Every past Rutgers Health Hack winner built exactly what a mentor described, working, in front of them. Swarbrick (ScarletWell director) described this product in her own notebook: retake by dimension, trends, geolocated Wellness Calendar events, aggregate for chancellor allocation and scheduling, Newark and Camden, and "it is very static today." Vivian added the ranking rule: closest is not always best. We build that, nothing cleverer.

**What is wrong with ScarletWell today (their words):** lives only on the MyRutgers portal; every 30 days or other fixed intervals; all items at once; a score with nothing behind it; resources kept by hand (manual web scraping); no trend for the student; no aggregate for the university; no geolocation; nothing for Newark or Camden. Their own widget paper (ComManTel 2025) lists "wellness Inventory self-assessment, chatbot integration, and personalized data analytics" as future directions. We built the next step they named.

---

## 1. Who it is for

| Persona | Today | With us | Who pays |
|---|---|---|---|
| **Student, New Brunswick** (Maya, 19, Busch) | Takes the inventory once a month if the portal nags her. Gets a number. | Two-minute check-in on her phone, any subset of dimensions. Warm feedback per dimension. One next step with a place on a map she can walk to now. Her own trend over the term. | Rutgers (ScarletWell, chancellor initiative) |
| **Student, Newark or Camden** | Same inventory, resource list written for New Brunswick. | Campus toggle; resources for her campus; financial and social resources ranked higher where the gap is. | Rutgers |
| **CAPS counselor or program lead** | Reads nothing between visits; plans workshops by feel. | Aggregate (never individual) view: which dimension is dipping, where, when; overlay of the academic calendar; gap between need and resources. | Rutgers CAPS, Student Affairs |
| **ScarletWell / Chancellor's office** | A validated instrument with no operational output. | Evidence for allocation, scheduling, dining and event planning, and grant applications (ScarletWell Connection Grants, Wellness at Work). | Rutgers |
| **Student Health clinician** (future, not the demo) | Sees a student once. | With the student's explicit consent, their own dimension trend as a conversation starter. Shown on one slide only; not built this weekend. | Rutgers Student Health |

---

## 2. The student surface (Challenge 1)

### 2.1 Principles
1. **Answer what you want.** Any dimension, any item, any time. Scoring works on partial answers and says so ("based on the 3 dimensions you answered").
2. **Lead with a strength.** Feedback opens with the highest dimension before it mentions a lower one.
3. **One next step, one place.** Per lower dimension: one concrete step and one real, current, geolocated resource or event. Never a list of ten.
4. **Fit first, distance second.** Resource ranking is fit (dimension match, open now, free or covered, campus match) then distance. The closest option is shown, but not always first. Vivian's rule.
5. **Your trend is yours.** Trend lives on the student's phone (localStorage in the demo). Nothing leaves it unless they opt in.
6. **Friend, not clinician.** No scores framed as grades, no colors that mean danger, no "should." See 2.5.
7. **Works on a phone, first.** Mobile-first layout; map is full-bleed.

### 2.2 The check-in
- **Instrument:** the Wellness Inventory, 54 validated items presented under the 8 dimension headings (Swarbrick et al., Psychiatric Services 2025;76:263-269; items in Table 2; details and numbers in `docs/EVIDENCE.md`). The paper found a single wellness factor, so dimensions are the student-facing frame, not validated subscales. **No 18-item short form is published; the challenge brief says ScarletWell holds de-identified short-form results, and `scripts/import_inventory.py` accepts that export in place of the synthetic set.** Our two-minute quick set (2 or 3 items per dimension, `quick: true` in `app/src/data/inventory.ts`) is a team choice and the screen says so; the full 54 are always one tap away. Use of the items needs Swarbrick's permission for anything beyond this demo.
- **Cadence:** student chooses. Default nudge is every two weeks, with a one-dimension "quick check" any day. The 30-day MyRutgers cycle is the thing we are replacing.
- **Partial answers:** per-dimension score = mean of answered items in that dimension, scaled to 1 to 5. Dimension with zero answered items is "not asked" and gets no feedback. Total is shown only when all 8 are answered; otherwise "8 dimensions, you answered N".
- **Scoring display:** dot on a 1 to 5 line per dimension, labelled "flourishing" at 5 and "stretched" at 1. No red, orange, green.

### 2.3 Feedback (the "friend" reply)
- One short paragraph per answered dimension, generated from templates keyed by (dimension, band) and polished by Bedrock when available; template text is the fallback and must read well alone.
- Order: strongest dimension first ("Social is carrying you right now"), then each lower dimension with one next step and one resource.
- Tone rules in 2.5. Doctors on the team review every template string Saturday evening.

### 2.4 Resources and map
- Source: `data/rutgers_resources.json`: 75 New Brunswick entries from the ScarletWell resource doc plus 25 Newark and 25 Camden entries collected from campus and city pages with a source URL on each row. Coordinates are approximate hand placements; `online: true` marks programs with no address.
- Off campus: University Hospital Newark's findhelp Community Resource Guide (uhnj.findhelp.com) covers food, housing, money, health, work, transit, care, education, legal and goods by ZIP. Each lower-band card carries up to two category deep links for the student's campus ZIP (`data/findhelp.json`). We link; we do not scrape. For the pilot, ask for the findhelp search widget or API.
- Events: `data/wellness_events.json`, 26 real upcoming events across the three campuses with sources. The feedback card shows the soonest event inside 7 days for the low dimension beside the place. Rows flagged `needs_confirmation` have an inferred weekly pattern.
- Ranking: `fit = w_dim*dimension_match + w_open*open_now + w_cost*free + w_event*upcoming_event + w_campus*same_campus`, then `score = fit - lambda*distance_km`. Weights live in one file (`engine/recommend/weights.yaml`) and are shown on the "how we rank" sheet in the app.
- Map: **Google Maps JavaScript API** (`@vis.gl/react-google-maps`) when `VITE_GOOGLE_MAPS_API_KEY` is set; **Leaflet with OpenStreetMap tiles** as the fallback so fixtures mode and CI need no key. Both render the same marker list and the same "why this one" card.
- Geolocation: browser geolocation with a campus-centroid fallback (NB College Ave, Newark Hill Hall, Camden Campus Center).

### 2.5 Copy rules (hard)
Allowed: carrying you, steady, stretched, lined up with, one small thing, nice work, when you are ready, want to. Forbidden in the student app: bad, risk, risky, warning, danger, should, must, diagnosis words, red/orange/green meaning. Crisis resources (CAPS 848-932-7884, 988) appear on every feedback screen as a quiet footer, never as a reaction to a score.

### 2.6 Trend: the student's twin
- A personal baseline per dimension, computed from the student's own check-ins: a running usual (exponentially weighted, alpha 0.4, so the last month counts most), the band they normally move in (their own mean deviation, floor 0.3), and the latest check-in placed against it in words: "about your usual", "above", "below". A trend word from the last three check-ins. Exam weeks shaded from `data/academic_calendar_fall2026.json`.
- It learns from taps. "I went" and "Not for me" under a place on Feedback are recorded on the phone; only the kind of place and a yes or no go to the engine, which shifts that kind's weight in the ranker by a bounded amount (Laplace rate, cap plus or minus 0.3). The Trend page shows what it learned and the next check-in cadence it suggests.
- Stateless: `/twin` and `/checkin/feedback` compute from what the phone sends in that request and store nothing. When the engine is not running the phone does the same arithmetic (`app/src/data/twin.ts` mirrors `engine/recommend/baseline.py`). Nothing is predicted; the word "twin" means a running picture of the student's own usual, not a model of their future.
- Stretch: "share a wellness win" anonymous card (Challenge 1 stretch item).

### 2.7 Wearables (bring your own, on device)
- A student connects a watch or ring on the Devices page two ways. Live: Fitbit, Oura, Whoop and Google Fit through each maker's OAuth sign-in (`engine/recommend/wearables.py`; the engine starts the sign-in, swaps the code for a token held in memory only, reads the last two weeks of sleep and steps and hands the rows to the phone; each needs a registered developer app, set by `<PROVIDER>_CLIENT_ID`, `<PROVIDER>_CLIENT_SECRET`, `WEARABLE_REDIRECT`). Export: a CSV from Apple Health, Garmin, Samsung Health or any maker. Either way the rows live in the browser's local storage. **No wearable value is stored by the engine or reaches the aggregate, ever.** Staff never see it.
- What it does: a sleep bar under each dimension sparkline on the trend page; one plain-words association sentence per dimension once there are at least three check-ins ("physical ran 0.6 higher in weeks you slept 6.5 hours or more"); and, when the last week of sleep averaged under 6.5 hours, the physical next step becomes a sleep step with a source line.
- What it does not do: predict anything, score anything, or feed the staff view. The demo uses a synthetic sample labelled as such. No glucose.

### 2.8 Signals and nudges (devices the student connects)
- A reading from the student's own device can trigger one nudge: a CGM reading dropping, sliding or high after a meal; a watch reporting a short night, few steps, long sitting or three low-movement days in a row during an exam week (cooped up); a calendar with three due dates inside 48 hours (deadline crunch); or a stretched week from check-ins. **We never predict a reading. The device reports it.** This is the line the physicians drew: no predictive glucose model, and we keep to it.
- A nudge is: what is happening in plain words, one or two general things to do (general because we do not know what any counter has in stock), and the nearest open place of a kind that helps, with the walk time. Example: "Your sensor says your glucose is dropping. A snack now will steady it. You are a 1 minute walk from Paul Robeson Campus Center." Glucose nudges carry one quiet safety line. When the signal is about company or movement (cooped up, barely moved, stretched week) the nudge also names the soonest free group event this week from the Wellness Calendar, with day and time.
- Signals never enter the aggregate or the staff view. Glucose words appear only on a nudge the student's own sensor triggered, never on the check-in, feedback cards or trend.

### 2.9 About you and Your day (the story a student can follow)
- **About you** (`/profile`): optional inputs, all on the phone: name, campus, undergraduate / graduate / faculty or staff; a Rutgers email verified once by a mailed six-digit code (`engine/recommend/verify.py`, HMAC code, nothing stored, SMTP when `SMTP_URL` is set, otherwise the code is shown as a plain demo fallback); phone number and browser notifications for nudges; the schedule source (Google Calendar, Outlook, Canvas feed, WebReg planner export, each with its export steps); gym days and time, intramural sports, other activities; medications picked from a catalog with the strengths on their FDA labels, dose and times of day (`app/src/data/medications.ts`; recorded, never advised); past medical history and family history in the student's words; sensors and wearables from a device catalog (`app/src/data/devices_catalog.ts`); alcohol by day of week and part of day; "Track my menstrual cycle" with cycle and period length and a running average from logged starts; the nudge triggers; the counselor invite. The engine never receives this page. It receives a campus, a dimension score, a signal type, a typed message, or an email address to verify.
- **Your day** (`/day`): the student's 24 hours as a timeline. Each line is one input, where it came from, what it meant in plain words, one small thing, and where. Sleep from the watch, cycle day, meals logged by text or photo, classes and due dates from the calendar so nudges land in the gaps, a sensor nudge, the check-in with its place and this week's event, a bedtime note. "Walk through Maya's Tuesday" seeds one coherent made-up student so a judge can follow the story; the engine answers her data for real.
- The diabetes example lives here: with diabetes in the family, meal notes lean on the steady-energy pattern (protein and fibre with carbs, movement after) and the sensor nudge appears. No screening, no label, no prediction.

---

## 3. The staff surface (Challenge 2)
**Framing:** an aggregate operational view for counseling staff, program leads and administrators. **Never an individual.** k-anonymity of 5 per cell is enforced in the engine, not the UI.

### 3.1 Views
- **Dimension by week heatmap**, filterable by campus (NB, Newark, Camden) and level (undergrad, grad); cell shows mean and n.
- **Stressor overlay:** academic calendar periods (start-of-term costs, first week, add/drop, warning grades, W deadline, registration, clocks change, seasonal illness, Thanksgiving, last classes and reading days, finals) drawn as bands on the week axis. Registrar dates are verified with a source per period; seasonal and public-health windows are marked unverified. There is no official midterm week at Rutgers; the registrar's "warning grade period" (Oct 5 to 16) is the nearest thing.
- **Dip detector:** a dimension dips when its weekly mean drops more than 0.3 (on 1 to 5) week over week, or is the lowest week of the term. Each dip is tied to the overlapping stressor if one exists. This is the Challenge 2 deliverable: one dip tied to a plausible stressor.
- **Need vs resource gap:** for each campus and dimension, number of matching resources within 15 minutes of the campus centroid vs the dip depth. Newark and Camden show the gap honestly (their lists are short because the lists are short).
- **What staff would do:** a side panel with the decision walkthrough: "financial dipped at Camden in the week the term bill was due; Basic Needs has one location there; schedule a pop-up and push the Scarlet$ense workshop two weeks earlier."
- **Stretch:** natural-language question box backed by Bedrock over the aggregate JSON ("which campus had the biggest social dip in October?").

### 3.2 Data
- **Synthetic, labelled synthetic** on screen: `data/synthetic/wellness_checkins.csv` (2,400 people across undergraduate, graduate and faculty-staff populations, 15,738 check-ins, Fall 2026) and `data/synthetic/wellness_aggregate_weekly.json` (k >= 5 cells), generated by `scripts/generate_wellness_synthetic.py` with dips injected from the calendar. If ScarletWell shares a de-identified sample, we swap the loader and keep the shapes.
- **Socioeconomic layer (optional):** AHRQ SDOH county file for Middlesex, Essex and Camden counties as context on the campus cards. Only if it is downloaded and its numbers are quoted with their source.

---

## 4. What Rutgers gets (the B2B story; one slide)
Allocation of counselors and workshops by week and campus · class and exam scheduling evidence · dining hall offerings tied to physical and financial dips · event planning (Wellness Calendar, gyms, health centers) placed where the dip is · grant applications with a term-long evidence base · Newark and Camden on equal footing · replaces manual web scraping with a resource registry that staff edit.

---

## 5. Datasets (Rutgers Health Hack list, mapped)
| Resource | Use | Status |
|---|---|---|
| ScarletWell resource document (provided) | `data/rutgers_resources.json` | Core |
| Wellness Inventory, 54 items (Psychiatric Services 2025, Table 2) | `app/src/data/inventory.ts` | Core |
| Academic calendar (registrar pages) | `data/academic_calendar_fall2026.json` | Core, verified |
| Wellness Calendar and campus event pages | `data/wellness_events.json` | Core |
| Evidence file | `docs/EVIDENCE.md` | Core |
| Synthetic check-ins (ours) | Staff view | Core |
| findhelp (uhnj.findhelp.com, shared by Azra) | Off-campus deep links by dimension and ZIP | Core (links) |
| AHRQ SDOH | Socioeconomic context cards | Optional |
| Synthea | Not needed for this build | Skip |
| CGMacros, MetaboNet, MHEALTH, VitalDB, eICU, MUSIC, OASIS, DeepLesion, OpenNeuro, CMS SynPUF, AHRQ HFMD, SyH-DR, H&P notes | Not relevant to a wellness check-in | Skip, one line each if asked |
| Vlada | Not needed | Skip |

---

## 6. Sponsor tech (name only what runs)
- **AWS Bedrock:** feedback polish with Guardrails (no diagnosis words); stretch NL query over the aggregate. Template fallback always present.
- **Google Maps Platform:** map and places UI in the student app (key from Azra; stays in `.env.local`, never committed).
- **Amazon Location or Azure Maps:** a geocoder pass to replace approximate coordinates, run from a laptop; not needed for the demo.
- **Anakin.io:** reads the public Rutgers pages the registry already cites (resource pages, Rec hours, Wellness Calendar events) and turns them into hours and change proposals a person approves (`engine/registry/`). This is the "replaces manual web scraping" line in 4 and 7, working. Name it on a slide only after `registry.refresh` has run with a key and the staff card shows a "pages last read" time. Only public pages go out; no student data.
- **Azure Maps Web SDK:** staff view heat layer of need (5 minus the weekly mean) at the three campus centroids for the selected dip; renders only when `VITE_AZURE_MAPS_KEY` is set. Name it on a slide only if the key is set in the demo.
- **Azure AI Content Safety:** screens every model reply (medium severity or higher falls back to the template) and the student's last chat message (medium self-harm adds one quiet CAPS and 988 line). Runs only when `AZURE_CONTENT_SAFETY_ENDPOINT` and `AZURE_CONTENT_SAFETY_KEY` are set; name it on a slide only if they are set in the demo.
- Nothing else is named on a slide.

---

## 7. Privacy and scaling (the walkthrough slide)
- Student data stays on device unless they opt in to (a) contributing to the aggregate or (b) sharing a trend with a named counselor. Both off by default. Revocable.
- Chat text the student types is screened by Azure AI Content Safety when it is configured. The consent copy says so.
- Aggregate cells below k = 5 are suppressed in the engine. No free-text from students enters the aggregate.
- No PHI; no NetID in the demo; synthetic data labelled on screen.
- Scaling: MyRutgers widget and the Rutgers mobile app for distribution; NetID SSO; the resource registry replaces manual scraping; Newark and Camden are a data task, not a code task.
- Off campus at scale: findhelp lists 8,008+ programs serving New Jersey and held its New Jersey Social Care Summit on the Rutgers campus in September 2025 (company.findhelp.com blog, 2025-09-23). University Hospital already runs an instance. The ask is a widget or API key, not a new directory.

---

## 8. Deck (10 slides, 4 minutes)
1. ScarletWell today: a number on a portal (Swarbrick's words).
2. Maya's two minutes: check-in, feedback, one place.
3. Fit before distance (Vivian's rule), with the ranking sheet.
4. Live demo, student.
5. Trend over a term.
6. Live demo, staff: the dip at Camden in term-bill week.
7. What Rutgers does with it (allocation, scheduling, dining, events, grants).
8. Privacy and consent.
9. Scaling: portal, mobile app, Newark and Camden, registry replaces scraping.
10. Ask: pilot in spring with ScarletWell; a de-identified export to replace our synthetic data.

---

## 9. Not allowed (anyone, anywhere)
- Any individual-level view for staff. Any cell with n < 5.
- Diagnosis or screening language. Red/orange/green. "Should." Weight language.
- Any number without a primary source. Any sponsor service not running in the demo.
- Calling our quick set a validated short form, or claiming the MyRutgers widget already runs the inventory (it is a calendar and links widget, announced 2025-09-22; see docs/RESEARCH_SCARLETWELL.md).
- Any number not in `docs/EVIDENCE.md`.
- Claiming the calendar dates are verified before they are.
