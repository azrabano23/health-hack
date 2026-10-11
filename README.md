# ScarletWell, live

**Rutgers Health Hack 2026 · Track: Wellness, Reimagined · Challenge 1 (student check-in, feedback, geolocated resources) with Challenge 2 (campus-level view for staff)**

## Try it

**Live app: https://scarletwell.com**

Open it on a phone. Start at **About you**, then **Your day** ("Walk through Maya's Tuesday"), then **Check-in**, **Feedback**, **Trend**, **Chat**, and finally the **Staff** view at `/#/staff`. Engine health: `https://6y5mquspjp.us-east-1.awsapprunner.com/llm/status`.

Running it yourself takes two commands (see [Run it locally](#run-it-locally)).

## The problem

ScarletWell is a validated wellness program, but the way students meet it today leaves four gaps. These are ScarletWell's own words from the mentor sessions and their widget paper, not our assumptions.

| Gap today | What it costs |
|---|---|
| The Wellness Inventory is 54 items, all at once, on a fixed 30-day cycle, behind the MyRutgers portal | Students skip it. A score arrives with nothing behind it and nothing to do next |
| Resources are a hand-kept list written for New Brunswick, with no map, no hours check, no ranking | The closest place is not always the right place, and Newark and Camden students get a list that does not fit their campus |
| A student sees no trend of their own | Nothing connects a bad week to the exam or deadline that caused it |
| The university has no operational view | Staff plan workshops, dining and hours by feel, after the dip, not before it |

## What we built

One product, two surfaces, one engine.

**For the student**
- **A check-in that is theirs.** Answer one dimension or all eight of the Wellness Inventory's dimensions, any items, any time. A one-tap mood counts. Scoring works on partial answers and says so.
- **A friend's reply, not a grade.** The strongest dimension first, then one small thing and one real place or event for each lower one. Wording is checked against a forbidden-word list before anyone sees it.
- **Fit first, distance second.** Places are ranked by dimension match, open now, free, same campus and upcoming events, then distance. The "why this one" card shows the reasoning.
- **A personal baseline.** The student's own usual per dimension, the band they normally move in, and where the latest check-in sits against it. A tap on "I went" or "Not for me" nudges what the ranker prefers for them. It never predicts.
- **Nudges from the phone and from devices they connect.** Phone motion alone detects long sitting; a watch or ring can report short sleep or low steps; a calendar can show a deadline crunch. Each becomes one step and the nearest open place, with the walk time.
- **Food, faith and culture as first-class inputs.** Halal and kosher dining, prayer rooms, pantry hours, and free food this week from the student activity feed.
- **Chat and voice, in English and Spanish.** Free text goes to a dimension, places and events. Replies are drafted by the model; the places and events always come from the registry.

**For staff (aggregate only, never an individual)**
- A dimension by week heatmap per campus and level, over the registrar's calendar of stressors.
- A dip detector that names the overlapping stressor, and insights with what to do by when.
- A need-versus-resource view: pantry access by day, the weekend gap, county context and enrollment for each campus.
- A question box over the aggregate. Cells with fewer than five students are suppressed inside the engine and never leave it.

## How we built it

**Architecture**

```
Phone (React 19, Vite, TS)  ──►  Engine (FastAPI, Python 3.11)  ──►  Amazon Bedrock (wording, chat, photo)
  check-ins, trend, wearable        ranker · feedback · nudge             with Guardrails
  values stay on the device         baseline · aggregate · dips            ElevenLabs (voice)
                                    registry · public-data context         Google Maps / Anakin.io
```

- **Stateless engine.** It computes from what the phone sends in each request and stores no table of students. If the engine is down, the phone runs the same arithmetic and every page keeps working.
- **Every endpoint has a fixture fallback**, and every model reply says which path produced it (`method`), so the demo never returns a 500 and no claim depends on a live model call.
- **Rules, not black boxes.** Ranking is a weighted fit minus distance (weights in one file, shown in the app). The dip detector is a rule against the registrar calendar. The baseline is an exponentially weighted running mean and band. Nothing is trained offline, so every output can be explained to the student in a sentence.
- **Registry kept current by proposals.** Public Rutgers pages are read with Anakin.io; every change becomes a proposal a person approves. It is a reviewed flow, not a scrape.
- **90+ engine tests** cover ranking, feedback wording, k-suppression, the movement rule, the baseline, the registry and every API route.

**Cloud and services, each named only where it runs**
- AWS: engine on App Runner, app on S3 and CloudFront, Bedrock with Guardrails as the model door, Comprehend Medical on free text. One CloudFormation stack and one `deploy.sh`.
- ElevenLabs for voice, Google Maps for the map (Leaflet and OpenStreetMap as the keyless fallback), Anakin.io for registry refresh.

**Public data the product runs on**

Every number in the UI carries its source line on hover (`docs/EVIDENCE.md`). County and national numbers describe adults or all students, never a Rutgers student, and the UI says so.

| Data | What it does | Source |
|---|---|---|
| Resource registry, 125 rows across New Brunswick, Newark and Camden | Feeds the ranker, map and plans; each row cites its page | ScarletWell resource document and Rutgers campus pages |
| Wellness Calendar, 26 events | The event beside each place | Rutgers Wellness Calendar and campus event pages |
| Registrar academic calendar, Fall 2026, 11 stressor periods | Ties a dip to the exam, deadline or break behind it | Rutgers registrar pages, each with a verified flag |
| The Arc free-food feed | "Free food this week" on Day and the staff food panel | CampusLabs Engage discovery API for the three campuses |
| UCI MHEALTH (body motion, 10 volunteers) | Fits the still-versus-moving rule behind the phone-motion nudge, leave-one-subject-out accuracy 0.99 | Banos et al. 2014, CC BY 4.0 |
| CDC PLACES 2025, county estimates | County context on the campus card, with confidence intervals | CDC, dataset `swc5-untb`, public domain |
| IPEDS College Navigator | Enrollment and Pell share per campus | NCES, public domain |
| ACHA-NCHA III Spring 2025, Cuite et al. 2020, NJ OSHE Spring 2025 | National and Rutgers context numbers, quoted verbatim | Cited in `docs/EVIDENCE.md` |
| AHRQ SDOH / Community-Level Health Database | County poverty, SNAP and uninsured as a second context layer | Loader written (`scripts/sdoh_counties.py`); the file is the next download |

Full licences and per-file detail: `docs/DATASETS.md`.

## The gaps this closes

| Gap | How the product closes it | Where to see it |
|---|---|---|
| All 54 items every 30 days | Any subset, any time, a mood in one tap; scoring on partial answers | Check-in |
| A score with nothing behind it | One strength, one small step and one real place per dimension | Feedback |
| Closest is not best | Fit first, distance second, with the reasoning shown | Nearby, Feedback "why this one" |
| No trend for the student | A personal baseline, kept on the phone, that learns from taps | Trend |
| Hand-kept resources | A sourced registry with hours, refreshed through reviewed proposals | Staff "Resource registry" card |
| Nothing for Newark or Camden | Campus toggle; Newark and Camden are data rows, not code | Campus switch in the header |
| Staff plan by feel | Dips tied to the stressor, with dated actions a week ahead, from cells of five or more | Staff |
| Food, faith and culture ignored | Halal and kosher dining, prayer rooms, pantry access by day, free food this week | Day, Staff food panel |
| Wearables mean surveillance | Values stay on the device; never in the aggregate, never seen by staff | Devices |

## Why this is safe to put in front of students

- **No PHI, ever.** The repo holds public data only. The engine holds no table of students.
- **Wellness, not clinical.** No diagnosis language and no red, orange or green meaning. Crisis lines (CAPS 848-932-7884, 988) sit as a quiet footer on every feedback screen, never as a reaction to a score.
- **No prediction.** The baseline says "about your usual", "above" or "below". A device reports a reading; we never forecast one.
- **Privacy by construction.** Profile, calendar, meals and wearables stay on the phone. Staff see aggregates only, and cells under five are suppressed in the engine, not in the UI.
- **Honest numbers.** The engine attaches a `source` to every metric, and the app renders it. Weights, rules and limits are shown, not hidden.
- **Permission path.** The Wellness Inventory is Swarbrick et al., Psychiatric Services 2025;76:263-269. Use beyond this demo needs the authors' permission, and we say so on the check-in screen.

## What we would do next

| When | Step | Why it matters |
|---|---|---|
| Before a pilot | Get Dr. Swarbrick's permission to use the inventory, and ask ScarletWell for the de-identified short-form export. `scripts/import_inventory.py` already accepts it, so the staff view does not change | Replaces the demonstration aggregate with the real campus picture |
| Before a pilot | Add sign-in (Rutgers SSO) and auth on the engine, which today is public with open CORS; scope the IAM policy; FERPA review of the opt-in path with the Office of the Registrar | Required before any real student data |
| First term | Run with one cohort at one campus; measure completion rate, return rate, and the share who act on the suggested place | Tests whether a partial, friendly check-in beats the 30-day form |
| First term | Hand registry proposals to a ScarletWell staff member as a weekly review, and ask findhelp for the widget or API key | Keeps hours and events current without a scrape |
| Second term | Wire the AHRQ county file, replace approximate coordinates with a geocoder pass, add Newark and Camden events from their own calendars | Finishes the context layer and the map accuracy |
| Second term | With a term of real check-ins, train the first model worth training: a week-ahead dip forecast for staff planning, evaluated against the rule we ship | Moves staff action from "this week" to "a week before" |
| Later | Student Health: with explicit consent, a student's own trend as a conversation starter for a clinician | Shown as a slide only; not built |

## Run it locally

Prereqs: Node 20+ and Python 3.11+.

**App only, on fixtures (no backend):**
```bash
cd app && npm install && npm run dev      # http://localhost:5173, hash routes like /#/staff
```

**App against the live engine:**
```bash
python3 -m venv .venv && .venv/bin/pip install -r engine/requirements.txt
cd engine && PYTHONPATH=. ../.venv/bin/uvicorn api.main:app --reload     # :8000
cd app && VITE_USE_FIXTURES=0 npm run dev
```

**Checks:**
```bash
cd app && npm run typecheck && npm run build
cd engine && PYTHONPATH=. ../.venv/bin/pytest -q
```

### Configuration (everything optional; with no keys the engine serves templates)

| Variable | Where | Effect |
|---|---|---|
| `VITE_USE_FIXTURES` | app | `0` calls the engine, otherwise fixtures |
| `VITE_API_URL` | app | engine base URL (default `http://localhost:8000`) |
| `VITE_GOOGLE_MAPS_API_KEY` | app | Google Maps; Leaflet with OpenStreetMap otherwise |
| `ANTHROPIC_API_KEY` | engine | Claude API for chat, wording and food photo |
| `AWS_REGION` plus credentials, or `SCARLETWELL_BEDROCK=1` on an IAM role | engine | Claude on Amazon Bedrock |
| `BEDROCK_GUARDRAIL_ID`, `BEDROCK_GUARDRAIL_VERSION` | engine | managed Guardrail on Bedrock calls |
| `ELEVENLABS_API_KEY` | engine | text to speech and speech to text |
| `ANAKIN_API_KEY` | repo root `.env` | registry refresh scripts only |
| `ENGINE_LIVE=0` | engine | force fixtures |

### Deploy to AWS

```bash
export AWS_REGION=us-east-1
infra/aws/deploy.sh      # engine image to ECR, stack create or update, app to S3, CloudFront invalidate
```
Set `SITE_DOMAIN` with `HOSTED_ZONE_ID` (Route 53) or `CERT_ARN` (certificate issued in us-east-1) to serve on your own hostname. Teardown: `aws cloudformation delete-stack --stack-name scarletwell`, then empty the bucket and delete the ECR repository.

### Keeping the registry current

With `ANAKIN_API_KEY` set, from `engine/`:
```bash
PYTHONPATH=. ../.venv/bin/python -m registry.refresh check   # which cited pages changed
PYTHONPATH=. ../.venv/bin/python -m registry.refresh hours   # propose opening hours
PYTHONPATH=. ../.venv/bin/python -m registry.refresh apply   # merge proposals a person approved
```

## Repository map

| Path | What |
|---|---|
| `engine/` | FastAPI. `recommend/` ranker, feedback, chat, nudge, baseline, movement. `aggregate/` k-anonymous cells, dips, insights, county context. `registry/` refresh. `fixtures/` JSON. `tests/` |
| `app/` | React 19, Vite, TypeScript, Tailwind. Pages self-register from `src/pages/<name>/index.tsx` |
| `data/` | Public seed data: resources, events, registrar calendar, findhelp, CDC PLACES, IPEDS, registry state |
| `infra/aws/` | One CloudFormation stack, a Dockerfile, `deploy.sh` |
| `scripts/` | Data loaders and fitters; re-run and commit outputs together |
| `docs/` | `SOURCE_OF_TRUTH.md` (what and why), `API_CONTRACT.md`, `EVIDENCE.md` (every number and its source), `DATASETS.md`, `DEMO.md` (the five-minute walk), `RESEARCH_SCARLETWELL.md` |

## Credits

The wellness instrument is from Swarbrick M, Di Bello A, Eissenstat SJ, Nemec PB, Hien DA, Gill KJ. Psychiatric Services 2025;76(3):263-269. Used here for demonstration; use beyond this demo needs the authors' permission.
