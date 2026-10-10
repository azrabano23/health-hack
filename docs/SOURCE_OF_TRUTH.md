# SOURCE OF TRUTH — ScarletWell TWIN · Rutgers Health Hack 2026
*Every agent and every teammate reads this first. It wins over memory. If you learn something that contradicts it, say so and stop. Companion files: `WORK_SPLIT.md` (who/when), `API_CONTRACT.md` (engine↔app), `MENTOR_NOTES_ANALYSIS.md` (what mentors said; handwritten notes take priority over the transcript), `verified-facts-glucose-challenge.md` (every allowed number + source).*

**Clock:** Saturday 2026-10-10 afternoon. Submission **Sunday 12:00 PM**, judging 1 PM, awards 5 PM. Feature freeze **Saturday 10 PM**.

---

## 0. Decision (settled)
**Track:** Wellness, Reimagined (Rutgers Health & BMIHAI). **Build order:** Challenge 3 (glucose engine) → Challenge 2 (clinician/counselor view) → Challenge 1 (student check-in + nearby map, light). One product, one submission, three challenges.

**One sentence:** *ScarletWell TWIN learns how a student's body responds to food in seven days, explains the spikes that aren't food, tells them the one small thing that works for their body right now, and — only if they choose — lets their counselor or clinician see the trend and know when to reach out.*

**The pain point, centered:** Students already know sleep, stress, alcohol, skipped workouts, and late pizza are "bad." Telling them again doesn't work ("no one wants to hear 'be like me'" — team physician). What's missing is a **personal, immediate, non-judgmental signal that shows the effect on *their* body and hands them one small win.** Glucose is the fastest-responding signal we can measure that connects all of those inputs. The product's job is to turn that signal into **strengths, not fear**.

**Strengths-not-fear is a design rule, not a tone:** every screen leads with what went right ("Your walk after lunch kept your peak 30 points lower"), frames deviations as information ("Your body reacted more than usual — here's what lined up with it"), never shows red/orange/green, never says "bad," "risk," "prediabetic," or "you should" in the student app. Evidence for this choice: students engaged more with self-tracking/biofeedback than prescriptive advice (Wellby co-design); autonomy-supportive (SDT) design is the dominant framework in student-wellness app research; Swarbrick's own model "capitalizes on the person's strengths."

---

## 1. Who it's for (personas) and what they get

| Persona | Situation | What they get | Who pays |
|---|---|---|---|
| **Maya, 19, Busch campus** | 5 h sleep, exam at 10, bagel at the Busch Student Center. No CGM. Apple Watch. | "Last time you slept under 6 h, your breakfast hit harder. A 10-min walk after eating kept it steadier. Werblin is 4 min away — want the route?" | Rutgers (ScarletWell) |
| **Devon, 21, Livingston** | Wears a $50 OTC CGM his mom bought; prediabetes in the family; thinks "diabetes" is scary | Sees *why* yesterday's spike happened (two drinks + 4 h sleep), not a score. Dining menu ranked for *his* body, with the carbon tag. | Rutgers; later a grant sensor pool |
| **Priya, 16, high-school junior (future)** | 1 in 3 teens has prediabetes (CDC 2025); OTC CGMs are 18+; parent-managed consent | Sparse-glucose mode + watch; strengths-based; guardian consent; school-nurse view | Pediatric practice / school district (future) |
| **CAPS counselor** | 40-min sessions, weeks apart; no idea what happened between | Opt-in between-visit trends (inventory, sleep, activity, glucose *stability* — never raw grades); "reconnect" nudges by rule | Rutgers CAPS |
| **Student Health clinician / PCP** | Sees HbA1c once a year; patient can't say what drives it | Same consented timeline + event log; "when to come in" rules; exportable summary (FHIR) | Rutgers Student Health; later payers |
| **ScarletWell / Chancellor's office** | A validated inventory that is "a number with nothing behind it" | Aggregate (k≥5) heatmap by dimension × campus × week; resource-gap evidence (Busch/Livingston) | Rutgers |

---

## 2. Student experience (UI/UX spec)

### 2.1 Principles
1. **Fast.** Any screen in ≤2 taps from open. Notebook: "dashboard that is fast."
2. **No manual logging.** Devices feed it. Anything manual is a one-tap chip with a default.
3. **Lead with the win.** Top of every screen = something that went right.
4. **Explain, then offer one thing.** Never a list of five tips. One action, sized to right now ("5 min of stairs").
5. **Your data, your rules.** Consent is a first-class screen, not a modal.
6. **Culturally neutral advice.** We change *when/how/what-first*, never *what cuisine*. Fasting-aware (stretch).
7. **Works without a CGM.** Sparse-glucose mode is the default assumption.

### 2.2a Devices we ingest (we make no hardware)
Students bring whatever they already own; we read it. **CGM:** Dexcom G7 / Stelo, Abbott Libre / Lingo. **Wearables:** Apple Watch (Apple Health), Fitbit, Oura, WHOOP, Garmin/Samsung (Health Connect). **Phone:** steps, sleep. **Glucometer:** one-tap reading or a photo of the meter. **Cycle:** from Apple Health / Oura / Fitbit, own consent scope. Hackathon scope is **file import** (Apple Health export, Dexcom Clarity CSV, LibreView CSV, Fitbit/Oura/WHOOP CSV) plus one live connector if time; live OAuth to six vendors is post-hackathon. Importers normalize to the `timeline` shape in `API_CONTRACT.md`. Full list and status: `data/DATASETS.md`.

### 2.2 Onboarding (≤90 s)
1. Rutgers NetID sign-in (CAS/SSO in production; fake picker in demo).
2. "What do you want from this?" — three chips: *Steadier energy for studying · Sleep & stress · I'm watching my blood sugar.* Sets copy, not features.
3. Connect devices: Apple Health / Fitbit / Oura (HR, RHR, sleep, steps); optional CGM (Dexcom/Libre/Stelo/Lingo); optional glucometer manual entry.
4. Consent screen (plain language, three independent toggles, all **off** by default): share with a counselor/clinician · contribute anonymized data to Rutgers aggregate · keep grade correlations (private, user-entered only).
5. First check-in: Wellness Inventory **short form** (18 items, ~5 min) or **one dimension only**.

### 2.3 Screens
**Home / Today**
- Win card (always first): e.g., "3 steady days in a row" / "Your walk yesterday kept your peak 28 pts lower."
- **Why card** (only when there's an excursion that didn't fit): plain-English attribution bars — *This meal 62% · 4 h sleep 25% · Resting HR up 10%*. Tap any bar → one-sentence explanation + source. If the model isn't sure: "Your body reacted more than I expected, and I don't know you well enough yet to say why. Want to try the same meal again later this week?"
- **One thing** card: a single, sized action for the next 2 hours ("10-min walk after lunch — Passion Puddle loop is 0.4 mi"). Post-meal only (pre-meal exercise ≈ rest in the evidence).
- Energy strip: a 24-h line with meals and sleep shaded. No numbers unless tapped. Language: "steadier / spikier," never "high / bad."

**Eat** (dining integration)
- Pulls today's menu for the nearest hall from Rutgers Dining FoodPro (per-item Nutrition Facts; Busch tags carbon footprint). Ranks items **for this person's modeled response**, shows the carbon tag beside it, and **places** the best matches first (placement works — low-carbon items listed first raised odds of choosing them 22%; labels alone mostly don't — 56% of JHU students said climate labels didn't change their choice).
- Each item: "steadier / medium / spikier *for you*" + the one tweak that helps ("eat the beans first," "walk after").
- Camera: photo → macro estimate *with a range* → predicted curve with a band.
- Fasting mode (stretch): if the user flags fasting, suppress meal prompts; shift advice to iftar timing/order.

**Check-in** (Challenge 1)
- 8 dimensions; take all or **one**; friendly feedback per dimension; total + dimension scores; trend sparkline per dimension; "retake just this one" button.
- After scoring: for each low dimension, **one** concrete next step + **one** nearby real resource (from `data/rutgers_resources.json`), ranked by fit first, distance second (Vivian: "closest isn't always best"). Wellness Calendar events matched to the dimension.

**Nearby**
- Map (Leaflet) with campus toggle NB / Newark / Camden; filter by dimension; green-route suggestion for "walk after meal" using Scarlet Arts Rx walking map locations (Rutgers Gardens, Eco Preserve, Passion Puddle, Voorhees Mall, Buccleuch Park).

**Trends**
- Weekly: steadiness score (coefficient of variation of glucose if available; else sleep regularity + activity), inventory dimensions, sleep, activity. Exam weeks shaded. Opt-in grade dots, private.

**Share** (consent)
- Three toggles with scope detail ("your counselor will see: inventory trends, sleep/activity, glucose *stability*. Will NOT see: raw glucose, meals, grades"). Revoke anytime; shows last time it was viewed.

### 2.5 Life events — collected kindly (cycle, sleep, stress, alcohol, illness, meds, exams)
**Principle:** we never *ask* for sensitive data; we **offer** to understand it. Every channel is off by default, one tap to turn on, one tap to hide forever. No streaks, no guilt: nothing is ever "broken," and a bad day produces a kinder message, not a warning. Illness or a logged hard day **mutes nudges**.

| Event | How we get it (no logging burden) | How we explain it | Never say |
|---|---|---|---|
| **Menstrual cycle** | Apple Health Cycle Tracking / Oura / Fitbit if already tracked; else an optional "period started" chip; a permanent "don't show me cycle insights" switch | "Your body tends to run a little spikier in the week before your period. That's really common, and it's not something you did. Last month a walk after dinner helped — want that reminder again?" | "Your cycle is raising your blood sugar." Anything about weight, fertility, pregnancy |
| **Sleep** | Watch/phone | "Short night. Your body reacted more to breakfast than usual — that's expected. One small thing: a 10-minute walk after lunch." | "You didn't sleep enough." |
| **Stress** | Resting HR / HRV; optional one-word check-in ("rough day?") | "Your resting heart rate has been up this week. Stress does this to everyone's glucose. Here's what steadied things last time." | "You're stressed." |
| **Alcohol** | One-tap chip | "Drinks can make the next morning spikier. Here's a breakfast that was steadier for you." | Anything about drinking less |
| **Illness** | One-tap chip, or RHR spike + low activity | "Looks like you might be under the weather. Rest counts. We'll pause suggestions until you're back." | — (nudges pause) |
| **Meds** (steroids, other) | One-tap from a short list; optional free text via Comprehend Medical | "That medication often raises glucose for a few hours. This isn't a problem to fix — it's useful to know your spike wasn't the meal." | "Talk to your doctor about stopping." |
| **Exam / all-nighter** | Academic calendar + optional chip | "Exam week. Your body's working hard. A steady breakfast and a short walk before helps focus." | Anything about grades |

**Cycle privacy (hard rule):** its own consent scope (`cycle`), separate from everything else; never shared with a counselor unless the student adds that scope explicitly; **excluded from the Rutgers aggregate entirely**; processed on-device where the platform allows. Say this on the security slide.
**PCOS welcome line (copy):** "If you've been told you have PCOS, your body's responses may be different — this tool was built to learn yours, not compare you to anyone." Not a diagnosis; a reason a student who felt judged elsewhere stays.
**Evidence (modest):** glucose rises across the cycle to a late-luteal peak (2025 editorial, PMC12408320); luteal-phase insulin resistance is well documented in T1D cohorts. Attribution priors for cycle live in `engine/attribution/priors.yaml` with those sources.

### 2.4 Copy rules (hard)
Allowed: steady, steadier, spikier, reacted more than usual, lined up with, your body, you chose, one small thing, nice work. Forbidden in the student app: bad, risk, risky, prediabetic, diabetic, warning, danger, should, must, red/orange/green color semantics. Clinical terms live only in the clinician view.

---

## 3. Clinician / counselor experience (Challenge 2)

**Framing:** "signals to reconnect," not diagnosis. Built on measurement-based care (MBC), which campus counseling already uses (PHQ-9, GAD-7, CCAPS-34 with its 7 subscales + Distress Index).

### 3.1 Views
- **Caseload** (opt-in students only): name, last check-in, last visit, consent scopes, a single "needs a look" flag with the reason.
- **Student timeline**: inventory trends by dimension; sleep regularity; activity; glucose *stability* (CV / time-in-steady-range) if shared; events the student chose to share (exam weeks, illness); scales entered in clinic (PHQ-9/GAD-7/CCAPS) on the same axis. **Never raw grades. Never a "diagnosis."**
- **Reconnect** action: one tap sends a pre-written, warm message ("Checking in — want to grab 20 minutes this week?") and logs it.
- **Visit prep**: one-paragraph auto-summary of the interval ("Since Sept 18: sleep regularity down, physical dimension down 2 pts, 3 check-ins, 1 shared event: midterms") with sources.
- **Export**: FHIR bundle (Observation / QuestionnaireResponse) to Student Health via HealthLake (demo) — shows the clinical path.

### 3.2 "When should they come in?" — rule tiers (configurable, shown to the clinician as rules, not black boxes)
| Tier | Trigger | Action |
|---|---|---|
| **Safety** | PHQ-9 item 9 > 0 entered in clinic; any shared glucose < 54 mg/dL or > 250 sustained (if CGM shared); student taps "I need help now" | Immediate outreach + crisis resources (CAPS 848-932-7884, 988) surfaced to student |
| **Trend** | Any dimension drops ≥ 2 points across two check-ins; emotional dimension lowest for 3 check-ins; sleep < 5 h on ≥ 5 of 7 nights; RHR + 8 bpm sustained 5 days; glucose stability worsens two weeks running | "Reconnect" suggestion with the reason; clinician decides |
| **Routine (MBC)** | ~5 visits or 2–3 months since last PHQ-9/GAD-7 | Prompt to re-administer at next contact |
| **Vulnerable window** | Exam weeks (academic calendar), start/end of term | Soft nudge to the student: one strengths-based message + nearest resource |
Thresholds are defaults for the demo; clinicians can edit them. We do not claim they are validated.

### 3.3 Aggregate (ScarletWell / chancellor)
k-anonymity ≥ 5 per cell. Dimension × campus × week heatmap; resource-gap view (low dimension where no matching resource is within 10 min); exam-week overlays; export CSV. This is Swarbrick's "allocation and scheduling" ask.

---

## 4. The engine (Challenge 3) — see `API_CONTRACT.md` for shapes
- Physiology-informed hierarchical Bayesian meal-response twin; **5 free per-person parameters** (carb sensitivity α, decay k_dec = insulin-sensitivity *proxy*, time-to-peak Tp, pre-meal coupling β, time-of-day θ) + exercise gain b with the Deichmann 2023 high-intensity rise; medication effects **fixed at population values** (not identifiable in 7 days).
- Population prior: CGMacros (15 healthy / 16 prediabetes / 14 T2D; **1-min rows → resample to 5-min**, keep device column, offset term). MetaboNet: insulin/med kinetics and exercise priors only (`source_file` ∈ T1DEXI/T1DEXIP/BrisT1D/AZT1D; load with pyarrow column/row filters — 203 M rows). Authors' CGMacros baseline to beat and cite: XGBoost LOSO iAUC ρ = 0.64, AUC ρ = 0.89.
- **Residual attribution:** steady state is learned; **intermittent events** (sleep, RHR shift, alcohol, illness, cycle, steroids/other meds, exercise, late meal, exam) explain deviations, each with a literature prior and a person-specific effect. "Insufficient prior" flag when posterior ≈ prior.
- **Same-meal optimizer:** hour, eating order (protein/veg first: iAUC −38.8% prediabetes, −40.9% healthy, small crossovers), **post-meal** walk timing (start 0–29 min after; SMD 0.55 vs control).
- **Next-meal picker:** expected information gain over the dining menu.
- **Sparse-glucose mode:** watch + photos + events; parameters from prior narrowed by any glucose; show degradation honestly.
- Baselines: Elastic Net + fine-tuned Chronos-Bolt (arXiv 2609.11872, Sept 2026, same dataset). Mandatory synthetic **parameter-recovery** experiment.
- Device offset (Dexcom vs Libre up to 58.7 mg/dL). HR features corrected for GLP-1 RHR effect (+2 to +9 bpm).

---

## 5. Rutgers ecosystem — where it lives
| Rutgers system | How we embed | Status |
|---|---|---|
| **MyRutgers portal** (where the Wellness Inventory widget lives today) | Ship as a widget + deep link; NetID SSO | Mock in demo |
| **Rutgers University mobile app** (hosts the "My Wellness" app since 2021) | Distribution channel for students/faculty/staff | Mention |
| **Wellness Calendar** (Rutgers Health) | Events matched to low dimensions and geolocated | Seed 5–10 events by hand |
| **The Arc** (student activities) | Social-dimension recommendations | Mention |
| **CAPS** (+ Uwill teletherapy) | Counselor view; crisis resources; MBC scales | Demo counselor view |
| **Student Health (Hurtado / Busch-Livingston / Cook-Douglass)** | Clinician view + FHIR export | HealthLake demo |
| **Rutgers Dining FoodPro** (menuportal23) | Daily menus, per-item Nutrition Facts, nutrition-report calculator, carbon labels (Busch); Menus of Change | Scrape 1 hall's menu for the demo |
| **Rutgers Recreation** (Werblin, Livingston, Cook/Douglass, Easton, College Ave) | "One thing" routes to the nearest open facility | Seed data |
| **Scarlet Arts Rx Walking Map / Rutgers Gardens / Eco Preserve** | Green routes for post-meal walks (green exercise effect on well-being 0.478, general pop.; campus green-space evidence consistent in direction, mostly cross-sectional) | Seed data |
| **Student Basic Needs** | Financial/food-security dimension resource | Seed data |
| **ScarletWell grants (Wellness at Work / Connection Grants)** | Funding path for the pilot | Slide |
| **Newark / Camden** | Same architecture; resource lists to be built (stretch: Bedrock agent scrapes campus wellness pages; hand-verify) | Toggle only |

---

## 6. Operations, sustainability, and "what customers want to see"
- **Dining operations (Rutgers Dining):** ranked, personalized menu → better choices without changing the menu; placement-first design; carbon tag shown alongside. Ask Dining for the FoodPro data feed as the first integration. Menus of Change gives them a reason to say yes.
- **Sustainability:** low-carbon items placed first (evidence: OR 1.22); walking routes over driving; fewer disposable sensors by using sparse-glucose mode where it's enough; green space as a wellness resource. Don't overclaim: labels alone are weak; placement + personal relevance is the lever.
- **What a student wants to see:** one honest sentence about their body, one small win, one thing to do, nothing that feels like a grade.
- **What a counselor wants to see:** what happened between visits, in 10 seconds, with a reason to act or not.
- **What the chancellor wants to see:** which dimension is low, where, when — and whether resources are where the need is.
- **What a payer wants to see (§7):** engagement, persistence, and an outcome they can bill against.

---

## 7. Coverage and insurance — the honest map and how our data moves it
**Today:** Medicare covers CGM only for insulin-treated diabetes or problematic hypoglycemia (Policy Article A52464). NJ FamilyCare covers CGM when medically necessary under each MCO's criteria (Aetna NJ: not meeting glycemic targets OR hypoglycemia; UHC NJ: 6-month initial auth; Horizon applies its medical policy). **Prediabetes is not covered anywhere we found.** OTC CGMs (Stelo, Lingo; 18+) are the de-facto path — ~$50 per 2 weeks per mentors. Most students are on Medicaid or a parent's plan; a student-insurance discount is a weak lever.

**Direction of travel (cite carefully):** ADA guidance now supports CGM for non-insulin T2D; CMS expanded Medicare CGM to all insulin users in 2023; a further CMS expansion was *expected* in H1 2026 (analyst note — unconfirmed); Dexcom has a 300-person RCT in non-insulin T2D pending; Medicaid coverage for T2D on GLP-1/SGLT2 is spreading state by state. MDPP pays for prevention ($624–822/participant-year, online allowed through 2029). CPT 99445 pays ~$52 for 2–15 days of RPM data (CGM/prediabetes applicability unconfirmed).

**How our data helps open coverage (this is the slide):** payers move on outcomes. Our consented aggregate produces, for the first time in a college population: engagement and persistence (the thing DPP/GLP-1 programs can't show), glucose-stability change, sleep/activity change, inventory change, and — if students opt in — HbA1c/fasting glucose from Student Health. That is the evidence package a university health plan, NJ FamilyCare MCO, or employer wellness program needs to cover a short OTC sensor wear for at-risk students. Ask: a Rutgers pilot (ScarletWell + Student Health + Dining) that doubles as the coverage study.

**Never say:** "insurance will cover this." Say: "this is the evidence they've told us they need."

---

## 8. Prediabetic teens (expansion slide, not the demo)
CDC (July 2025): **32.7% of 12–17-year-olds (8.4 M) had prediabetes in 2023** — note the method is contested (new glucose adjustment, no peer-reviewed paper; puberty can inflate it). Independent NHANES 2021–23 analysis: **30.8% of 10–19**. Young adults 19–34: 24.0%. T2D incidence in youth 10–19 rose from 9.0 to 13.8/100k/yr (2002→2015). What changes for teens: OTC CGMs are 18+ (sparse-glucose + wearable mode is the teen path), guardian consent, school-nurse/pediatrician view, stronger strengths framing, no weight language. Rutgers has pediatric endocrinology at RWJ — the natural partner. Keep it to one slide.

---

## 9. Datasets — every Rutgers Health Hack resource, mapped
*Acquisition status and the laptop download script: `data/DATASETS.md`, `scripts/download_datasets.sh`. The cloud agent's network policy blocks PhysioNet/UCI/AHRQ/CMS/metabo-net/SharePoint; it has Synthea and the CGMacros code repo.*

| Resource | Use | Status |
|---|---|---|
| **CGMacros** (Challenge 3 provided) | Primary train/validate; priors by group; device-offset term | Core |
| **MetaboNet** (Challenge 3 provided) | Insulin/med kinetics priors only; T1D on pumps, non-commercial license | Core (narrow) |
| **MHEALTH** (UCI) | Validate HR-zone / intensity feature from accelerometer + ECG | Use if N1–N4 green |
| **AHRQ SDOH** | ZIP/county deprivation for the aggregate/equity view and Newark/Camden framing | Light |
| **Synthea** | Synthetic students for the dashboard demo + parameter-recovery truth | Core (demo) |
| **UCI Health & Medicine** | Backup tabular sets (e.g., diabetes readmission) — not needed | Skip |
| **PhysioNet (general)** | Hosts CGMacros/VitalDB; nothing else needed | — |
| **VitalDB** | Surgical waveforms — not relevant | Skip (say why if asked) |
| **eICU demo** | ICU — not relevant | Skip |
| **MUSIC** | Heart-failure ECG — not relevant | Skip |
| **CMS SynPUF** | 2008–10 claims — could size post-acute cost; not for a student product | Skip |
| **AHRQ HFMD** | Hospital finance — not relevant | Skip |
| **AHRQ SyH-DR** | Needs a data request; not in time | Skip |
| **OASIS / DeepLesion / OpenNeuro** | Imaging — not relevant | Skip |
| **Rutgers 112 H&P notes** | Could feed Comprehend Medical demo; not needed | Skip |
| **REARC / John Snow Labs (AWS Marketplace)** | Could supply nutrition/food databases; optional | Skip unless macro DB needed |
| **Vlada (data partner, free until Mon 9 AM)** | CGM/drug pricing, MA plan counts, hospital quality — business slide | Finance |
Judges reward datasets used *with a reason*; skipping with a one-line reason beats forcing.

---

## 10. Sponsor tech — only name what runs
**AWS (primary; Kiro for agentic dev):**
- **Bedrock** — strengths-based copy generation for Why/One-thing cards and the check-in feedback (grounded in our templates + Rutgers resource content; Guardrails: no diagnosis words). The Challenge 1 "RAG check-in" if time.
- **Comprehend Medical** — free-text/voice event entry → structured events (meds, alcohol, illness).
- **HealthLake** — FHIR store for the clinician export (Observation, QuestionnaireResponse, MedicationStatement) + one synthetic student loaded; HealthLake MCP/AgentCore Gateway only if trivially wired.
- **Amazon Location Service** — geocode `rutgers_resources.json`, routing for walks.
- **SageMaker / EC2** — fit TWIN; FastAPI on App Runner or local.
- **HealthScribe** — not used (we aren't transcribing visits). ICD-10 extraction workshop — not used.
**Azure (secondary):** reuse FHIR mapping/loader samples from the Azure Health Data & AI samples repo (credit it); Azure Maps as fallback geocoder. We run one live FHIR store (HealthLake), not two.

---

## 11. Pitch deck (12 slides, 4 minutes; Azra presents, Neuro opens)
1. **Title** — ScarletWell TWIN. "A number with nothing behind it" (Swarbrick) → "a body you can understand."
2. **The student** — Maya's morning (5 h sleep, exam, bagel). The feeling, not the fear.
3. **Why glucose** — fastest signal that connects sleep, stress, alcohol, activity, food. 1 in 4 young adults 19–34 prediabetic (24.0%); 1 in 3 teens (32.7%, CDC 2025). Associations with cognition and mood (HbA1c ↔ cognition in healthy young adults; prediabetes ↔ depression OR 1.25 <50). **Honest line:** no study in a college cohort — this tool is how you'd test it.
4. **What exists and why it fails students** — food-logging apps; scores; fear; cost; coverage only for insulin-treated diabetes.
5. **Product** — live demo: check-in → Why card → One thing → Eat (dining ranked, carbon tag) → Nearby.
6. **The engine** — 7 days → 5 physiological parameters → prediction with a band → attribution of deviations to events → "I don't know you well enough yet." Predicted-vs-observed Day 8 chart + metrics table + baseline comparison. Parameter-recovery plot.
7. **Strengths, not fear** — copy rules; evidence for autonomy-supportive design.
8. **Counselor / clinician** — opt-in timeline; reconnect rules; visit prep; FHIR export.
9. **Embedded in Rutgers** — MyRutgers widget, mobile app, Dining, Recreation, Wellness Calendar, CAPS, Student Health, Newark/Camden.
10. **Operations & sustainability** — placement-first menus, carbon tags, green routes, fewer sensors.
11. **Coverage path** — today vs. direction of travel; what our consented data generates; the pilot as the coverage study. Teens as the next cohort.
12. **Ask** — pilot next semester: ScarletWell + Student Health + Dining; a grant sensor pool; co-authored evaluation. Privacy/security architecture (Cyber) as the closing credibility beat.

Backup: data honesty slide (CGMacros scope; MetaboNet is T1D; synthetic generator; what's unvalidated).

---

## 12. Not allowed (anyone, anywhere)
- "First sensor-free prediction" (January AI has it). "Nobody does non-food attribution" (say "no product we could find"). "Learns your GLP-1 response in 7 days" (not identifiable). "Poor glucose causes bad grades" (association; untested in college).
- "Insurance covers this." "Clinical tool." "Diagnoses." "Prediabetes screening."
- Any number without a primary source. Any sponsor service not running.
- Red/orange/green. Weight language. "Should."

---

## 13. Build status
See `WORK_SPLIT.md`. Update `docs/STATUS.md` at each checkpoint (Sat 1 PM / 6 PM / 10 PM, Sun 8 AM / 11 AM).

## Appendix — sources for this file
Rutgers Dining nutrition/menus: https://food.rutgers.edu/nutrition/nutrition-faq · https://menuportal23.dining.rutgers.edu/foodpronet/pickmenu.aspx?sName=Rutgers+University+Dining&locationNum=04&locationName=Busch+Dining+Hall&naFlag=1 · Menus of Change https://food.rutgers.edu/nutrition/menus-change · ScarletWell https://newbrunswick.rutgers.edu/scarletwell · My Wellness app in Rutgers mobile app https://uhr.rutgers.edu/hr-professional/my-wellness-app-now-available · CAPS workshops https://health.rutgers.edu/medical-and-counseling-services/counseling-services/caps-wellness-series · CDC teens prediabetes (STAT, Jul 2025) https://www.statnews.com/2025/07/09/prediabetes-in-teens-cdc-says-nearly-one-in-three-teenagers-at-risk-of-type-2-diabetes/ · NHANES 2021–23 adolescents https://journals.plos.org/globalpublichealth/article?id=10.1371%2Fjournal.pgph.0005596 · Young adults 19–34 https://jamanetwork.com/journals/jamapediatrics/fullarticle/10.1001/jamapediatrics.2019.4498 · Medicare CGM policy A52464 https://www.cms.gov/medicare-coverage-database/view/article.aspx?ContrID=140&articleId=52464 · Aetna Better Health NJ CGM policy https://www.aetnabetterhealth.com/content/dam/aetna/medicaid/pdfs/formulary/guidelines/Continuous-Glucose-Monitor-NJ-Aetna-Medicaid-Policy-ua.pdf · UHC NJ CGM policy https://www.uhcprovider.com/content/dam/provider/docs/public/policies/medicaid-comm-plan/nj/continuous-glucose-monitoring-insulin-delivery-managing-diabetes-nj-cs.pdf · Dexcom Medicare expansion coverage https://www.medtechdive.com/news/dexcom-seeks-expanded-medicare-coverage-of-cgms-for-type-2-diabetes/812223/ · ADA Medicare FAQ https://diabetes.org/advocacy/cgm-continuous-glucose-monitors/faqs-medicare-coverage · Menu placement OR 1.22 https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10537694/ · JHU climate labels (Appetite 2025) https://pubmed.ncbi.nlm.nih.gov/40188952 · Climate labels narrative review https://pmc.ncbi.nlm.nih.gov/articles/PMC12679830/ · Green exercise meta-analysis https://www.sciencedirect.com/science/article/pii/S2666622725000310 · Campus green space review https://pmc.ncbi.nlm.nih.gov/articles/PMC13328092/ · Green space & academic performance https://pmc.ncbi.nlm.nih.gov/articles/PMC12408090/ · Wellby co-design https://blog.jmir.org/co-designing-student-wellness-the-wellby-wearable-system · ThriveNudge (SDT) https://pmc.ncbi.nlm.nih.gov/articles/PMC12938559/ · MBC for students https://timelycare.com/blog/enhancing-mental-health-care-for-college-and-university-students-with-measurement-based-care/ · CCAPS https://ccmh.psu.edu/assets/CCAPSScreen/SCREENxNCAA_2024.pdf · PHQ-9 monitoring (HEDIS) https://www.hopkinsmedicine.org/johns-hopkins-health-plans/providers-physicians/health-care-performance-measures/hedis/utilization-of-the-phq-9-to-monitor-depression-symptoms-for-adolescents-and-adults · everything numeric for Challenge 3: `verified-facts-glucose-challenge.md`.
