# Yugma — Rutgers Health Hack 2026 (working title: ScarletWell TWIN)

Start here: **`docs/SOURCE_OF_TRUTH.md`**. Then `docs/WORK_SPLIT.md` and `docs/API_CONTRACT.md`.

- `engine/` — Python: data loaders, TWIN model, attribution, optimizer, eval, FastAPI (Nitu)
- `app/` — React/Vite/TS student + counselor dashboards (Azra)
- `data/` — public seed data (`rutgers_resources.json`); raw datasets in `data/raw/` (git-ignored)
- `infra/` — AWS scripts; `infra/fhir/` mapping credited to the Azure Health Data & AI samples
- `docs/` — the project's truth

## Run it locally

Prereqs: Node 20+ and Python 3.11+.

### 1. UI only (fixtures, no backend) — the fast path
```bash
cd app
npm install
npm run dev
```
Open the URL it prints (usually http://localhost:5173). Student tabs: Today · Eat · Check-in · Nearby · Share. Desktop-only routes: `/#/counselor` and `/#/eval`.
Data comes from `engine/fixtures/*.json`; nothing else needs to be running.

### 2. UI against the live engine
Terminal 1 — engine (FastAPI on :8000):
```bash
python3 -m venv .venv
.venv/bin/pip install -r engine/requirements.txt
cd engine && PYTHONPATH=. ../.venv/bin/uvicorn api.main:app --reload
```
Terminal 2 — app:
```bash
cd app && VITE_USE_FIXTURES=0 npm run dev
```
Override the engine URL with `VITE_API_URL=http://host:8000`.

### Checks
```bash
cd app && npm run typecheck && npm run build     # UI
cd engine && PYTHONPATH=. ../.venv/bin/pytest -q # engine tests
python3 engine/fixtures/make_fixtures.py          # regenerate fixtures
```

### Data
CGMacros / MetaboNet go in `data/raw/` (git-ignored). See `docs/WORK_SPLIT.md` for the loader plan.

New to the UI code? Read `docs/AZRA_START.md` and `docs/UI_DESIGN.md`.

### Keeping the resource registry current (Anakin.io)
Public Rutgers pages are read with [Anakin.io](https://anakin.io)'s URL Scraper; every change becomes a proposal a person approves. Put `ANAKIN_API_KEY=your_key` in a `.env` file at the repo root (git-ignored; or export it in your shell), then from `engine/`:
```bash
PYTHONPATH=. ../.venv/bin/python -m registry.refresh check     # which cited pages changed since last time
PYTHONPATH=. ../.venv/bin/python -m registry.refresh hours     # propose opening hours from each resource's page
PYTHONPATH=. ../.venv/bin/python -m registry.refresh events    # re-check events marked needs_confirmation
PYTHONPATH=. ../.venv/bin/python -m registry.refresh apply     # merge proposals marked "approved" in data/registry/proposals.json
```
`apply --complete` also approves proposals that read all seven days with the deterministic rules. One credit per page; a page shared by several places is read once per run. The staff view's "Resource registry" card (`GET /registry/status`) shows the result.

### Live vs fixture engine
The API serves real TWIN output (a synthetic demo person, `cgm-07`) by default. `ENGINE_LIVE=0` forces fixtures. If a live call errors it logs and falls back to the fixture, so the demo never 500s. Swap `load_person()` in `engine/api/live.py` for the CGMacros loader when N1 lands.
