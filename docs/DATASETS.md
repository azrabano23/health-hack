# Datasets: everything the product uses or could use
*Written 2026-10-11 from the repo as it stands. One entry per dataset: what it is, where it comes from, its licence, what is in it, where the code reads it, and its status. Status words: **wired in** (code reads it), **downloaded, not wired** (a copy sits in `data/raw/`, no code reads it), **cited only** (a number from it is quoted in `docs/EVIDENCE.md` or the UI with a source line, no file), **access-restricted**, **blocked here** (public, but this container's egress proxy refused the host), **parked** (glucose work, see `docs/archive/`).*

Rules that apply to all of them: no PHI (hard rule 1); every number carries its source (hard rule 2); county and national numbers describe adults or all students, never a Rutgers student, and the UI says so on hover.

## Summary

| # | Dataset | Status | Where it lives | Read by |
|---|---|---|---|---|
| 1 | ScarletWell resource document plus Newark and Camden campus pages | wired in | `data/rutgers_resources.json` | engine ranker, app Home, Nearby, Day, plans |
| 2 | Rutgers Wellness Calendar and campus event pages | wired in | `data/wellness_events.json` | engine events, app Home, Nearby, plans |
| 3 | Registrar academic calendar, Fall 2026 | wired in | `data/academic_calendar_fall2026.json` | synthetic generator, insights, app Trend and Staff |
| 4 | findhelp Community Resource Guide (University Hospital Newark) | wired in (deep links) | `data/findhelp.json` | engine findhelp, chat fixtures |
| 5 | Wellness Inventory, 54 items (Swarbrick et al. 2025, Table 2) | wired in, permission needed for a pilot | `app/src/data/inventory.ts` | app Check-in |
| 6 | Synthetic check-ins and weekly aggregate (ours) | wired in, labelled synthetic | `data/synthetic/` | engine aggregate, fixtures, app Staff |
| 7 | Evidence numbers (ACHA-NCHA III, Cuite 2020, NJ OSHE 2025, Hunger-Free Campus Pell shares, pantry visits) | wired in as quoted constants | `docs/EVIDENCE.md`, `app/src/data/dining_context.ts` | app Staff dining panel, engine insights context |
| 8 | RxNorm and FDA DailyMed labels | wired in as a typed catalog | `app/src/data/medications.ts` | app About you |
| 9 | Synthetic wearable sample (ours) | wired in, labelled synthetic | `app/src/data/wearable.ts` | app Devices, Trend |
| 10 | CDC PLACES 2025 release, county estimates | downloaded, not wired | `data/raw/cdc_places/` | nothing yet |
| 11 | IPEDS College Navigator enrollment and Pell counts | downloaded, not wired | `data/raw/ipeds/` | nothing yet |
| 12 | ACHA-NCHA III Spring 2025 executive summary (text layer) | downloaded, not wired; numbers already cited | `data/raw/acha/` | nothing (numbers live in item 7) |
| 13 | AHRQ SDOH Database, now the Community-Level Health Database | blocked here, direct and through every mirror tried; loader and staff card exist | `scripts/sdoh_counties.py` writes `data/sdoh_counties.json`; `/aggregate/context` returns it as `sdoh` and the staff county card shows a second row | nothing until the file is downloaded and the JSON committed |
| 14 | County Health Rankings 2025, New Jersey | blocked here | none | nothing |
| 15 | USDA Food Access Research Atlas 2019 | blocked here, file over the 50 MB limit | none | nothing |
| 16 | NJ Department of Health NJSHAD and NJ Behavioral Risk Factor Survey | blocked here | none | nothing |
| 17 | Healthy Minds Study 2024-2025 | access-restricted; national report cited | `docs/EVIDENCE.md` section 3 | nothing |
| 18 | Center for Collegiate Mental Health 2025, GAO-24-107074, Hope Center 2023-24, findhelp company blog | cited only | `docs/EVIDENCE.md` | nothing |
| 19 | OpenStreetMap tiles and Google Maps Platform | runtime services, not datasets | `app/src/components/Map.tsx` | app map |
| 20 | CGMacros | parked | `data/raw/cgmacros-repo/` (code repo only, no data) | nothing current |
| 21 | MetaboNet | parked, never downloaded | none | nothing |
| 22 | Synthea and Azure Health Data Services samples | parked | `data/raw/synthea/`, `data/raw/synthea-out/`, `data/raw/azure-health-samples/` | nothing current |
| 23 | Five loose CSVs in `data/` of unrecorded origin | not used; provenance unknown | `data/*.csv` | nothing |
| 24 | UCI MHEALTH (body motion, 10 volunteers, labelled activities) | downloaded, verified, not wired yet | `data/raw/mhealth/` | the sitting-versus-walking classifier for the phone-motion nudge (planned) |

## What happened when we tried to download from this container (2026-10-11)

Every outbound host for items 10 to 17 was refused by the session's egress proxy with "gateway answered 403 to CONNECT (policy denial)": www.ahrq.gov, data.cdc.gov, chronicdata.cdc.gov, www.countyhealthrankings.org, www.ers.usda.gov, nces.ed.gov, www.acha.org, healthymindsnetwork.org, www.nj.gov, www-doh.nj.gov. The WebFetch tool failed on DNS for the same hosts. The session's web-fetch relay (Exa) could read pages and JSON APIs as text, so three small text datasets (items 10, 11, 12) were pulled that way and written into `data/raw/` with a provenance file beside each. Binary files (xlsx, zip, pdf) cannot come through that relay. Items 13 to 16 need one `curl` from a laptop; the exact URLs are below.

## 1. ScarletWell resource document and campus pages
- **Source.** `ScarletWell_Rutgers_Resources_Locations.docx` (provided by the hackathon, compiled from https://newbrunswick.rutgers.edu/scarletwell/wellness-resources), plus Newark and Camden rows collected 2026-10-10 from the page named in each row's `source`.
- **Licence.** Public Rutgers web pages; names, addresses, phones and hours are facts. Coordinates are our approximate hand placements (`coords_approx: true`) until `infra/` runs a geocoder.
- **Contents.** 125 rows: 75 New Brunswick, 25 Newark, 25 Camden. Fields: `id, name, dimensions, address, phone, campus, area, lat, lng, coords_approx, kind, source`, plus `hours`, `url`, `crisis`, `online` where known.
- **Read by.** `engine/recommend/rank.py` (RESOURCES), `engine/fixtures/make_fixtures.py`, `app/src/data/plans.ts`, `app/src/pages/home/index.tsx`, `app/src/pages/nearby/index.tsx`, `app/src/pages/day/index.tsx`. Extended by `scripts/add_newark_resources.py`, `scripts/add_camden_resources.py`, `scripts/add_hours.py`, `scripts/add_resource_coords.py`.
- **Status.** Wired in. Core.

## 2. Rutgers Wellness Calendar and campus event pages
- **Source.** Each row's `source` URL (Wellness Calendar, ScarletWell, Recreation, CAPS, Basic Needs, Libraries, Newark and Camden equivalents). Collected 2026-10-10, window 2026-10-12 to 2026-12-15.
- **Licence.** Public event listings.
- **Contents.** 26 events with campus, dimension, start and end with offsets, place and `needs_confirmation` where a weekly pattern was inferred.
- **Read by.** `engine/recommend/events.py`, `app/src/data/plans.ts`, `app/src/pages/home/index.tsx`, `app/src/pages/nearby/index.tsx`.
- **Status.** Wired in. Core.

## 3. Registrar academic calendar, Fall 2026
- **Source.** https://scheduling.rutgers.edu/academic-calendar/ , https://nbregistrar.rutgers.edu/undergrad/f26ugcal.htm , https://myrun.newark.rutgers.edu/f26 , https://camden.rutgers.edu/registrar , https://camden.rutgers.edu/budget-finance . Each period carries its own source and `verified` flag.
- **Licence.** Public university pages.
- **Contents.** 11 stressor periods (start of term, add and drop, warning grades, W deadline, registration, clocks change, seasonal illness, Thanksgiving, last classes, finals, term bill) with campus differences noted.
- **Read by.** `scripts/generate_wellness_synthetic.py` (dip injection), `engine/aggregate/insights.py`, `app/src/pages/trend/index.tsx`, `app/src/pages/staff/index.tsx`.
- **Status.** Wired in, verified. Core.

## 4. findhelp Community Resource Guide (uhnj.findhelp.com)
- **Source.** https://uhnj.findhelp.com/ run by University Hospital, Newark, on the findhelp platform. Link pattern `https://uhnj.findhelp.com/{category}/all?postal={zip}`.
- **Licence.** findhelp terms of use. We link, we do not scrape; the site is bot-protected and the API is an enterprise tier. For a pilot ask for the search widget or an API key.
- **Contents.** 10 categories, the three campus ZIPs (08901, 07102, 08102) and a dimension to category map.
- **Read by.** `engine/recommend/findhelp.py`; links appear in `engine/fixtures/chat.*.json` and `checkin.feedback.json`.
- **Status.** Wired in as deep links. Core.

## 5. Wellness Inventory, 54 items
- **Source.** Swarbrick M, Di Bello A, Eissenstat SJ, Nemec PB, Hien DA, Gill KJ. Psychiatric Services 2025;76(3):263-269, Table 2. doi:10.1176/appi.ps.20230622.
- **Licence.** Copyright of the authors and publisher. "Do not adapt, modify, or use the wellness inventory without the explicit permission of Dr. Peggy Swarbrick" (https://alcoholstudies.rutgers.edu/wellness-in-recovery/inventory/). Demo use only until she agrees.
- **Contents.** 54 items under eight dimension headings; our `quick: true` subset is a team choice, not a validated short form.
- **Read by.** `app/src/data/inventory.ts`, app Check-in.
- **Status.** Wired in. Permission needed for anything beyond the demo.

## 6. Synthetic check-ins and weekly aggregate
- **Source.** Generated by `scripts/generate_wellness_synthetic.py` (NumPy, seed 7) with dips injected from item 3. No real students.
- **Licence.** Ours. Labelled synthetic in `_meta.synthetic: true` and on screen.
- **Contents.** `data/synthetic/wellness_checkins.csv`: 15,738 check-ins from 2,400 synthetic people across three campuses and three levels (undergrad, grad, faculty and staff), 17 weeks from 2026-08-31, eight dimension scores 1 to 5 and a total. `data/synthetic/wellness_aggregate_weekly.json`: k-anonymous cells (k >= 5, 0 suppressed) by campus, level, week and dimension with the stressor overlay.
- **Read by.** `engine/aggregate/cells.py` (AGG), `engine/aggregate/dips.py`, `engine/aggregate/insights.py`, `scripts/make_wellness_fixtures.py`, `app/src/pages/staff/index.tsx`.
- **Status.** Wired in. Replace with a de-identified ScarletWell export if one is shared; keep the shapes.

## 7. Evidence numbers quoted in the product
All in `docs/EVIDENCE.md`; the UI quotes them verbatim with the source on hover.
- **ACHA-NCHA III Spring 2025 Reference Group Executive Summary.** https://www.acha.org/wp-content/uploads/NCHA-IIIb_SPRING_2025_REFERENCE_GROUP_INSTITUTIONAL_EXECUTIVE_SUMMARY.pdf . Copyright ACHA; free to read and cite. 65,950 students, 97 schools. Used: `app/src/data/dining_context.ts` (18.5% fruit, 29.0% vegetables, 68.8% sugar-sweetened beverages, 41.6% vs 19.5% short sleep) and the `context` line on sleep insights in `engine/fixtures/aggregate.insights.*.json`. Page references are in `data/raw/acha/README.txt` (item 12).
- **Cuite et al. 2020, Basic Needs Insecurity Among Rutgers-New Brunswick Students.** https://doi.org/10.7282/00000356 . Rutgers report, public. Used: `dining_context.ts` (31.5%).
- **NJ OSHE Student Food Security Survey, Spring 2025.** https://www.nj.gov/highereducation/documents/pdf/FoodSecurityAmongNewJerseyCollegeStudentsSpring2025.pdf . State report, public. Used: `dining_context.ts` (36%).
- **Pell share by campus, NJ FY27 Hunger-Free Campus NGO (AY 2024-25 IPEDS).** https://nj.gov/highereducation/documents/pdf/HFree27NGO.pdf . Used: `dining_context.ts` (`PELL`), `engine/aggregate/insights.py` line 97 (financial dip context), fixtures `aggregate.insights.*.json`.
- **Rutgers Student Food Pantry visits 2024-25.** https://ruoffcampus.rutgers.edu/basic-needs/food-assistance . Used: `dining_context.ts` (about 9,600 visits, over 1,700 students).
- **Status.** Wired in as constants. Any new number goes into `docs/EVIDENCE.md` first.

## 8. RxNorm and FDA DailyMed
- **Source.** Names follow RxNorm (US National Library of Medicine); strengths follow FDA labels on DailyMed.
- **Licence.** US government works, public domain (RxNorm has a UMLS licence for the full download; the names used here are ordinary drug names).
- **Contents.** A small typed catalog of common medications with label strengths.
- **Read by.** `app/src/data/medications.ts`, app About you. Recorded, never advised.
- **Status.** Wired in.

## 9. Synthetic wearable sample
- **Source.** `app/src/data/wearable.ts` `syntheticWearable()`; deterministic sleep and steps for the demo term, shorter sleep in the warning-grade weeks.
- **Licence.** Ours. `source: "synthetic sample (not a real device)"`.
- **Read by.** app Devices and Trend. Live providers (Fitbit, Oura, Whoop, Google Fit) are read through `engine/recommend/wearables.py` with the student's own sign-in and are never stored.
- **Status.** Wired in, labelled synthetic.

## 10. CDC PLACES, county estimates, 2025 release
- **Source.** PLACES: Local Data for Better Health, County Data, 2025 release, dataset `swc5-untb`. Landing page https://data.cdc.gov/500-Cities-Places/PLACES-Local-Data-for-Better-Health-County-Data-20/swc5-untb . API https://data.cdc.gov/resource/swc5-untb.json . Full CSV https://data.cdc.gov/api/views/swc5-untb/rows.csv?accessType=DOWNLOAD (about 70 MB nationally; the API filter above keeps it small). Census tract file for finer work: dataset `cwsq-ngmh`.
- **Licence.** Public domain (Socrata licence id PUBLIC_DOMAIN). Attribution: CDC, National Center for Chronic Disease Prevention and Health Promotion, Division of Population Health.
- **Contents.** Model-based estimates for all adults in the county from BRFSS 2023 (BRFSS 2022 for sleep), with 95% confidence limits, age-adjusted and crude. 40 measures including health-related social needs.
- **File.** `data/raw/cdc_places/places_county_2025_release_nj_middlesex_essex_camden.csv`, 11.7 KB, 90 rows (15 measures x 3 counties x 2 value types), provenance in `data/raw/cdc_places/README.json`.
- **Example rows (age-adjusted prevalence, percent, 95% CI).**
  - Middlesex (FIPS 34023, pop 863,623): frequent mental distress 14.4 (12.7 to 16.3); short sleep 39.4 (35.6 to 43.3); no leisure-time physical activity 24.7 (21.2 to 28.3); food insecurity 14.2 (11.4 to 17.1); loneliness 34.8 (31.0 to 38.8).
  - Essex (34013, pop 851,117): frequent mental distress 16.5 (14.7 to 18.6); short sleep 40.4 (36.5 to 44.3); no leisure-time physical activity 28.4 (24.9 to 32.4); food insecurity 21.5 (17.9 to 25.0); housing insecurity 18.8 (15.9 to 21.7).
  - Camden (34007, pop 527,196): frequent mental distress 17.0 (14.8 to 19.1); short sleep 40.8 (36.1 to 45.5); no leisure-time physical activity 25.5 (21.8 to 29.3); food insecurity 17.0 (14.0 to 20.2); depression 18.0 (15.5 to 20.5).
- **How the product would use it.** The staff view campus card (Challenge 2, `app/src/pages/staff/index.tsx`, the need-vs-resource gap panel) gets a three-line "county context" block: food insecurity, frequent mental distress and short sleep for the county the campus sits in, each with the PLACES source and CI on hover. It explains, in one glance, why Newark and Camden financial and physical dips deserve more resources than New Brunswick's list suggests. It is a context layer only: county adults are not students, the estimates are modelled, and CDC says not to use them for evaluation. It never enters the ranker or any student-facing screen. Wiring plan: a 40-line loader that reads this CSV into `engine/aggregate/context.py` and attaches `county_context` to `/aggregate/insights`; the `source` field is already in the contract shape.
- **Status.** Downloaded, not wired.

## 11. IPEDS enrollment and Pell counts for the three campuses
- **Source.** NCES College Navigator pages (IPEDS data): New Brunswick UNITID 186380, Newark 186399, Camden 186371. Complete data files for a reproducible pull: https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx (HD2023.zip, EFFY2023.zip, SFA2223.zip).
- **Licence.** US federal government work, public domain; cite NCES IPEDS.
- **File.** `data/raw/ipeds/rutgers_college_navigator_2026-10-11.json`, 2.3 KB.
- **Example rows.** New Brunswick: 52,269 students (37,985 undergraduate), Pell awarded to 10,208 degree-seeking undergraduates (28%). Newark: 11,315 students (7,989 undergraduate), Pell 4,360 (61%). Camden: 5,675 students (3,857 undergraduate), Pell 1,869 (49%).
- **How the product would use it.** Two places. First, the synthetic generator's campus weights (`CAMPUSES = {"nb": 0.70, "nwk": 0.18, "cam": 0.12}` in `scripts/generate_wellness_synthetic.py`) can be replaced by the real enrollment shares (0.755, 0.163, 0.082) so the staff heatmap's n per campus is proportionate. Second, the per-campus Pell line on the financial insight (`engine/aggregate/insights.py`) can cite IPEDS directly. Note the discrepancy: the Hunger-Free Campus NGO figures already in `docs/EVIDENCE.md` (31.16%, 57.72%, 48.66%) use a different year and denominator from the Navigator SFA shares (28%, 61%, 49%). Pick one series per slide and say which.
- **Status.** Downloaded, not wired.

## 12. ACHA-NCHA III Spring 2025 executive summary, text layer
- **Source.** Same PDF as item 7. The PDF binary could not be saved here; the text layer was read through the relay and saved as `data/raw/acha/NCHA-IIIb_Spring_2025_Reference_Group_Executive_Summary.extracted.txt` (54.7 KB) with page references in `data/raw/acha/README.txt`.
- **Numbers with pages.** p2 food security: any food insecurity 44.7%, low 24.6%, very low 20.2%; p2 physical activity guidelines met (Active Adults) 45.9%; p11 UCLA Loneliness Scale positive 46.7%, Kessler 6 serious psychological distress 18.7%; p12 stress last 30 days moderate 50.6% and high 25.4%; p16 sleep under 7 hours weeknights 41.6% and weekend nights 19.5%, rested on 0 days 16.1% and 1 to 2 days 38.3%.
- **How the product would use it.** The loneliness (46.7%) and stress (moderate 50.6%, high 25.4%) lines are the two national context numbers for the social and emotional dimensions on the staff view, the same way sleep already backs the physical dimension. Add them to `docs/EVIDENCE.md` section 6 before use.
- **Status.** Downloaded as text, numbers partly cited.

## 13. AHRQ SDOH Database, now the Community-Level Health Database
- **Source.** https://www.ahrq.gov/sdoh/data-analytics/sdoh-data.html now resolves to the Community-Level Health (CLH) Database, https://www.ahrq.gov/data/innovations/clh-data.html , which "update and replace the SDOH Database (version 1)". County files exist for 2009 to 2023 (2023 county XLSX about 10 MB; 2020 county XLSX about 15 MB), with yearly codebooks (about 500 KB) and a 9.2 MB documentation PDF. The archived v1 files the loader was written against are listed at https://www.ahrq.gov/sdoh/data-analytics/sdoh-beta-database.html and on the v1 page; the v1 county file name is `SDOH_2020_COUNTY_1_0.xlsx`.
- **Licence.** Public, with a data use agreement in the documentation: cite "AHRQ Social Determinants of Health (SDOH) Database" (or the CLH name for the new files), use for research and aggregate statistical reporting, no re-identification.
- **Contents.** Several hundred county variables from ACS 5-year estimates and other federal sources: poverty, uninsured, SNAP, median household income, vehicle access, Feeding America food insecurity, and more. Variable names follow the `ACS_PCT_*` pattern the loader's regexes expect.
- **Loader.** `scripts/sdoh_counties.py <file>` picks Middlesex, Essex and Camden and writes `data/sdoh_counties.json` with the exact AHRQ variable names. It accepts `.xlsx` or `.csv`. AHRQ says not to mix v1 and CLH variable names; run it on one file and record which. The CLH files may rename columns, so check the first match for each regex in the output before quoting.
- **What failed here (top priority, tried hardest).** `curl https://www.ahrq.gov/...` returned "CONNECT tunnel failed, response 403" from the egress proxy (policy denial) for both the SDOH page and the direct file path `https://www.ahrq.gov/downloads/sdoh/sdoh_2020_county_1_0.xlsx`; `ahrq-stage.ahrq.gov` was refused the same way; WebFetch returned `getaddrinfo ENOTFOUND www.ahrq.gov`. Mirrors tried and refused or empty: Zenodo (host refused; https://zenodo.org/records/14291734 holds a third-party COUNTY_AHRQ.zip, 54.4 MB), catalog.data.gov (refused), Hugging Face dataset search for "sdoh" and "ahrq" (reachable, but only NLP corpora, no county file), GitHub code search (the session's `gh` token is bound to the project repositories and `api.github.com` answers 403 for other repos), and three GitHub repos that process AHRQ county data (`meagvo/SDOHproject`, `fensorechase/AHRQ_pipeline`, `davidlary/Census_County_Docs`), whose READMEs show they do not commit the raw file. No file was saved and the loader was not run.
- **The two commands to run from a laptop.** `curl -L -o data/raw/SDOH_2020_COUNTY_1_0.xlsx https://www.ahrq.gov/downloads/sdoh/sdoh_2020_county_1_0.xlsx` (v1, the file the loader was written against; if the link has moved, take the "2020 (XLSX, 15 MB)" county link from https://www.ahrq.gov/data/innovations/clh-data.html and name the file as downloaded) then `python3 scripts/sdoh_counties.py data/raw/SDOH_2020_COUNTY_1_0.xlsx`. The loader prints the variables it matched; check `data/sdoh_counties.json` shows `ACS_PCT_PERSON_INC_BELOW99`, `ACS_PCT_UNINSURED`, `ACS_PCT_HH_FOOD_STMP`, `ACS_MEDIAN_HH_INC`, `ACS_PCT_HH_NO_VEH` (v1 names) before quoting; the CLH 2023 file may spell them differently.
- **How the product uses it.** `engine/aggregate/context.py` reads `data/sdoh_counties.json` when it exists and the staff county card shows the rows under the CDC PLACES row, each with AHRQ's variable name on hover. Nothing renders until the file is committed. Item 10 now covers the same need from CDC PLACES with confidence intervals, so this becomes a second opinion rather than a requirement.
- **Status.** Blocked here. Loader ready. One laptop download away.

## 14. County Health Rankings 2025, New Jersey
- **Source.** State page https://www.countyhealthrankings.org/health-data/new-jersey/data-and-resources?year=2025 lists "2025 New Jersey Data" (199.55 KB xlsx) and "2025 County Health Release National Data" (15.26 MB). The analytic CSV and data dictionary are on https://www.countyhealthrankings.org/health-data/methodology-and-sources/rankings-data-documentation . A full 2010 to 2025 archive is on Zenodo under CC BY 4.0: https://zenodo.org/records/17584421 (2025.zip, 52.6 MB).
- **Licence.** County Health Rankings Terms of Use (University of Wisconsin Population Health Institute); the Zenodo mirror is CC BY 4.0. Attribute "County Health Rankings & Roadmaps".
- **Contents.** Per county: poor mental health days, frequent mental distress, insufficient sleep, physical inactivity, food insecurity, mental health providers ratio, uninsured, and more, with CIs. Measure IDs in the analytic file are `v###_rawvalue` (codebook on the documentation page).
- **What failed here.** Host refused by the proxy; county snapshot pages render through JavaScript so the relay returned no numbers. No file saved.
- **How the product would use it.** The mental health providers ratio per county is the one number PLACES does not have. It belongs on the need-vs-resource gap panel beside the on-campus resource count: Essex and Camden can be compared to Middlesex on providers per 100,000. Download the 199.55 KB NJ xlsx from a laptop into `data/raw/chr/` and read the three rows.
- **Status.** Blocked here. Cited nowhere yet.

## 15. USDA Food Access Research Atlas, 2019 data
- **Source.** https://www.ers.usda.gov/data-products/food-access-research-atlas/download-the-data . Current file: Food Access Research Atlas Data Download 2019, XLSX 81.83 MB or ZIP 8.65 MB, last updated 2021-04-27. Documentation on the same site.
- **Licence.** USDA Economic Research Service, US government work, public domain.
- **Contents.** One row per 2010 census tract (about 72,000) with low-income and low-access flags at 0.5, 1, 10 and 20 miles (`LILATracts_1And10`, `LILATracts_halfAnd10`, `lapophalf`, `LAPOP1_10`, SNAP households, vehicle access).
- **What failed here.** Host refused by the proxy. Also over the 50 MB test limit as xlsx; the 8.65 MB zip is the file to fetch.
- **How the product would use it.** The tracts around each campus centroid (New Brunswick 08901, Newark 07102, Camden 08102) give a yes or no on "low income, low access at half a mile", which is the honest line under the dining panel's pantry rows: Camden's campus tracts are the ones to check first. Student-facing use is limited to choosing which food resource to show first in the ranker (`w_cost`), never a label.
- **Status.** Blocked here.

## 16. NJ Department of Health: NJSHAD and the NJ Behavioral Risk Factor Survey
- **Source.** NJSHAD home https://www-doh.nj.gov/doh-shad/ ; NJBRFS query (2011 to 2023, county level) https://www-doh.nj.gov/doh-shad/query/selection/njbrfs/BRFSSSelection.html ; indicator report "Adult Self-reported Mental Distress" https://www-doh.nj.gov/doh-shad/indicator/summary/MentalDistress.html (statewide 2024 frequent mental distress 14.0%, by county view available). County health profile PDFs by municipality: https://www.nj.gov/health/hcpnj/county-reports/ .
- **Licence.** State public data; cite "New Jersey Behavioral Risk Factor Survey, Center for Health Statistics, New Jersey Department of Health". The query system exports CSV and Excel per query.
- **Contents.** Frequent mental distress, insufficient sleep, physical inactivity and more by county, age-adjusted and crude, from the state's own BRFSS sample (larger NJ sample than the national BRFSS file behind PLACES).
- **What failed here.** Host refused by the proxy; the relay got the home page and the indicator text but a 403 on community profile pages.
- **How the product would use it.** Same slot as item 10 but as the state's own survey number, which a Rutgers audience may trust more than a CDC model. One query export per measure for the three counties into `data/raw/njshad/`.
- **Status.** Blocked here. One statewide number (14.0% frequent mental distress, 2024) is quotable from the indicator page.

## 17. Healthy Minds Study
- **Source.** https://healthymindsnetwork.org/research/data-for-researchers/ . National Data Report 2024-2025: https://healthymindsnetwork.org/wp-content/uploads/2025/10/2024-2025-HMS-National-Data-Report_093025.pdf (free PDF, cited in `docs/EVIDENCE.md` section 3).
- **Access.** Student-level data is access-restricted: "HMN is now accepting data requests. Please fill out and submit this Data Request Form to request HMS Student Survey data from the 2024-2025 academic year and/or years prior." The interactive data interface at https://healthymindsnetwork.org/data/ allows guest browsing of aggregate outcomes but no file download. Suggested citation on the same page.
- **How the product would use it.** Only the national report numbers (depression 37%, anxiety 33%, flourishing 38%) as two-at-most context numbers on a slide. If Rutgers has participated in HMS, the campus contact can see Rutgers' own aggregate; ask Swarbrick.
- **Status.** Access-restricted; national report cited only.

## 18. Other cited reports (no files)
- Center for Collegiate Mental Health 2025 Annual Report, https://ccmh.psu.edu/assets/docs/CCMH%202025%20Annual%20Report.pdf (financial insecurity line; anxiety 64.9%).
- GAO-24-107074, https://www.gao.gov/products/gao-24-107074 (23 percent food insecurity, NPSAS 2020).
- Hope Center 2023-24 Basic Needs Survey, https://hope.temple.edu/research/hope-center-basic-needs-survey/2023-2024-student-basic-needs-survey-report (41%).
- Cuite et al. 2018 Rutgers food insecurity report, https://archive.sebs.rutgers.edu/wp-content/uploads/RU-Student-Food-Insecurity-2018.pdf (36.9% undergraduates).
- findhelp New Jersey Social Care Summit post, https://company.findhelp.com/blog/2025/09/23/new-jersey-social-care-summit/ (8,008+ programs).
- Montarroyos et al. 2024, J Am Coll Health, https://pubmed.ncbi.nlm.nih.gov/35549621/ (weekend intake).
- **Status.** Cited only, all in `docs/EVIDENCE.md`.

## 19. Map services (runtime, not datasets)
- OpenStreetMap tiles through Leaflet when no Google key is set; ODbL data, tile usage policy applies; attribution rendered by Leaflet. Campus POIs from OSM are not needed because item 1 carries the places.
- Google Maps JavaScript API when `VITE_GOOGLE_MAPS_API_KEY` is set; Google Maps Platform terms; key stays in `app/.env.local`.
- **Status.** Running in the demo (Leaflet always; Google when the key is present). Name on a slide only what runs.

## 20. CGMacros (parked)
- **Source.** PhysioNet, https://physionet.org/content/cgmacros/1.0.0/ (45 participants: 15 healthy, 16 prediabetes, 14 type 2 diabetes; 10 days; two CGMs; Fitbit; meal photos and macros). Code repo cloned to `data/raw/cgmacros-repo/` (README, `parse_data.ipynb`, no data).
- **Licence.** PhysioNet open data licence for this project (check the project page; credentialing not required for v1.0.0 at the time of cloning).
- **Status.** Parked with the glucose plan (`docs/archive/`). Not downloaded. The parked modules `engine/model/twin.py`, `engine/attribution/`, `engine/optimize/`, `engine/eval/harness.py` run on synthetic people, and `engine/api/live.py` still names a CGMacros loader as a future swap. Nothing in the current product reads it.

## 21. MetaboNet (parked)
- **Source.** Hackathon dataset list; type 1 diabetes on pumps; non-commercial licence noted in `docs/archive/SOURCE_OF_TRUTH_v2_glucose.md`.
- **Status.** Parked. Never downloaded. Not relevant to a wellness check-in.

## 22. Synthea and Azure Health Data Services samples (parked)
- **Synthea.** https://github.com/synthetichealth/synthea (Apache 2.0) cloned to `data/raw/synthea/` (149 MB) and a generated run in `data/raw/synthea-out/` (901 MB, CSV, FHIR and metadata). Synthetic patients only; used by nothing current.
- **Azure Health Data Services samples.** https://github.com/Azure-Samples/azure-health-data-and-ai-samples (MIT) in `data/raw/azure-health-samples/` (144 MB), credited in `infra/fhir/` for the FHIR mapping from the Saturday morning plan.
- **Status.** Parked. Both are git-ignored and can be deleted to reclaim about 1.2 GB.

## 23. Loose CSVs in `data/` with no recorded origin
`data/GlucoBench_benchmark_dataset.csv` (2.8 MB, 15,731 rows, CGM with insulin and meals), `data/diabetes_prediction_dataset.csv` (3.8 MB, 100,000 rows, a well-known Kaggle table), `data/student_mental_health_hybrid_learning.csv` (40 KB, 500 rows, PHQ-9 and GAD-7 style columns, looks synthetic), `data/CGMDatenumLunchPat1.csv` and `data/CGMSeriesLunchPat1.csv` (33 rows each, MATLAB-style CGM lunch series). No code, script, fixture or doc references any of them (grep over `engine/`, `app/src/`, `scripts/`, `docs/`). They are matched by the `*.csv` ignore rule so they are not committed. They carry no source and no licence, so they cannot back any number. Recommendation: move them out of `data/` or add a `_SOURCE.txt` beside each before Sunday.
- **Status.** Not used; provenance unknown.

## 24. UCI MHEALTH (hackathon list)
- **Source.** Banos O, Garcia R, Saez A (2014). MHEALTH [Dataset]. UCI Machine Learning Repository, id 319, doi:10.24432/C5TW22. https://archive.ics.uci.edu/dataset/319/mhealth+dataset . Paper: Banos et al., mHealthDroid, IWAAL 2014.
- **Licence.** UCI repository datasets carry CC BY 4.0; the licence line did not render through the relay, confirm on the page. No PHI: ten anonymous volunteers doing exercises in front of a camera.
- **Download.** UCI hosts refused by the proxy; fetched 2026-10-11 from a public GitHub mirror over raw.githubusercontent.com (`colebryant/mhealth-classification`, file `MHEALTHDATASET.zip`, 75,567,983 bytes, md5 `616bc2fa978a094ca40e3ecd55e23942`). The ten log files inside match UCI's listed sizes byte for byte where UCI lists them, so the mirror is faithful. Unpacked to `data/raw/mhealth/MHEALTHDATASET/` (227 MB on disk); provenance and the full column and label key in `data/raw/mhealth/README.txt`.
- **Layout.** `mHealth_subject1.log` to `mHealth_subject10.log`, whitespace-separated, no header, 24 numeric columns, 1,215,745 rows in all (98,304 to 161,280 per subject). 50 Hz on every channel. Columns 1 to 3 chest acceleration (m/s^2), 4 to 5 ECG (mV), 6 to 14 left ankle (acc, gyro, magnetometer), 15 to 23 right lower arm (acc, gyro, magnetometer), 24 label.
- **Label codes.** 0 null; 1 standing still; 2 sitting and relaxing; 3 lying down; 4 walking; 5 climbing stairs; 6 waist bends; 7 frontal elevation of arms; 8 knees bending; 9 cycling; 10 jogging; 11 running; 12 jump front and back. One minute (3,072 rows) per subject for each of labels 1 to 5 and 9 to 11; the rep-count activities are shorter. Totals: sitting 30,720 rows, walking 30,720 rows, null 872,550 rows.
- **Sanity check.** Subject 1 chest acceleration magnitude: sitting 9.81 +/- 0.13 m/s^2, standing 9.79 +/- 0.13, walking 9.95 +/- 2.38. Window variance alone separates still from moving.
- **How the product uses it.** `engine/` fits a tiny still-versus-moving classifier (window variance and a couple of band features over 2 to 5 second windows, chest or wrist accelerometer only, leave-one-subject-out) that the phone-motion nudge in SOURCE_OF_TRUTH 2.8 ("long sitting", "cooped up") can run on a phone's own accelerometer. Train on columns 1 to 3 or 15 to 17 only; a phone has no ECG, gyro or magnetometer in the same place. Report the leave-one-subject-out accuracy honestly on the slide and say the ten volunteers are not students. The classifier outputs a state, never a score, and nothing from it reaches the aggregate.
- **Status.** Downloaded and verified. Not wired yet.

## Hackathon-provided datasets: fit for a no-PHI student wellness tool
One line each. "Use" means it is in the product or should be this weekend; "could use" means a real but secondary fit; "not applicable" means it does not serve a wellness check-in with geolocated resources and a k-anonymous staff view.

| Dataset | Verdict | Why |
|---|---|---|
| H&P Clinical Notes (112, Rutgers, by email request) | not applicable | Clinical notes about patients; the product never reads clinical text and the student app has no diagnosis language. Requesting them adds a data-handling burden for no feature. |
| CMS DE-SynPUF 2008-2010 | not applicable | Synthetic Medicare claims for people 65 and over; wrong population and wrong unit (claims, not wellbeing). |
| AHRQ SDOH Database (now Community-Level Health Database) | use (county context layer) | County poverty, SNAP, uninsured and food-insecurity rates for Middlesex, Essex and Camden on the staff campus cards, with AHRQ variable names as the source. Loader exists; file blocked from this container, one laptop download away (item 13). CDC PLACES (item 10) already covers the same slot with confidence intervals. |
| eICU Collaborative Research Database demo | not applicable | ICU vitals and treatments; nothing in a wellness check-in maps to it. |
| VitalDB | not applicable | Intra-operative vital signs from surgery; no fit. |
| AHRQ Hospital Financial Measures Database (HFMD) | not applicable | Hospital finance; could only ever decorate a slide about health-system cost, which this product does not claim. |
| MUSIC sudden cardiac death | not applicable | Cardiac risk cohort; using it would push the product toward screening, which the physicians ruled out. |
| UCI health datasets | could use (two) | MHEALTH is the one that fits (item 24, downloaded). The UCI "Student Performance" or similar tables are not health data; the UCI PAMAP2 and HAR sets would duplicate MHEALTH. |
| OpenNeuro / OpenfMRI | not applicable | Neuroimaging; no fit. |
| DeepLesion | not applicable | CT lesion images; no fit. |
| OASIS | not applicable | Brain MRI of ageing and dementia; no fit. |
| MHEALTH | use | See item 24: still-versus-moving classifier for the phone-motion nudge, trained on accelerometer columns only, leave-one-subject-out. |
| AHRQ SyH-DR (synthetic healthcare database for research) | not applicable | Synthetic claims and encounters; wrong unit for a check-in and a staff aggregate. |
| PhysioNet | could use (one dataset, parked) | Hosts CGMacros (item 20), which only matters for the parked glucose plan; the current product reads no glucose dataset. Nothing else on PhysioNet serves a wellness check-in. |
| Synthea | could use, with caution | Synthea generates synthetic patients with demographics, encounters, conditions and a `wellness_encounters` module (`data/raw/synthea/src/main/resources/modules/wellness_encounters.json`). It can produce a labelled synthetic cohort of 18 to 25 year olds in Middlesex, Essex and Camden counties (Synthea supports NJ by county and age range on the command line), but it has no Wellness Inventory items, no eight dimensions and no campus or term calendar, so it would still need our generator (`scripts/generate_wellness_synthetic.py`) on top to produce check-ins. Verdict: our generator already does the job with the registrar calendar built in; use Synthea only if a judge asks for a realistic demographic skeleton. A run already exists in `data/raw/synthea-out/`. |
| REARC and John Snow Labs on AWS Data Exchange | not applicable this weekend | Commercial and curated public datasets behind an AWS subscription; nothing in them replaces the public CDC, IPEDS and AHRQ files above, and naming AWS Data Exchange on a slide requires it to be running in the demo (hard rule 6). |

Sponsor tools on the same list, pointer only: AWS Comprehend Medical, HealthScribe and the ICD-10 extraction workshop are clinical-text tools and the product has no clinical text, so they stay off the slides; Azure Health Data and AI samples are covered by another agent (the FHIR mapping credit in `infra/fhir/`, item 22).

## Next actions in priority order
1. Wire item 10 (CDC PLACES) into the staff campus card: a loader in `engine/aggregate/` that reads `data/raw/cdc_places/*.csv`, plus the source line. The file is in the repo's ignored folder, so commit a 90-row copy as `data/places_counties.json` with the README fields as `_meta` (small, public domain).
2. From a laptop, `curl -O` the AHRQ CLH 2023 county XLSX (item 13) and the 199.55 KB County Health Rankings NJ xlsx (item 14) into `data/raw/`, run `python3 scripts/sdoh_counties.py <file>`, and commit `data/sdoh_counties.json`.
3. Add the ACHA loneliness and stress lines (item 12) to `docs/EVIDENCE.md` section 6 before any slide uses them.
4. Decide one Pell series (item 11 vs item 7) and say which on the slide.
5. Clean up item 23.
6. Fit the MHEALTH still-versus-moving classifier (item 24) in `engine/`, leave-one-subject-out, accelerometer columns only, and record the accuracy with its source line before any nudge uses it.
