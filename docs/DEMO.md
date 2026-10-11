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

## The five minutes (phone on screen, then laptop)
0. **About you, then Your day** (40 s). Open About you: name, campus, medications, family history typed in plain words, sensor, cycle, calendar, counselor invite, the triggers. Then Your day and tap "Walk through Maya's Tuesday". Scroll once: 5.3 hours of sleep, cycle day, the bagel with the family-history note, the sensor nudge at 11:40, the cooped-up nudge at 13:10 (three rained-in days on the watch, Voorhees Mall, Zumba at 6 PM, free), the check-in, the deadline. Say: every line is one input, where it came from, what it meant, one small thing. The engine answered her data for real.
1. **Check-in** (30 s). The ScarletWell layout: tabs, Always to Never. Answer the quick set for Physical, submit. Say: 54 validated items, Swarbrick's own instrument, any subset.
2. **Feedback** (50 s). Strongest first. One small thing. The event this week. The place, then "Why this one": fit before distance. Tap "I went" under the place. Say: that tap is how the ranking learns; only the kind of place and a yes leave the phone.
3. **Nudge** (30 s). Pick Newark, tap "sensor: glucose dropping": one minute from the Paul Robeson Campus Center, a handful of almonds. Then "watch: cooped up in exam week". Say: the device reports, we never predict.
4. **Trend** (30 s). "Your twin": the grey band is her usual, physical sits below it, social above. "What works for you" shows the tap you just made. Say: a running picture of your own usual that sharpens with every check-in; no prediction, nothing stored.
5. **Chat and photo** (40 s). "I can't afford groceries this month", then the camera with a real lunch photo. Say: every reply passes the forbidden-word gate; places and events come from our registry, the model only writes the words.
6. **Devices** (15 s). Connect cards for Apple Watch, Oura, Whoop, Fitbit, Garmin, Samsung, Google Fit. Export today, sign-in after the event. On the phone only.
7. **Staff view** (60 s, laptop). Camden, undergrad. The financial dip in week 8 and the panel: what moved, which stressor, which resources match, the plan. Then the dining panel: 31.5% of NB undergrads food insecure (Cuite 2020), Pell share by campus, the weekend quick-service pattern, this campus's dining halls and pantry, the operational plan. Say: synthetic check-ins, real national and Rutgers numbers with sources, k of 5, never an individual.
8. **Close** (15 s). Three campuses, 125 sourced resources, 26 real events, verified calendar, a twin that learns from taps and never predicts, permission path with Swarbrick.

## If asked
- "Is the inventory validated?" Yes: 54 items, single factor, Psychiatric Services 2025, alpha 0.95, N=3,446. `docs/EVIDENCE.md` has every number.
- "Where does the glucose come from?" Only from a sensor the student connects. We show the reading; we do not model it. The physicians on our team drew that line.
- "What about privacy?" Check-ins and wearables live on the phone. Aggregate cells under five students never leave the engine. Nothing enters the staff view at the individual level.
- "What is trained?" Nothing offline. Ranking is a weighted fit minus distance; the twin is a per-student running mean and band plus a bounded weight shift from taps (engine/recommend/baseline.py); the dip detector is a rule against the registrar calendar; text matching is term similarity. With a term of real check-ins the first model worth training is a week-ahead dip forecast.
- "Is the twin a model of the student?" It is a running picture of their own usual, computed from what the phone sends in each request. It says "about your usual", "above" or "below". It does not say what will happen.
- "Where do the dining numbers come from?" Each one carries its source on the card: Cuite et al. 2020 (Rutgers NB), NJ OSHE Spring 2025, ACHA-NCHA III Spring 2025, NJ FY27 Hunger-Free Campus NGO for Pell shares. The weekday bars are the one synthetic shape on that panel and are labelled so.

## Backups
- Screenshots of every page are in the PR descriptions and `docs/screenshots/` if Arnav added them.
- Fixtures mode: `npm run dev` with no env at all; everything renders, chat and photo answer by template.
