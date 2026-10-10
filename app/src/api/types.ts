// Mirrors docs/API_CONTRACT.md. Change the contract + fixtures + this file in the SAME commit.
export interface Point { t_min: number; g: number; lo?: number; hi?: number }
export interface Metric { value: number; lo: number; hi: number; source: string }
export interface Uncertainty { status: "ok" | "insufficient_prior" | "out_of_distribution"; reasons: string[] }
export type EventType = "sleep" | "alcohol" | "illness" | "cycle" | "steroid" | "other_med" | "exercise" | "stress" | "late_meal" | "exam";
export interface AppEvent { type: EventType; start: string; end: string | null; value: Record<string, number | string>; origin: "device" | "user"; source: string }
export interface Macros { carb: number; protein: number; fat: number; fiber: number; kcal?: number }

export interface Participant { id: string; group: "healthy" | "prediabetes" | "t2d"; days: number; devices: string[]; hr: boolean }
export interface Timeline {
  glucose: { ts: string; g: number; device: string }[];
  hr: { ts: string; bpm: number }[]; rhr: number;
  meals: { ts: string; photo_url: string | null; macros: Macros; label: string }[];
  events: AppEvent[];
}
export interface Prediction {
  trajectory: Point[];
  metrics: Record<"g30" | "g60" | "g90" | "g120" | "peak" | "delta_peak" | "t_peak_min" | "iauc_2h", Metric>;
  macros_estimate: Record<string, { value: number; lo: number; hi: number }>;
  params: Record<"alpha" | "k_dec" | "tp" | "beta" | "theta" | "b_ex", Metric>;
  attribution: { feature: string; contribution_mgdl: number }[];
  uncertainty: Uncertainty; person_specific_share: number; model: string;
  baseline: { name: string; peak: number };
}
export interface Attribution {
  observed_peak: number; expected_peak: number; residual_mgdl: number;
  components: { event_type: string; contribution_mgdl: number; share: number; prior_source: string | null }[];
  plain_english: string; uncertainty: Uncertainty;
}
export interface OptimizeOption {
  hour: number; order_protein_first: boolean; post_meal_walk_min: number;
  pred_peak: Metric; pred_iauc: Metric; delta_vs_asked: number; plain_english: string;
}
export interface Optimize { options: OptimizeOption[]; evidence: { claim: string; source: string }[] }
export interface NextMealItem { id: string; label: string; expected_information_gain: number; carbon_tag?: string; why?: string }
export interface NextMeal { pick: NextMealItem; ranked: NextMealItem[] }
export interface EvalPayload {
  participants: { id: string; group: string; day8: { observed: Point[]; predicted: Point[]; metrics: Record<string, { obs: number; pred: Metric }> } }[];
  summary: Record<string, Record<string, number>>;
  recovery: { params: string[]; r2: number[] };
}
export interface Resource {
  id: string; name: string; dimensions: string[]; address: string; phone: string; campus: "nb" | "nwk" | "cam";
  lat: number; lng: number; distance_km: number; fit_score: number; why: string;
}
export interface CounselorStudent { student_id: string; consented_at: string; scopes: string[] }
export interface CounselorStudentDetail {
  student_id: string;
  inventory: Record<string, number | string>[];
  sleep_regularity: number[]; activity_min: number[]; glucose_stability_cv: number[];
  scales: { name: string; date: string; score: number }[];
  flags: { type: string; window: string; note: string }[];
}
export interface Aggregate { k_min: number; cells: { dimension: string; week: string; mean: number; n: number }[] }
