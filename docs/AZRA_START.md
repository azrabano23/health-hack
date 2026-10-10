# Azra — start here (5 minutes)

```bash
git pull
cd app && npm i && npm run dev          # runs on fixtures, no backend needed
```
Open the URL. You'll see tabs: Today · Eat · Check-in · Nearby · Share. `Today` already renders a real Band from `engine/fixtures/predict.json`.

## Your files (only edit these)
| Surface | Folder | Spec |
|---|---|---|
| A2 Check-in | `app/src/pages/checkin/` | SOURCE_OF_TRUTH §2.3 |
| A3 Today | `app/src/pages/today/` | §2.3 |
| Eat (dining) | `app/src/pages/eat/` | §2.3 |
| A4 Nearby | `app/src/pages/nearby/` | §2.3 |
| Deck | `docs/` + wherever | WORK_SPLIT A8 |

Nitu's: `pages/share`, `pages/counselor`, `pages/eval`, `components/Band.tsx`, everything in `engine/`.

## Why we won't conflict
- **No shared router file.** A page is `src/pages/<name>/index.tsx` exporting `route` + default component; `App.tsx` auto-discovers it. Never edit `App.tsx` to add a page.
- **One folder per surface, one owner per folder.** Put sub-components inside your folder (`pages/today/WhyBars.tsx`).
- **Data only through `@/api/client`** (`api.predict()`, `api.resources({dimension})`, …). Types in `@/api/types`. Fixtures by default; `VITE_USE_FIXTURES=0` + engine running = live.
- **Shared files** (`components/`, `styles/index.css`, `api/*`): add new files freely; edit existing ones only in a tiny commit, then push immediately.
- `git pull --rebase` before every push. Commit small, push often, straight to `main`.

## Design
`docs/UI_DESIGN.md`. Tokens are already in Tailwind: `bg-paper text-ink text-line bg-band bg-win border-mist font-display font-mono`. Use `<Band points={...} />` for any glucose curve. No red/orange/green, no "should/bad/risk".

## Need something from the engine?
Don't wait: the contract shapes are fixed (`docs/API_CONTRACT.md`) and every fixture exists. If you need a new field, change the contract + fixture + `api/types.ts` in one commit and tell Nitu.

## Live engine (when you want it)
```bash
python3 -m venv .venv && .venv/bin/pip install -r engine/requirements.txt
cd engine && PYTHONPATH=. ../.venv/bin/uvicorn api.main:app --reload     # :8000
cd app && VITE_USE_FIXTURES=0 npm run dev
```
