# Judging rubric, mapped

The rubric (five criteria, 1 to 5 each) and where this project answers each one. Say it in this order on the day.

## 1. Innovation and creativity
- A check-in that talks back in the student's words, one dimension at a time, instead of a 54-item form every 30 days (docs/RESEARCH_SCARLETWELL.md: ScarletWell's own next step asks all items every 30 days).
- A personal baseline per student that learns from their own check-ins and taps (engine/recommend/baseline.py) and never predicts.
- Nudges from the student's own devices at the moment and the place that matter (engine/recommend/nudge.py; phone-only motion sensing fitted on MHEALTH).
- A planner that fits campus events, gym time, prayer and Shabbat around the student's calendar (app/src/data/plans.ts).
- Faith, culture and food as first-class inputs: halal and kosher dining, prayer rooms, Ramadan hours, all sourced (app/src/data/food_faith.ts).

## 2. Technical implementation
- Cloud: engine on AWS App Runner, app on S3 and CloudFront (infra/aws); Bedrock with Guardrails as the model door; Comprehend Medical on free text; ElevenLabs voice; Azure Communication Services for mail and SMS; Azure Maps heat layer; Google Maps; Anakin.io keeping the registry current. Each named only where it runs (docs/AZURE_OPTIONS.md has the checklist).
- Data: 125 resources, 26 events, the registrar calendar, The Arc free-food feed, CDC PLACES county context, IPEDS, MHEALTH, the medication and device catalogs, and an importer for ScarletWell's de-identified inventory export (docs/DATASETS.md).
- Tests: 80 plus engine tests; every endpoint falls back to a fixture so the demo never 500s.

## 3. Healthcare impact
- Numbers with sources on every card (docs/EVIDENCE.md): 46.6% any food insecurity, 46.7% loneliness positive, 41.6% short sleep weeknights (ACHA Spring 2025); Rutgers NB 31.5% undergraduates food insecure (Cuite 2020); Healthy Minds 2024-25 barriers of time and money.
- Operations that act: pantry access gap by day, dated actions a week before each stressor, k-anonymous cells.
- The physicians' line kept: no prediction, no diagnosis, no glucose model.

## 4. Presentation and demonstration
- docs/DEMO.md is the five-minute walk; About you first, then Maya's day, check-in, feedback, nudge, twin, devices, chat, staff view.
- Hosted demo on fixtures; live engine on AWS for chat, photo, voice and verification.

## 5. Feasibility and scalability
- Swap one loader and ScarletWell's own export replaces the synthetic set (scripts/import_inventory.py); the staff view does not change.
- Registry currency is a reviewed proposal flow, not a scrape (engine/registry).
- Privacy by construction: profile, calendar, meals and wearables stay on the phone; the engine holds no table of students; cells under five never leave the engine (docs/RESEARCH_SCARLETWELL.md section 6 on FERPA, HIPAA and k).
- Newark and Camden are data rows, not code.
