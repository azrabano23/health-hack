// Medication names a student can pick from, with the unit and the strengths that exist for each, so a dose is a choice,
// not a typo. Names follow RxNorm (US National Library of Medicine); strengths follow the FDA labels on DailyMed.
// This list is for recording what a student already takes. ScarletWell never advises on a medication; the prescriber does.
export type MedKind = "diabetes" | "insulin" | "mental_health" | "adhd" | "contraception" | "asthma" | "allergy" | "thyroid" | "pain" | "stomach" | "blood_pressure" | "sleep" | "migraine" | "skin" | "other";
export interface Medication { name: string; kind: MedKind; unit: "mg" | "mcg" | "units" | "puffs" | "tablet" | "patch" | "ring" | "injection"; strengths: number[]; note?: string }

export const MEDICATIONS: Medication[] = [
  // diabetes and glucose
  { name: "metformin", kind: "diabetes", unit: "mg", strengths: [500, 750, 850, 1000] },
  { name: "metformin ER", kind: "diabetes", unit: "mg", strengths: [500, 750, 1000] },
  { name: "semaglutide (Ozempic)", kind: "diabetes", unit: "mg", strengths: [0.25, 0.5, 1, 2], note: "weekly injection" },
  { name: "semaglutide (Wegovy)", kind: "diabetes", unit: "mg", strengths: [0.25, 0.5, 1, 1.7, 2.4], note: "weekly injection" },
  { name: "tirzepatide (Mounjaro)", kind: "diabetes", unit: "mg", strengths: [2.5, 5, 7.5, 10, 12.5, 15], note: "weekly injection" },
  { name: "empagliflozin (Jardiance)", kind: "diabetes", unit: "mg", strengths: [10, 25] },
  { name: "glipizide", kind: "diabetes", unit: "mg", strengths: [2.5, 5, 10] },
  { name: "sitagliptin (Januvia)", kind: "diabetes", unit: "mg", strengths: [25, 50, 100] },
  { name: "insulin glargine (Lantus, Basaglar)", kind: "insulin", unit: "units", strengths: [], note: "long acting; dose is yours" },
  { name: "insulin degludec (Tresiba)", kind: "insulin", unit: "units", strengths: [], note: "long acting" },
  { name: "insulin detemir (Levemir)", kind: "insulin", unit: "units", strengths: [], note: "long acting" },
  { name: "insulin lispro (Humalog, Admelog)", kind: "insulin", unit: "units", strengths: [], note: "mealtime" },
  { name: "insulin aspart (Novolog, Fiasp)", kind: "insulin", unit: "units", strengths: [], note: "mealtime" },
  { name: "insulin glulisine (Apidra)", kind: "insulin", unit: "units", strengths: [], note: "mealtime" },
  { name: "insulin pump (any insulin)", kind: "insulin", unit: "units", strengths: [], note: "basal and bolus from the pump" },
  // mental health
  { name: "sertraline (Zoloft)", kind: "mental_health", unit: "mg", strengths: [25, 50, 100, 150, 200] },
  { name: "fluoxetine (Prozac)", kind: "mental_health", unit: "mg", strengths: [10, 20, 40, 60] },
  { name: "escitalopram (Lexapro)", kind: "mental_health", unit: "mg", strengths: [5, 10, 20] },
  { name: "citalopram (Celexa)", kind: "mental_health", unit: "mg", strengths: [10, 20, 40] },
  { name: "paroxetine (Paxil)", kind: "mental_health", unit: "mg", strengths: [10, 20, 30, 40] },
  { name: "venlafaxine ER (Effexor XR)", kind: "mental_health", unit: "mg", strengths: [37.5, 75, 150, 225] },
  { name: "duloxetine (Cymbalta)", kind: "mental_health", unit: "mg", strengths: [20, 30, 40, 60] },
  { name: "bupropion XL (Wellbutrin XL)", kind: "mental_health", unit: "mg", strengths: [150, 300, 450] },
  { name: "bupropion SR", kind: "mental_health", unit: "mg", strengths: [100, 150, 200] },
  { name: "mirtazapine (Remeron)", kind: "mental_health", unit: "mg", strengths: [7.5, 15, 30, 45] },
  { name: "trazodone", kind: "mental_health", unit: "mg", strengths: [50, 100, 150] },
  { name: "buspirone", kind: "mental_health", unit: "mg", strengths: [5, 7.5, 10, 15, 30] },
  { name: "hydroxyzine", kind: "mental_health", unit: "mg", strengths: [10, 25, 50] },
  { name: "lamotrigine (Lamictal)", kind: "mental_health", unit: "mg", strengths: [25, 50, 100, 150, 200] },
  { name: "lithium carbonate", kind: "mental_health", unit: "mg", strengths: [150, 300, 450, 600] },
  { name: "quetiapine (Seroquel)", kind: "mental_health", unit: "mg", strengths: [25, 50, 100, 200, 300, 400] },
  { name: "aripiprazole (Abilify)", kind: "mental_health", unit: "mg", strengths: [2, 5, 10, 15, 20, 30] },
  { name: "lurasidone (Latuda)", kind: "mental_health", unit: "mg", strengths: [20, 40, 60, 80, 120] },
  { name: "propranolol", kind: "mental_health", unit: "mg", strengths: [10, 20, 40, 60, 80], note: "often for performance anxiety" },
  { name: "clonazepam (Klonopin)", kind: "mental_health", unit: "mg", strengths: [0.5, 1, 2] },
  { name: "lorazepam (Ativan)", kind: "mental_health", unit: "mg", strengths: [0.5, 1, 2] },
  { name: "alprazolam (Xanax)", kind: "mental_health", unit: "mg", strengths: [0.25, 0.5, 1, 2] },
  { name: "naltrexone", kind: "mental_health", unit: "mg", strengths: [50] },
  // ADHD
  { name: "methylphenidate (Ritalin)", kind: "adhd", unit: "mg", strengths: [5, 10, 20] },
  { name: "methylphenidate ER (Concerta)", kind: "adhd", unit: "mg", strengths: [18, 27, 36, 54, 72] },
  { name: "amphetamine salts (Adderall)", kind: "adhd", unit: "mg", strengths: [5, 7.5, 10, 12.5, 15, 20, 30] },
  { name: "amphetamine salts XR (Adderall XR)", kind: "adhd", unit: "mg", strengths: [5, 10, 15, 20, 25, 30] },
  { name: "lisdexamfetamine (Vyvanse)", kind: "adhd", unit: "mg", strengths: [10, 20, 30, 40, 50, 60, 70] },
  { name: "atomoxetine (Strattera)", kind: "adhd", unit: "mg", strengths: [10, 18, 25, 40, 60, 80, 100] },
  { name: "guanfacine ER (Intuniv)", kind: "adhd", unit: "mg", strengths: [1, 2, 3, 4] },
  // contraception and hormones
  { name: "combined oral contraceptive pill", kind: "contraception", unit: "tablet", strengths: [1], note: "daily, same time" },
  { name: "progestin-only pill", kind: "contraception", unit: "tablet", strengths: [1], note: "daily, same time matters more" },
  { name: "contraceptive patch (Xulane, Twirla)", kind: "contraception", unit: "patch", strengths: [1], note: "weekly" },
  { name: "vaginal ring (NuvaRing, Annovera)", kind: "contraception", unit: "ring", strengths: [1], note: "monthly" },
  { name: "medroxyprogesterone (Depo-Provera)", kind: "contraception", unit: "injection", strengths: [150], note: "every 12 to 13 weeks" },
  { name: "estradiol", kind: "other", unit: "mg", strengths: [0.5, 1, 2] },
  { name: "testosterone cypionate", kind: "other", unit: "mg", strengths: [50, 100, 200], note: "injection" },
  { name: "spironolactone", kind: "other", unit: "mg", strengths: [25, 50, 100] },
  // asthma and allergy
  { name: "albuterol inhaler (ProAir, Ventolin)", kind: "asthma", unit: "puffs", strengths: [1, 2], note: "as needed" },
  { name: "fluticasone inhaler (Flovent)", kind: "asthma", unit: "mcg", strengths: [44, 110, 220] },
  { name: "budesonide/formoterol (Symbicort)", kind: "asthma", unit: "mcg", strengths: [80, 160] },
  { name: "montelukast (Singulair)", kind: "asthma", unit: "mg", strengths: [4, 5, 10] },
  { name: "cetirizine (Zyrtec)", kind: "allergy", unit: "mg", strengths: [5, 10] },
  { name: "loratadine (Claritin)", kind: "allergy", unit: "mg", strengths: [10] },
  { name: "fexofenadine (Allegra)", kind: "allergy", unit: "mg", strengths: [60, 180] },
  { name: "fluticasone nasal spray (Flonase)", kind: "allergy", unit: "mcg", strengths: [50] },
  { name: "epinephrine auto-injector (EpiPen)", kind: "allergy", unit: "mg", strengths: [0.15, 0.3], note: "emergency only" },
  // thyroid, blood pressure, heart
  { name: "levothyroxine (Synthroid)", kind: "thyroid", unit: "mcg", strengths: [25, 50, 75, 88, 100, 112, 125, 137, 150, 175, 200] },
  { name: "lisinopril", kind: "blood_pressure", unit: "mg", strengths: [2.5, 5, 10, 20, 40] },
  { name: "losartan", kind: "blood_pressure", unit: "mg", strengths: [25, 50, 100] },
  { name: "amlodipine", kind: "blood_pressure", unit: "mg", strengths: [2.5, 5, 10] },
  { name: "metoprolol", kind: "blood_pressure", unit: "mg", strengths: [25, 50, 100, 200] },
  { name: "atorvastatin (Lipitor)", kind: "blood_pressure", unit: "mg", strengths: [10, 20, 40, 80] },
  // stomach
  { name: "omeprazole (Prilosec)", kind: "stomach", unit: "mg", strengths: [10, 20, 40] },
  { name: "pantoprazole (Protonix)", kind: "stomach", unit: "mg", strengths: [20, 40] },
  { name: "famotidine (Pepcid)", kind: "stomach", unit: "mg", strengths: [10, 20, 40] },
  { name: "ondansetron (Zofran)", kind: "stomach", unit: "mg", strengths: [4, 8] },
  // pain, migraine, sleep, skin
  { name: "ibuprofen", kind: "pain", unit: "mg", strengths: [200, 400, 600, 800] },
  { name: "naproxen", kind: "pain", unit: "mg", strengths: [220, 250, 375, 500] },
  { name: "acetaminophen (Tylenol)", kind: "pain", unit: "mg", strengths: [325, 500, 650] },
  { name: "sumatriptan (Imitrex)", kind: "migraine", unit: "mg", strengths: [25, 50, 100] },
  { name: "rizatriptan (Maxalt)", kind: "migraine", unit: "mg", strengths: [5, 10] },
  { name: "topiramate (Topamax)", kind: "migraine", unit: "mg", strengths: [25, 50, 100, 200] },
  { name: "melatonin", kind: "sleep", unit: "mg", strengths: [0.5, 1, 3, 5, 10] },
  { name: "zolpidem (Ambien)", kind: "sleep", unit: "mg", strengths: [5, 10] },
  { name: "doxycycline", kind: "skin", unit: "mg", strengths: [50, 100] },
  { name: "isotretinoin (Accutane)", kind: "skin", unit: "mg", strengths: [10, 20, 30, 40] },
  { name: "tretinoin cream", kind: "skin", unit: "other" as never, strengths: [], note: "nightly" },
  // common supplements students list
  { name: "vitamin D3", kind: "other", unit: "mcg", strengths: [10, 25, 50, 125] },
  { name: "iron (ferrous sulfate)", kind: "other", unit: "mg", strengths: [325] },
  { name: "multivitamin", kind: "other", unit: "tablet", strengths: [1] },
  { name: "creatine", kind: "other", unit: "mg", strengths: [3000, 5000] },
  { name: "caffeine tablets", kind: "other", unit: "mg", strengths: [100, 200] },
];

export const TIMES = ["morning", "midday", "evening", "bedtime"] as const;
export type MedTime = (typeof TIMES)[number];
export const KIND_WORDS: Record<MedKind, string> = { diabetes: "diabetes", insulin: "insulin", mental_health: "mental health", adhd: "ADHD", contraception: "contraception", asthma: "asthma", allergy: "allergy", thyroid: "thyroid", pain: "pain", stomach: "stomach", blood_pressure: "blood pressure and heart", sleep: "sleep", migraine: "migraine", skin: "skin", other: "other" };

export function searchMedications(q: string, limit = 8): Medication[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const starts = MEDICATIONS.filter((m) => m.name.toLowerCase().startsWith(t));
  const contains = MEDICATIONS.filter((m) => !starts.includes(m) && m.name.toLowerCase().includes(t));
  return [...starts, ...contains].slice(0, limit);
}
export const CITATION = "names: RxNorm (NLM); strengths: FDA labels on DailyMed; recorded as the student enters them, never advised";
