# Datasets — what we use, where it lives, what's downloaded

All raw data goes in `data/raw/` (git-ignored). `bash scripts/download_datasets.sh` fetches the open sets; two need a human (below).

| Dataset | Role in the build | Source | Size | License | Status (cloud container) | Status (laptop) |
|---|---|---|---|---|---|---|
| **CGMacros** v1.0.0 | **Core** — train/validate the twin; priors by group; device offset | PhysioNet `physionet.org/files/cgmacros/1.0.0/` (also Rutgers SharePoint link in Discord) | ~100s of MB with photos | ODbL | **Blocked** by network policy (repo clone = code only) | run script |
| **MetaboNet** public subset | **Core (narrow)** — insulin/medication kinetics priors only | `metabo-net.org` (register) or Rutgers SharePoint (NetID); `.parquet` | large | non-commercial research | **Blocked** | manual |
| **Synthea** (jar + generated cohort) | **Core (demo)** — 300 synthetic NJ patients aged 18–24, FHIR + CSV; parameter-recovery truth | GitHub release jar | jar ~150 MB; output ~100s MB | Apache-2.0 | **Available** — generating | `scripts/generate_synthea.sh` |
| **MHEALTH** (UCI #319) | Validate HR-intensity feature | `archive.ics.uci.edu/static/public/319/mhealth+dataset.zip` | ~60 MB | CC BY 4.0 | Blocked | run script |
| **AHRQ SDOH** | Aggregate/equity view (ZIP/county) | ahrq.gov SDOH download page | ~50–200 MB | public | Blocked | manual (links change) |
| **Vlada** (data partner) | Business slide: CGM/drug prices, MA plans | vladahealth.com/event?e=ruhack2026 (free until Mon 9 AM) | — | event | — | Finance, in browser |
| eICU demo | not used | PhysioNet | ~50 MB | ODbL | Blocked | `--all` |
| CMS DE-SynPUF | not used | cms.gov | ~GBs | public | Blocked | `--all` (manual) |
| AHRQ HFMD | not used | ahrq.gov | small | public | Blocked | `--all` (manual) |
| VitalDB, MUSIC, OASIS, DeepLesion, OpenNeuro, UCI misc, REARC, John Snow Labs, Rutgers 112 notes | not used (not about meal response in students) | — | — | — | — | skip |

## Cloud-container network note
This session's egress policy allows GitHub (git), PyPI, and the Synthea release asset, and **denies** `physionet.org`, `archive.ics.uci.edu`, `www.ahrq.gov`, `www.cms.gov`, `metabo-net.org`, `rutgersconnect-my.sharepoint.com`, and `menuportal23.dining.rutgers.edu`. To let the cloud agent fetch directly, add those hosts under **Allowed domains** in the environment settings; otherwise download on a laptop and the agent builds against fixtures until the data lands.

## Device data we ingest (no hardware)
We don't make sensors; we read whatever the student already has:
- **CGM:** Dexcom G7 / Stelo (Clarity CSV export; Dexcom API later), Abbott FreeStyle Libre / Lingo (LibreView CSV)
- **Wearables:** Apple Watch via **Apple Health export** (XML), Fitbit (CSV / Web API), Oura (CSV / API), WHOOP (CSV / API), Garmin & Samsung via **Health Connect** (Android)
- **Phone:** steps, sleep (Apple Health / Health Connect)
- **Glucometer:** one-tap manual reading or photo of the meter
- **Cycle:** Apple Health Cycle Tracking / Oura / Fitbit (separate consent scope)
Hackathon scope = **file import** for all of the above + one live connector if time; live OAuth to six vendors is post-hackathon. Importers live in `engine/data/importers/` and normalize to the `timeline` shape in `docs/API_CONTRACT.md`.

## CGMacros layout (from the authors' README)
`CGMacros-#/CGMacros-#.csv` — glucose from two devices, Fitbit activity + HR per timestamp, macros, meal photo paths. Supplementary: `bio.csv` (anthropometrics, glucose/lipid/insulin labs), `microbes.csv` (0/1 presence), `gut health test.csv` (Viome 0/1/2). `parse_data.ipynb` — authors' iAUC/AUC prediction + SHAP (cloned to `data/raw/cgmacros-repo/`). Participants 24, 25, 37, 40 absent.
