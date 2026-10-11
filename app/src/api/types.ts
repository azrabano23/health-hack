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
export interface NextMealItem { id: string; label: string; expected_information_gain: number; expected_peak?: number; carbon_tag?: string; why?: string }
export interface NextMeal { pick: NextMealItem; ranked: NextMealItem[] }
export interface EvalPayload {
  participants: { id: string; group: string; day8: { observed: Point[]; predicted: Point[]; metrics: Record<string, { obs: number; pred: Metric }> } }[];
  summary: Record<string, Record<string, number>>;
  recovery: { params: string[]; r2: number[] };
}
export interface Resource {
  id: string; name: string; dimensions: string[]; address: string | null; phone: string | null; campus: "nb" | "nwk" | "cam"; kind?: string;
  lat: number | null; lng: number | null; coords_approx?: boolean; online?: boolean; crisis?: boolean;
  open_now?: boolean | null; hours?: Record<string, string> | null; url?: string | null;
  distance_km: number; fit_score: number; score?: number; why: string;
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

// v3: check-in feedback and the staff aggregate (docs/API_CONTRACT.md, v3 endpoints)
export type Dimension = "emotional" | "environmental" | "financial" | "intellectual" | "occupational" | "physical" | "social" | "spiritual";
export type Band = "strong" | "steady" | "stretched";
export interface FeedbackCard {
  dimension: Dimension; score: number; band: Band; message: string;
  next_step?: string; resource?: Resource | null; alternatives?: Resource[];
  event?: WellnessEvent | null; off_campus?: OffCampusLink[];
}
export interface WellnessEvent {
  id: string; title: string; start: string; end: string | null; recurring: string | null; location: string; address: string;
  lat: number | null; lng: number | null; coords_approx?: boolean; campus: "nb" | "nwk" | "cam"; dimensions: Dimension[];
  free: boolean; registration_url: string | null; url: string; source: string; needs_confirmation?: boolean; starts_in_days?: number;
}
export interface OffCampusLink { label: string; category: string; zip: string; url: string; source: string }
export interface Feedback {
  total?: { mean: number; answered: number; of: number } | null;
  answered: Dimension[]; scores: Partial<Record<Dimension, number>>; opening: string; cards: FeedbackCard[];
  crisis: { name: string; phone: string }[]; source: string;
}
export interface Stressor { id: string; label: string; start: string; end: string; kind: string; expected_dips?: Dimension[]; approximate?: boolean }
export interface AggregateCell { week: number; week_start: string; campus: "nb" | "nwk" | "cam"; level: "undergrad" | "grad"; dimension: Dimension; mean: number; n: number }
export interface AggregateWeekly { k_min: number; synthetic: boolean; term: string | null; dimensions: Dimension[]; stressors: Stressor[]; cells: AggregateCell[] }
export interface Dip {
  campus: "nb" | "nwk" | "cam"; level: "undergrad" | "grad"; dimension: Dimension; week: number; week_start: string;
  mean: number; previous_mean: number; drop: number; n: number; lowest_week: boolean;
  stressor: Pick<Stressor, "id" | "label" | "start" | "end" | "kind"> | null; stressor_names_dimension: boolean;
}
export interface Dips { threshold: number; synthetic: boolean; count: number; dips: Dip[] }
export interface Ask {
  text: string; dimension: Dimension; confidence: number; unsure: boolean;
  candidates: { dimension: Dimension; similarity: number }[];
  resources: (Resource & { text_match?: number })[]; events: WellnessEvent[]; why: string; method: string;
}
export type SignalType = "glucose_low" | "glucose_dropping" | "glucose_high" | "short_sleep" | "low_steps" | "long_sitting" | "stretched_week" | "cooped_up" | "deadline_crunch";
export interface NudgePlace { id: string; name: string; kind: string; address: string | null; lat: number; lng: number; distance_km: number; walk_min: number; open_now: boolean | null; url: string | null; phone: string | null }
export interface Nudge {
  signal: { type: SignalType; label: string; value: number | null; source: string };
  message: string; options: string[]; place: NudgePlace | null; alternatives: NudgePlace[]; safety: string | null; why: string; source: string;
  event?: WellnessEvent | null;   // a free group event this week when the signal is about company or movement
}
// v3 twin: personal baseline per dimension and the kinds of place the student actually goes to. Stateless; no prediction.
export type TwinWord = "about your usual" | "above your usual" | "below your usual";
export interface TwinRow { dimension: Dimension; n: number; latest: number; latest_date: string; usual: number; band: number; deviation: number; word: TwinWord; trend: "rising" | "settling" | "steady" }
export interface LearnedKind { kind: string; shown: number; followed: number; rate: number; delta: number }
export interface Tap { kind: string; followed: boolean; dimension?: string; ts?: string }
export interface Twin {
  n_checkins: number; dimensions: TwinRow[]; learned: { kinds: LearnedKind[]; taps: number }; next_checkin: { cadence: string; why: string };
  method: string; constants: Record<string, number>; privacy: string; source: string;
}
export interface ChatReply { reply: string; method: string; context: { dimension: Dimension; unsure: boolean; second: Dimension | null; places: Resource[]; events: WellnessEvent[]; off_campus: OffCampusLink[] }; lang?: "en" | "es"; when: string }
export interface FoodReply { description: string; strength: string; one_small_thing: string; text?: string; method: string }

export interface StaffAnswer { question: string; answer: string; method: string; synthetic: boolean; dips_used: Dip[] }
// v3 insights: what moved, when, for whom, what to do by when. Rules over k-anonymous cells; never an individual.
export interface InsightPlace { id: string; name: string; kind: string | null; why: string }
export interface Insight {
  dimension: Dimension; campus: "nb" | "nwk" | "cam"; level: string; weeks: number[]; week_start: string; low_mean: number; drop: number; n: number;
  lowest_of_term: boolean; stressor: Stressor | null; headline: string; lever: string; actions: string[]; act_by: string | null; places: InsightPlace[];
  context?: string; why: string; source: string; upcoming?: boolean;
}
export interface Insights { campus: string; level: string; synthetic: boolean; insights: Insight[] }

export interface UnderstoodFacts {
  family: { diabetes: boolean; heart: boolean; mental_health: boolean; other: string[] };
  conditions: string[]; allergies: string[]; medications_mentioned: string[]; diet: string[]; faith: string | null; observances: string[]; notes: string[];
}
/** GET /registry/status: how current the resource registry is (engine/registry/refresh.py, pages read with Anakin.io). */
export interface RegistryStatus {
  resources: number; places: number; with_hours: number; hours_via_anakin: number;
  source_pages: number; changed: number; unreachable: number; pending_review: number;
  last_checked: string | null; via: string;
}

export interface ArcEvent { id: string; title: string; start: string; end: string | null; location: string | null; address?: string | null; lat: number | null; lng: number | null; campus: string; organization: string | null; benefits: string[]; categories: string[]; free_food: boolean; url: string | null; source: string }
export interface ArcEvents { campus: string; days: number; via: "arc" | "wellness_calendar"; why: string | null; count: number; events: ArcEvent[] }
