# ScarletWell TWIN — Rutgers Health Hack 2026

Start here: **`docs/SOURCE_OF_TRUTH.md`**. Then `docs/WORK_SPLIT.md` and `docs/API_CONTRACT.md`.

- `engine/` — Python: data loaders, TWIN model, attribution, optimizer, eval, FastAPI (Nitu)
- `app/` — React/Vite/TS student + counselor dashboards (Azra)
- `data/` — public seed data (`rutgers_resources.json`); raw datasets in `data/raw/` (git-ignored)
- `infra/` — AWS scripts; `infra/fhir/` mapping credited to the Azure Health Data & AI samples
- `docs/` — the project's truth
