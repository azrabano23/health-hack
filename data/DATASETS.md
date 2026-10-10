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

## Verified structure (from the CGMacros paper and the MetaboNet data dictionary)

### CGMacros (Das et al., Sci Data 12:1557, 2025 — CC BY 4.0; data on figshare, also PhysioNet v1.0.0)
- **Rows are 1-minute**, not 5: Abbott FreeStyle Libre Pro (15-min native) and Dexcom G6 Pro (5-min native) were both **linearly interpolated to 1 min**. Fitbit HR and METs are also 1-min (Fitbit reports METs ×10; the authors mean-filtered with a 20-min window). → **Loader must resample to the challenge's 5-min grid** and keep a `device` column; never average the two devices.
- Device bias: Dexcom reads higher than Libre by **up to 58.7 mg/dL** (healthy group). Group means — Libre: 84.9 / 105.2 / 138.0 mg/dL (healthy / prediabetes / T2D); Dexcom: 122.4 / 135.1 / 165.7.
- Meals: breakfast = protein shakes with designed macros; lunch = Chipotle with designed macros; dinner = free choice. **Lunch ≥ 3 h after breakfast, dinner ≥ 3 h after lunch, only water/black coffee between** — so meal overlap is small by design; the "previous meal in flight" term matters mostly for dinner.
- Meal rows carry kcal, carb, protein, fat, fiber, meal type, and the photo path; timestamps come from WhatsApp photos taken before and after eating (the after-photo gives fraction consumed).
- `bio.csv`: age, gender, ethnicity, height, weight, BMI, HbA1c, fasting glucose, fasting insulin, triglycerides, cholesterol, HDL, non-HDL, LDL, VLDL, three finger-stick glucoses, HOMA-IR. `microbes.csv`: 1,979 bacteria as 0/1. `gut health test.csv`: 22 Viome scores as 0/1/2.
- Groups by HbA1c: healthy < 5.7, prediabetes 5.7–6.4, T2D > 6.4. Ages 18–69, BMI 21–46. Participants 24, 25, 37, 40 absent.
- Authors' baseline (what we must beat and cite): XGBoost (80 trees, depth 1, lr 0.2, L1 = 1) on anthropometrics + bloods + macros + pre-meal glucose, leave-one-subject-out: **AUC ρ = 0.89, iAUC ρ = 0.64** (Libre, breakfast shakes). SHAP for iAUC: fasting glucose #1, carbs #2, pre-meal glucose #3, protein #4 (negative), HbA1c #5; fat weak (#12).

### MetaboNet public parquet ("type 1 diabetes.parquet")
- 37 columns, one row per **5-minute interval**; consolidated set is **203.4 M rows** — **never `pd.read_parquet` the whole file.** Use `pyarrow.parquet.read_table(path, columns=[...], filters=[...])`.
- Core: `CGM` (mg/dL, 83.9% rows), `basal`, `bolus`, `insulin` (IU per 5 min), `carbs` (g; 76.7% of subjects; 0 vs null differs by source), `meal_label` (0.07% rows).
- Wearable fields are sparse: `heartrate` (24.6% subjects / 2.2% rows), `steps` (17.6% / 3.1%), `calories_burned`, `workout_duration`, `workout_intensity` (1–10, 0.01% rows), `workout_label`.
- Demographics: `age`, `gender`, `height` (ft), `weight` (lb), `age_of_diagnosis`, `ethnicity`, `is_pregnant`. Device: `cgm_device`, `insulin_delivery_modality` (MDI/SAP/AID), algorithm, insulin types.
- `source_file` picks the study: for **exercise + HR priors use `T1DEXI`, `T1DEXIP`, `BrisT1D`, `AZT1D`** (structured exercise with HR); `OhioT1DM` has GSR/skin temp (stress proxies, 0.4% of subjects).
- ~17% CGM gaps; timezones mostly localized, some ambiguous; `is_test` and `subject_split_across_traintest` flags exist — respect them.
- Role in our build is unchanged: **insulin/medication kinetics and exercise-response priors only.** It is T1D on pumps/MDI; it is not prediabetes physiology.

```python
# engine/data/metabonet.py — load only what we need
import pyarrow.parquet as pq
cols = ["id","date","source_file","CGM","carbs","insulin","bolus","basal","heartrate","steps",
        "workout_duration","workout_intensity","age","gender","insulin_delivery_modality"]
tbl = pq.read_table("data/raw/metabonet/type1diabetes.parquet", columns=cols,
                    filters=[("source_file","in",["T1DEXI","T1DEXIP","BrisT1D","AZT1D"])])
df = tbl.to_pandas()
```

## Also cloned (code, not data)
- `data/raw/azure-health-samples/` — Azure Health Data & AI samples (FHIR loaders/transforms to borrow for `infra/fhir/`; credit it).
- `data/raw/cgmacros-repo/` — authors' `parse_data.ipynb` (XGBoost + SHAP baseline).
- `data/raw/synthea/` (source) and `data/raw/synthea-out/` (jar + generated cohort).
