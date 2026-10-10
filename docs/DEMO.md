# Demo runbook (Sunday)

*Print this. One person runs the laptop, one talks. Freeze was Saturday 10 PM; nothing below changes code.*

## Before judging (20 minutes, once)
```bash
git pull                                   # main has everything
python3 -m venv .venv && .venv/bin/pip install -r engine/requirements.txt
cd app && npm i && npm run build && cd ..  # proves the app compiles
```
Create `app/.env.local` (never committed) with the Google Maps key:
```
VITE_GOOGLE_MAPS_API_KEY=...
```
Start the engine with the model key in the environment of that terminal only:
```bash
cd engine && ANTHROPIC_API_KEY=... PYTHONPATH=. ../.venv/bin/uvicorn api.main:app --port 8000
```
Start the app live against it:
```bash
cd app && VITE_USE_FIXTURES=0 npm run dev
```
Open the printed URL on the laptop and on a phone on the same wifi. Check `http://localhost:8000/llm/status` says `"available": true`. The Chat header should name the model. If the engine dies mid-demo, every page except live Chat and the photo keeps working on fixtures; restart it between questions.

## The four minutes (phone on screen, then laptop)
1. **Check-in** (30 s). Tap Physical, answer the three quick items, save. Say: 54 validated items, Swarbrick's own instrument, any subset, four-point scale.
2. **Feedback** (60 s). Strongest first. One small thing. The event this week. The place, then tap "Why this one" and read the weights: fit before distance, Vivian's rule. Off campus: findhelp, University Hospital Newark.
3. **Nudge** (30 s). Pick Newark, tap "sensor: glucose dropping". Read it aloud: one minute from the Paul Robeson Campus Center, a handful of almonds. Say: the device reports, we never predict.
4. **Chat and photo** (45 s). Tap "I can't afford groceries this month". Then the camera button with a real lunch photo. Say: every reply passes the forbidden-word gate; places and events come from our registry, the model only writes the words.
5. **Trend and Devices** (20 s). Sleep bars under the sparklines, on the phone only.
6. **Staff view** (60 s, laptop). Camden, undergrad. Point at the financial dip in week 8 and the panel: what moved, which stressor, which resources match, the plan. Say: synthetic data, k of 5, never an individual. ScarletWell's own paper lists this as a future direction.
7. **Close** (15 s). Three campuses, 125 sourced resources, 26 real events, verified calendar, zero trained models by design, permission path with Swarbrick.

## If asked
- "Is the inventory validated?" Yes: 54 items, single factor, Psychiatric Services 2025, alpha 0.95, N=3,446. `docs/EVIDENCE.md` has every number.
- "Where does the glucose come from?" Only from a sensor the student connects. We show the reading; we do not model it. The physicians on our team drew that line.
- "What about privacy?" Check-ins and wearables live on the phone. Aggregate cells under five students never leave the engine. Nothing enters the staff view at the individual level.
- "What is trained?" Nothing. Ranking is a weighted fit minus distance, the dip detector is a rule against the registrar calendar, text matching is term similarity. With a term of real check-ins the first model worth training is a week-ahead dip forecast.

## Backups
- Screenshots of every page are in the PR descriptions and `docs/screenshots/` if Arnav added them.
- Fixtures mode: `npm run dev` with no env at all; everything renders, chat and photo answer by template.
