# Verified facts — Challenge 3 "Predict My Glucose Response" (as of 2026-10-10)

Every item below was checked against a primary source by two independent verifiers (one reading the
primary document, one checking for 2026 supersession). Items marked ⚠ were partially corrected.

## Novelty verdicts (adversarial prior-art check)

| Claim | Verdict | Closest prior art |
|---|---|---|
| Calibrate with CGM, then sensor-free | **NOT novel** | January AI: 5–14 day CGM "AI training" → 15–90 days sensor-free; npj Digital Medicine 2025 (https://www.nature.com/articles/s41746-025-01430-7); US patent 11974863 (periodic-CGM recalibration) |
| GLP-1 companion with part-time CGM | **NOT novel** | Signos GLP-1 Essentials (dose markers on graph + "Estimated Medication Level" that decays between doses, explicitly not used for prediction); Omada GLP-1 track; Oura GLP-1 Insights |
| Meal prediction conditioned on dose-cycle / titration stage | Uncontested, narrow | No product or paper found |
| Same-food counterfactuals (timing / order / activity placement) | Novel as worded | January Inc patent WO2022061145A1 (ceased) covers activity "alternative actions"; GlyTwin, MetaPlate, ReplayBG, Twin Health all change food/carbs/insulin — none fix the meal |
| Adaptive next-test-meal by expected information gain | Novel as worded | Senarathne 2020 (adaptive Bayesian N-of-1 design); Engell 2023 (OED choosing meal sizes for identifiability); 2025 staple-food N-of-1 protocol uses fixed randomized schedule |
| HIIT can raise glucose (as a warning) | NOT novel | Levels auto-flags HR>150 bpm workouts as "strenuous"; Signos, Dexcom tell users |
| Person-specific HIIT rise magnitude with CI | Novel-ish | Academic T1D models (T1DEXI) use intensity; none for non-insulin users as a meal-response term |
| Quantitative attribution of excursions to non-food events (steroids, cycle, sleep, alcohol) | **No product or paper found** (search-based; not proven absent) | Blogs mention causes qualitatively (Signos lists prednisone; 2025 editorial: glucose rises linearly across cycle to late-luteal peak, https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12408320/) |

## Modeling facts

- **GLP-1 parameters are NOT per-person identifiable within 7 days on a stable dose** — drug concentration ~constant across the window; fix at class/dose population values unless the window spans a dose escalation. Semaglutide t½ ~1 wk (Tmax 1–3 d); tirzepatide t½ ~5.4 d; orforglipron t½ 29–49 h, Tmax 4–8 h (within-day timing matters).
- GLP-1 curve-shape mechanics: gastric-emptying delay is large after first dose / each escalation and largely fades by ~3–6 weeks (Zepbound label §12.3: acetaminophen Cmax −55% after first 5 mg dose, no meaningful effect at week 6 on 15 mg — verified verbatim, https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/217806s002lbl.pdf). ⚠ Hjerpsted 2018 (semaglutide 1.0 mg, n=30, DOM): first-hour glucose iAUC −37.8%, first-hour gastric emptying −27%, BUT whole-window glucose iAUC also lower — so GLP-1 needs BOTH an amplitude/decay multiplier and a transient time-to-peak term.
- SURPASS-3 CGM post hoc (Diabetes 2023, 225-OR; T2D, n=243): peak post-meal glucose 180.4/163.2/168.5 mg/dL on tirzepatide 5/10/15 mg vs 198.6 on degludec — verified. No CGM postprandial data exist for non-diabetic obesity or prediabetes on any GLP-1.
- **CGMacros: NO GLP-1 users, NO medication field** (exclusion criteria verbatim: T2D treated with oral meds other than metformin, any injectable GLP-1 RA, or insulin were excluded). 45 participants (15 healthy / 16 prediabetes / 14 T2D), 10 days, two blinded CGMs, Fitbit Sense HR, WhatsApp meal photos, MyFitnessPal logs; breakfasts = protein shakes with varied macros, lunches = Chipotle. PhysioNet v1.0.0 (https://physionet.org/content/cgmacros/1.0.0/). **Dexcom-vs-Libre bias up to 58.7 mg/dL — add device offset term.**
- No public CGM dataset with confirmed GLP-1 users exists.
- Identifiability: ⚠ Erdős 2024 (Sci Rep 14:8037) fit 3 (plasma) or 4 (CGM) free parameters WITH plasma insulin available; CGM-only ceiling of 3–5 is our inference → run a synthetic parameter-recovery experiment. Minimally invasive oral minimal model is a priori non-identifiable → needs Bayesian MAP with population priors.
- Exercise parameterization: Deichmann 2023 (PLoS Comput Biol, code released) — HR/accelerometer intensity Y, 5-min onset delay, prolonged insulin-sensitivity state τ_Z = 600 min, insulin-independent uptake linear in Y, high-intensity regime switch ~80% VO2max where glucose RISES.
- Exercise effect sizes (all verified): post-meal vs control SMD 0.55 [0.34, 0.75]; post-meal vs pre-meal SMD 0.47; **pre-meal vs control −0.13 (NS)**; meal-to-exercise interval is the significant moderator (optimal start 0–29 min after meal); duration/type/intensity did not moderate (Engeroff 2023, Sports Med, https://link.springer.com/article/10.1007/s40279-022-01808-7). Pooled post-meal exercise glucose AUC Hedges' g = −0.317; **HIIT not better than moderate** for postprandial response (g = 0.152, p = 0.17) (Kang 2023, Nutrients). Over 4–10 week programs pre- vs post-meal makes no difference (Slebe 2024).
- GLP-1s raise resting HR in non-diabetic obesity: pooled +3.47 bpm; orforglipron 36 mg +9.29; semaglutide 2.4 mg +3.40; tirzepatide 5 mg +0.52; retatrutide 12 mg +5.52 (Zhang 2026, Eur J Med Res, 15,313 participants, https://link.springer.com/article/10.1186/s40001-026-03933-9). Real-world WHOOP: RHR +3.2 bpm, HRV −6.2 ms in first 12 weeks. **Correct HR-derived features for drug.**
- Baseline to beat: arXiv 2609.11872 (Sept 10, 2026) on CGMacros — zero-shot TS foundation models did not beat Elastic Net / PatchTST; fine-tuned Chronos-Bolt −6.5 to −18% RMSE; meal images + macros via residual fusion cut postprandial RMSE ~15%.

## Drug landscape (verified against FDA / manufacturer documents)

- FDA-approved: Wegovy pill (oral semaglutide 25 mg) 22 Dec 2025; Wegovy HD (7.2 mg) 19 Mar 2026; Foundayo (orforglipron) 1 Apr 2026, weight management only.
- Filed: CagriSema (NDA Dec 2025, US decision guided Q4 2026). Retatrutide: five positive Phase 3s, BLA planned Q1 2027. Survodutide, MariTide, zenagamtide (amycretin): Phase 3, no filing.
- Discontinuation: STEP 1 extension ~two-thirds of weight regained at 1 yr; SURMOUNT-4 +14% weight, fasting glucose +7.6 mg/dL.
- After stopping liraglutide without exercise: 9.6 kg regained in 1 yr vs 3.6 kg after stopping supervised exercise (Jensen 2024, eClinicalMedicine, S-LiTE). 20–40% of pharmacotherapy weight loss is fat-free mass.

## Market / reimbursement (verified)

- **11% of US adults currently take a GLP-1 for weight loss** (Gallup, Jul 2026, updated Sep 2026, n=5,065); 15% ever used. KFF: 12% for any reason.
- 1-year persistence (commercially insured, no diabetes): 33.2% (2021 initiators) → 60.9% (H1 2024 initiators) (JMCP 2026;32(3):281, n=33,607). Omada reports 67%.
- **Medicare GLP-1 Bridge**: Jul 1 2026 – Dec 31 2027, $50 copay, $245 manufacturer net price, prescriber must certify use within a diet-and-exercise program (CMS HPMS memo Apr 21 2026; medicare.gov/glp1bridge).
- **CMS BALANCE (Medicaid)**: manufacturer must fund, at no cost to patient or state, a recurring lifestyle-support program covering diet/nutrition (incl. GI side-effect reduction and muscle/bone maintenance), physical activity, medication adherence, available during and after treatment, with functionality to demonstrate and validate timely engagement, data shared with CMS. Lilly and Novo signed (Mar 2026). Rolling Medicaid launch May 2026 – Jan 2027, through Dec 2031. Part D arm indefinitely delayed Apr 2026. (https://www.cms.gov/priorities/innovation/files/balance-state-medicaid-rfa.pdf)
- **Medicare does NOT cover CGM** for beneficiaries without diabetes, or with diabetes not on insulin / without problematic hypoglycemia; smartphone-only CGMs are non-covered as DME (Policy Article A52464).
- MDPP 2026: max $624/participant-year online, $822 in-person; $18 online session, $27 in-person session, $153 for 5% weight loss, $8/month maintenance; up to 22 sessions in 12 months.
- CPT 99445 (new 2026): RPM device supply for 2–15 days in 30, ~$52.10 national non-facility; mutually exclusive with 99454. **Not confirmed applicable to CGM or prediabetes**; Aetna reportedly excludes 99445/99470 (secondary source). Treat as a hook to verify, not revenue.
- Funding in the category: eMed $200M, Nourish $100M, Signos $20M (Dexcom / BCBS Alabama), Hims–Eucalyptus up to $1.15B. Signos+ ~$150/mo; Stelo <$99.
- Signos's 2026 peer-reviewed cohort (n=3,007, DTT) EXCLUDED GLP-1 users — their published evidence does not cover the GLP-1 population.

## Unresolved / not found

- No CGM study of GLP-1 dose titration glycemic swings.
- No peer-reviewed study isolating the effect of a lifestyle-program requirement on GLP-1 spend or persistence (all vendor-reported).
- Wearable HR-zone intensity validation against lab measures: thin.
- Whether any app quantitatively attributes excursions to steroids / cycle / sleep: none found; absence not proven.

## CGMacros — verified from the data descriptor itself (Das et al., Sci Data 2025, CC BY 4.0)
- Rows are 1-min (both CGMs linearly interpolated: Libre Pro 15-min native, Dexcom G6 Pro 5-min native); Fitbit HR + METs 1-min.
- Dexcom higher than Libre by up to 58.7 mg/dL; group mean glucose Libre 84.9/105.2/138.0, Dexcom 122.4/135.1/165.7 (healthy/pre/T2D).
- Meals: shakes (breakfast), Chipotle (lunch), free (dinner); ≥3 h spacing; water/black coffee only between.
- Authors' baseline: XGBoost LOSO, AUC ρ=0.89, iAUC ρ=0.64; SHAP iAUC rank: fasting glucose, carbs, pre-meal glucose, protein (−), HbA1c.
- Exclusions: T2D on oral meds other than metformin, any injectable GLP-1 RA, or insulin.
- Source: https://www.nature.com/articles/s41597-025-05851-7 ; code https://github.com/PSI-TAMU/CGMacros ; data on figshare (ref 22) and PhysioNet v1.0.0.

## MetaboNet — verified from the public data dictionary (metabo-net.org/data-dictionary)
- 37 columns, 5-min rows, 203.4 M rows consolidated; CGM present 83.9% of rows; carbs for 76.7% of subjects; heartrate for 24.6% of subjects (2.2% of rows); workout_intensity 0.01% of rows.
- Sources with exercise/HR: T1DEXI, T1DEXIP, BrisT1D, AZT1D. OhioT1DM has GSR/skin temperature.
- Paper: Wolff MK et al., J Diabetes Sci Technol 2026, doi:10.1177/19322968261441637.
