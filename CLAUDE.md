# health-hack — agent instructions

**Read `docs/SOURCE_OF_TRUTH.md` before doing anything.** It is the single source of truth for what we are building, why, for whom, with which data, and what we are not allowed to claim. If a request conflicts with it, say so and stop.

Then read, as relevant to your task:
- `docs/WORK_SPLIT.md` — who owns what, and the clock.
- `docs/API_CONTRACT.md` — the engine↔app seam. Do not change shapes without updating the contract and the fixtures in the same commit.
- `docs/MENTOR_NOTES_ANALYSIS.md` — what the mentors and judges actually said.
- `docs/verified-facts-glucose-challenge.md` — every number we are allowed to use, with its primary source.

## Layout
- `engine/` — Python 3.11 (Nitu). `data/` loaders, `model/` TWIN, `attribution/`, `optimize/`, `eval/`, `api/` (FastAPI), `fixtures/` (JSON), `tests/`.
- `app/` — React 19 + Vite + TS + Tailwind + shadcn + Zustand + Recharts + Leaflet (Azra). Runs on fixtures when `VITE_USE_FIXTURES=1`.
- `data/` — public seed data only (`rutgers_resources.json`). Raw CGMacros/MetaboNet downloads go in `data/raw/` and are git-ignored.
- `infra/` — AWS scripts (Location geocoding, optional HealthLake/Comprehend). `infra/fhir/` mapping borrowed from the Azure Health Data & AI samples (credit it).
- `docs/` — this project's truth.

## Hard rules
1. No PHI. Ever. Public datasets or synthetic data only.
2. No number in UI, slides, or docs without a primary source. The engine attaches `source` to every metric; the app renders it on hover.
3. Wellness tool, not clinical. No diagnosis language, no red/orange/green fear UI. Tone: friendly, strengths-based.
4. "Insulin" is never something we measure; our decay parameter is an *insulin-sensitivity proxy*.
5. Do not claim: "first sensor-free prediction" (January AI), "nobody does non-food attribution" (say "no product we could find"), "learns your GLP-1 response in 7 days" (not identifiable), "poor glucose causes bad grades" (association; untested in college cohorts).
6. Only name a sponsor service (AWS/Azure/Vlada) on a slide if it is actually running in the demo.
7. `main` always runs. Branch per task. Small commits.
8. Feature freeze Saturday 10 PM. After that: bug fixes, deck, rehearsal only.

## Commands (fill in as they exist)
- engine: `cd engine && PYTHONPATH=. ../.venv/bin/uvicorn api.main:app --reload` (venv at repo root; `pytest` from `engine/` with `PYTHONPATH=.`)
- app: `cd app && npm i && npm run dev` (fixtures by default; `VITE_USE_FIXTURES=0` = live). Pages self-register from `src/pages/<name>/index.tsx`; see `docs/AZRA_START.md`.
