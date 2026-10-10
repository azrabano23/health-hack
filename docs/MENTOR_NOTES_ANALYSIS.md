# Mentor conversations & notebook — clean analysis
*Sources: Wispr Flow transcript (Sat 2026-10-10, three conversations), three notebook pages (IMG_9332–9334), two OpenEvidence queries. Speaker labels in the Wispr transcript are inconsistent across segments, so people are identified by role; names only where the transcript makes it unambiguous.*

## Who said what (role map)

| Role | How identified | Core position |
|---|---|---|
| **Team physician A** (internal medicine; Weber's mentee) | "as a clinical physician myself"; introduces Dean Weber as "one of my mentors"; raises insulin sensitivity factor | Wants explicit, honest clinical metrics; worried about grade privacy; "give actionable facts and let them decide" |
| **Team physician B ("Jason")** | ~20 years out of college; the bagel-vs-cottage-cheese story; "me and him are just doctors" | The hypothesis: glucose control is the link between bad inputs (sleep, stress, diet, alcohol) and bad outputs (grades, mental health). Wants a Rutgers value prop and opt-in grade correlation. Self-aware: "it may all be bunk — how do we know until we look" |
| **Azra** (product/engineering) | "we just want to know what the data points are… the dashboard is not a hard thing to do"; "the art of not doing too much" | Keep it simple; unblock on data; take the clinical input seriously before coding |
| **Team clinical-ops member** | References "my clinical experience… affect inventory… VA / PTSD"; MetS & ketone discussion | Pushes hybrid of challenges; pragmatic |
| **Peggy Swarbrick, PhD** (ScarletWell Director) | Describes the MyRutgers Wellness Inventory widget, chancellor initiative | See ScarletWell theme below |
| **Vivian Glenn** (undergrad advisor) | "closest might not be best"; campus resource gaps | Ranking must be fit-first, distance-second |
| **Dean Paul Weber, MD, MBA** | Introduced by name; dean of medical education; internal medicine/pharmacy | Compliance, exercise snacks, incentives, "order a test only if you know what you'll do with it" |
| **Dr. Aayush Visaria, MD, MPH** | Byrne Seminar on CGMs (10/21 wore one); data-availability critique | Prediabetes CGM data is thin; insulin is the real driver; coverage is poor |
| **A lifestyle-program mentor at the Weber/Visaria table** | Runs a community program for uncontrolled diabetes | "Any app where they have to log stuff… very hard"; CGM mitigates; coverage = insulin-treated or hypoglycemia only |

## Themes → what it means → what we build

### 1. The data is the risk (Visaria)
- *Said:* CGM trials in prediabetes are intensive and unrepresentative; glucose variability in prediabetes is low — "are you going to detect enough difference?"; "insulin levels are the real driver… I like to follow insulin levels"; no dataset gives insulin; the provided sets are T1D/T2D.
- *Means:* Don't promise to detect subtle prediabetic differences from glucose alone. Model glucose, not insulin, and say so. Our decay-rate parameter is an **insulin-sensitivity proxy**, never "insulin."
- *Build:* base model on CGMacros (has healthy/prediabetes/T2D) with MetaboNet only for medication kinetics; report effect sizes honestly; parameter-recovery experiment on synthetic data.

### 2. Logging kills adherence (Weber, lifestyle mentor, notebook)
- *Said:* "any sort of app where they have to log stuff — very hard"; finger sticks worse; CGM mitigates if accessible; coverage only for insulin-treated diabetes or hypoglycemia; "Medicaid won't pay if you're prediabetic."
- *Means:* Device-first ingestion. Anything manual is one tap. Must work with sparse or no glucose.
- *Build:* Apple Health/Fitbit/Oura ingestion; one-tap event chips; sparse-glucose mode; CGM optional.

### 3. Explain WHY, then "what can I do right now" (Weber, notebook p.3)
- *Said:* "help a person understand WHY this is happening, why does it matter"; "strategic lifestyle interventions to offset" a bad night — "exercise snacks… five minutes going up and down the stairs… knowing how you responded last time, not national data."
- *Means:* The product is attribution + a small, immediate, person-specific action. Not a score.
- *Build:* residual attribution ("why did that happen") + same-meal optimizer (timing/order/post-meal activity).

### 4. Accountability and engagement (Weber, team)
- *Said:* "data points that can't lie" (steps, HR from phone/watch); integrate into tech they already have; insurance premium discounts/cash bonuses; Medicare pays for just showing up to the wellness visit; university health plan angle; "most students are on Medicaid… straight up don't have incomes."
- *Means:* Integrations are the engagement mechanism; incentives are a slide, not a feature; student-insurance discount is weak — don't lead with it.

### 5. Privacy and consent (physician A, Visaria, notebook)
- *Said:* "I would not let the student know that grades are being fed into an application like this… err on the side of giving them the discretion"; upload scores only if they choose; 11 of 21 students refused a CGM over needles and data privacy; informed-consent worry.
- *Build:* opt-in everywhere; grades user-uploaded only, never auto-ingested; counselor sharing explicit; consent copy in-app; security/data-flow slide.

### 6. Cultural & religious sensitivity (notebook, Weber table)
- *Said/noted:* cultural sensitivity → diet → "fasting, etc."; holistic element; South Indian diet example; Ramadan mentioned.
- *Build:* advice changes timing/order/activity, never the cuisine; fasting-aware mode as stretch.

### 7. ScarletWell today and what Swarbrick wants
- *Said:* Wellness Inventory widget on MyRutgers; validated, published in *Psychiatric Services* 2025; 8 dimensions; retake over "last 30 days"; currently you must do the whole thing; static; only on MyRutgers; resources curated by hand ("we just look at the internet"); chancellor initiative; wants: retake **by dimension**, **trends** over weeks/months/years, geolocate **Wellness Calendar events** to a low dimension, **aggregate** data for chancellor allocation and scheduling ("trends around exams"), expand to Newark/Camden, note Busch/Livingston resource gaps.
- *Vivian:* closest ≠ best; the right resource may not be at Rutgers (VA, private psychiatrist) — "a next step."
- *Build:* Challenge 1 surface exactly as listed; rank by fit then distance.

### 8. Counselor dashboard (Swarbrick)
- *Said:* student opts in → counselor sees widget data between visits; counselors already run anxiety/depression scales — those could sit alongside; lifestyle factors and SES are usually the drivers.
- *Build:* Challenge 2 surface: opt-in gate, between-visit trends, scale entry, vulnerable-point flags, aggregate view.

### 9. The Rutgers value proposition (physician B)
- *Said:* mental-health measures and academic performance "reflect better on Rutgers as an institution"; "metabolic health as a pathway… I've never thought about it until this conversation"; opt-in grade upload → correlate with glucose the night before → "prove us wrong"; build a national dataset over time if students consent.
- *Means:* Buyer = Rutgers. The academic link is a **hypothesis and a research proposal**, stated as such.

### 10. Out of scope but worth one line
- Insulin sensitivity factor for hospital sliding scales (physician A) — real clinical utility, wrong track; future "clinician module."
- Pilots/truck drivers/construction (team) — future market.
- "Type 3 diabetes"/dementia (physician B) — speculative; at most one cautious sentence.

### 11. Weber's framing to keep
- "We don't just order a test; we have to know what we're going to do with it when the patient comes in." → every number the app shows has an action attached or it isn't shown.
- Commercialization/IP "eventually extremely important, not at this stage."

## Notebook transcription

**Page "#3" (IMG_9332):** simplicity of UI/UX; personalized feedback → explain student scores; focus on training model; variability in sugar not much; how will patient respond to insulin — is tracked → sensitivity → correcting factors → insulin sensitivity factor; how many students are diabetic; Medicaid won't pay for prediabetic → way to open up pre-coverage; model value prop to Rutgers — mental health scores, academic performance of students; stress → stress-eating; dashboard that is fast/speed; dining hall meals improved → pull today's menu. *Right page:* every CGM → built around food logging; unexplained spikes are not only food: steroids, other meds, menstrual cycle, sleep, illness, type of meal (CV), alcohol, exercise | genetics, lifestyle, brain fog/studying, student-focused @ Rutgers ScarletWell, academic focus, brain health, mental health (depression, anxiety, BPD…), socioeconomic; **digital twin → WHY did that happen; product learns off of you; personalized medicine**; instead of CGM → might also help people who measure 1–2×/day (NOT continuous); **fear is NOT how we help students; kinder approach: capitalize on person's strengths.**

**Page "Dashboard" (IMG_9333):** quiz every 30 days / different intervals; selective → only physical, etc.; show trends / dashboard; paper validation "Wellness Inventory"; go to individual B2C; eventually get Rutgers aggregate data → chancellor allocation of resources, inform scheduling, trends around exams, start/end of school, planning; help stimulate individual-centered things; connect to dashboards for doctors/counselors → help with clinical/medical journey; socioeconomic factors. *Right page:* inventory on MyRutgers → ScarletWell; high stress, mental health; prevention model; what are you doing to keep yourself well; resources around university (gym, centers, etc.); fund grants; static → bring somewhere else; more immediate info; only on MyRutgers; source of truth → web scraping / manual → model; geolocate to specific event → closest might not be best.

**Page (IMG_9334):** glucose & insulin levels follow → tough to measure; CIM not CGM; ML model to predict glucose response based on intake; less frequent checks → empower these patients; achieve control they need; lifestyle program exists → app → compliance issues; CGM mitigates; coverage is poor; cultural sensitivity → diet → diversity — fasting etc., holistic element; crisis mgmt @ vulnerable points. *Right page:* strategic lifestyle improvements → small offsets for poor metabolic control → moderately intense exercises; accountability → step data → phone, data points that can't lie, insurance bonuses / Rutgers free tuition, university healthcare plan; Paul Weber; sensor-based LLMs; how do we integrate student health data?; sustainability → quick park route to walk etc.; forced breathing exercise.

## OpenEvidence pulls (what's usable)
- Prediabetes 24.0% (95% CI 22.0–26.1) in US young adults 19–34 (NHANES 2005–2016, JAMA Pediatr 2020); males 29.1% vs females 18.8%; obesity 36.9% vs normal weight 16.6%. T2D in college-age ≈ ≤1%. Full MetS in undergrads 0.3–7.7%, but 58–69% have ≥1 risk factor. ~56% report family history.
- CGM >140 mg/dL → lower reading/writing fluency in T1D youth; hypoglycemia in the prior 12 h also impairs (School Psychology 2019). Higher HbA1c below prediabetes cutoff → poorer cognition and white-matter integrity in healthy young adults (Mol Psychiatry 2021). Prediabetes-range fasting glucose → ~2× inhibitory-control errors (Health Psychol 2016). Prediabetes ↔ depression OR 1.16; **OR 1.25 under age 50** (PLoS One 2024, n=322,863). Early-onset T2D: depression HR 3.97, anxiety HR 3.76 (Lancet 2025).
- **No study links glycemic control to academic performance in a college cohort.** Nearly all young-adult evidence is cross-sectional. Say this out loud.
- Sleep: sleep restriction reduces insulin sensitivity across 35 RCTs (meta-analysis); irregular short sleep → largest glucose rise (16-day study, 48 young adults); AHA: ~2 h/night restriction raises insulin resistance. The "4 h sleep → ~25% drop" figure came via a blog — find the primary before using.

## Decisions this analysis forces
1. Build Challenge 3 as the engine; Challenge 2 as the main surface; Challenge 1 light (check-in + nearby map), no chatbot unless time remains.
2. Attribution + small immediate action, not a score. No traffic lights.
3. Opt-in and consent on every data path; grades never auto-ingested.
4. Honest-evidence slide: association in youth and young adults; college academic link untested; this tool is how you'd test it.
5. "Insulin" never appears as something we measure.
