# ScarletWell, live

**Rutgers Health Hack 2026 · Track: Wellness, Reimagined · Challenge 1 (student check-in, feedback, resources near you), with Challenge 2 (a campus view for staff)**

**Live app: https://scarletwell.com** · Open it on a phone, tap **Your day**, then **Walk through Maya's Tuesday**.

> **In one sentence:** ScarletWell today asks a Rutgers student 54 questions once a month and hands back a number. We turned it into a short, friendly conversation that ends with *one small thing you can do, and exactly where.*

## What ScarletWell is, and what is wrong with it

ScarletWell is Rutgers' wellness program. It is built on a validated instrument, the Wellness Inventory, which looks at eight parts of a life: physical, emotional, social, financial, occupational, intellectual, environmental and spiritual. The science is good. The way a student meets it is not.

Today a student gets a prompt on the MyRutgers portal, answers 54 items in one sitting, and receives a score. Then nothing. No "what does this mean for me", no "what can I do about it this week", no "where is that, and is it open right now". The list of help (counseling, the pantry, the gym, prayer rooms, events) lives somewhere else, kept by hand, written for New Brunswick. Newark and Camden students get a list that does not fit their campus. And the people who plan the support, such as dining hours and workshops, have no view of how students are doing until the damage is done. ScarletWell's own director described this in her words: *it is very static today.*

So a student is asked for a lot, gets little back, and quietly stops answering.

## Maya's Tuesday

Maya is a made-up 19-year-old at Busch. Everything below is the real engine answering her data; you can replay it in the app.

**Morning.** Her watch says she slept 5.3 hours. She does not fill out a form. She taps a mood, one tap, and moves on.

**11:40 AM.** A sensor she chose to connect shows her glucose sliding between classes. Her phone says, in plain words, a snack now will steady it, and that the Paul Robeson Campus Center is a one-minute walk and open. It does not predict anything. Her device reported it; we pointed her to the nearest open place.

**1:10 PM.** It has rained for three days and her watch shows she has barely moved. The app notices she is cooped up in exam week, and offers one step: a walk through Voorhees Mall, and a free Zumba class at 6 PM.

**Evening.** Maya does a two-minute check-in on only the two areas she cares about. The reply leads with what is going well (she is carrying a lot socially), then one small thing for sleep, and one real place with a "why this one" card: it is open, it is free, it is on her campus, and it is close. Fit comes first, distance second. She taps "I went" on a place she tried, and next time the ranking leans toward places like that.

**Next week.** Her trend shows physical sitting below her own usual, with exam weeks shaded. She can see why. Nothing here is a grade, and nothing leaves her phone unless she opts in.

Meanwhile, if students like Maya opt in, a counselor or program lead sees the anonymous picture and not any individual: "Financial stress is rising at Camden three weeks before finals, and the pantry has no weekend access." They can add a Sunday pickup window a week early instead of reacting afterward.

## What we built

One product, two surfaces, one engine.

**For the student**
- **A check-in that is theirs.** Answer one area or all eight, any items, any time. A one-tap mood counts. Scoring works on partial answers and says so.
- **A friend's reply, not a grade.** The strongest area first, then one small thing and one real place or event for each lower one.
- **Fit first, distance second.** The closest place is not always the right one. Every pick shows why.
- **Their own usual.** A running picture of the student's normal per area, so "below my usual" means something. It never predicts.
- **Nudges at the right moment.** From the phone's own motion sensor, a watch or ring they connect, or a calendar showing a deadline crunch. Each becomes one step and the nearest open place.
- **Food, faith and culture counted.** Halal and kosher dining, prayer rooms, pantry hours, free food this week.
- **Chat and voice**, in English and Spanish. "I can't afford groceries this month" gets pointed to the pantry, food events and food help.

**For staff (aggregate only, never an individual)**
- A heatmap by area and week, over the registrar's calendar of exams and deadlines.
- A detector that names the stressor sitting on top of each dip, and what to do by when.
- A need-versus-resources view: pantry access by day, the weekend gap, county context for each campus.
- A question box over the aggregate. Groups under five students are hidden inside the engine.

## How each gap closes

| What was wrong | What a student or staff member gets instead |
|---|---|
| 54 items, once a month, all at once | Any slice, any day. One tap is enough |
| A score with nothing behind it | One strength, one small step, one real place |
| A hand-kept list, the same for everyone | A sourced registry for all three campuses, ranked by fit, with hours and a map |
| Nothing for Newark or Camden | Campus switch; their resources, events and dining are first-class, not an afterthought |
| No view of your own progress | A trend against your own usual, tied to the exam or deadline behind it |
| Staff plan by feel, after the dip | Dips tied to the stressor, with dated actions a week ahead, from groups of five or more |
| Food, faith and culture ignored | Halal and kosher dining, prayer rooms, pantry access by day, free food this week |
| Wearables feel like surveillance | Values stay on the phone and never reach staff |

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
