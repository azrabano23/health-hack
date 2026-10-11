// One client for everyone. Fixtures by default; VITE_USE_FIXTURES=0 hits the FastAPI engine.
import type * as T from "./types";

const fixtures = import.meta.glob("../../../engine/fixtures/*.json", { eager: true, import: "default" }) as Record<string, unknown>;
const USE_FIXTURES = import.meta.env.VITE_USE_FIXTURES !== "0";
const BASE: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function fx<R>(name: string): R {
  const hit = fixtures[`../../../engine/fixtures/${name}`];
  if (!hit) throw new Error(`missing fixture ${name}`);
  return hit as R;
}
async function call<R>(path: string, fixture: string, body?: unknown): Promise<R> {
  if (USE_FIXTURES) return fx<R>(fixture);
  const r = await fetch(BASE + path, body === undefined ? undefined : {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

/** Live first, fixture on failure: for conversational calls where a canned answer would be wrong. */
async function live<R>(path: string, fixture: string, body: unknown): Promise<R> {
  try {
    const r = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) return r.json();
  } catch { /* engine not running */ }
  return fx<R>(fixture);
}

const LOCALE = { en: "en-US", es: "es-US" } as const;
let audio: HTMLAudioElement | null = null;

/** Speak text: ElevenLabs through the engine when it has a key, the browser's own voice otherwise. Resolves to the method used. */
async function speak(text: string, lang: "en" | "es" = "en"): Promise<string> {
  audio?.pause();
  speechSynthesis?.cancel();
  try {
    const r = await fetch(BASE + "/voice/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, lang }) });
    if (r.ok) {
      audio = new Audio(URL.createObjectURL(await r.blob()));
      await audio.play();
      return r.headers.get("x-voice-method") ?? "elevenlabs";
    }
  } catch { /* engine down or autoplay blocked: fall through */ }
  if (typeof speechSynthesis === "undefined") return "none";
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LOCALE[lang];
  speechSynthesis.speak(u);
  return "browser";
}

/** Recorded audio to text through the engine; null when no key or the engine is down (hide or disable the mic). */
async function listen(blob: Blob, lang: "en" | "es" = "en"): Promise<string | null> {
  try {
    const r = await fetch(`${BASE}/voice/stt?lang=${lang}`, { method: "POST", headers: { "content-type": blob.type || "audio/webm" }, body: blob });
    return r.ok ? ((await r.json()) as { text: string }).text : null;
  } catch { return null; }
}

export const api = {
  speak,
  listen,
  voiceStatus: async () => { try { const r = await fetch(BASE + "/voice/status"); return r.ok ? (await r.json()) as { available: boolean; langs: string[] } : null; } catch { return null; } },
  chat: (body: { messages: { role: "user" | "assistant"; content: string }[]; campus?: string; lat?: number; lng?: number; lang?: "en" | "es" }) =>
    live<T.ChatReply>("/chat", "chat.json", body),
  foodPhoto: (body: { image_b64: string; media_type: string; note?: string }) => live<T.FoodReply>("/food/photo", "food.photo.json", body),
  llmStatus: async () => { try { const r = await fetch(BASE + "/llm/status"); return r.ok ? (await r.json()) as { available: boolean; model: string | null } : null; } catch { return null; } },
  participants: () => call<T.Participant[]>("/participants", "participants.json"),
  timeline: (id: string) => call<T.Timeline>(`/participants/${id}/timeline`, `timeline.${id}.json`),
  predict: (body: unknown = {}) => call<T.Prediction>("/predict", "predict.json", body),
  attribute: (body: unknown = {}) => call<T.Attribution>("/attribute", "attribute.json", body),
  optimize: (body: unknown = {}) => call<T.Optimize>("/optimize", "optimize.json", body),
  nextMeal: (body: unknown = {}) => call<T.NextMeal>("/next_meal", "next_meal.json", body),
  eval: () => call<T.EvalPayload>("/eval", "eval.json"),
  resources: (q: { dimension?: string; campus?: string; lat?: number; lng?: number } = {}) =>
    call<{ items: T.Resource[] }>(`/resources?${new URLSearchParams(q as Record<string, string>)}`,
      q.dimension && q.campus ? `resources.${q.campus}.${q.dimension}.json` : "resources.json"),
  // v3: feedback for a partial check-in; fixture answers Maya's three dimensions
  feedback: (body: { scores: Partial<Record<T.Dimension, number>>; campus?: string; lat?: number; lng?: number; now?: string }) =>
    call<T.Feedback>("/checkin/feedback", "checkin.feedback.json", body),
  ask: (body: { text: string; campus?: string; lat?: number; lng?: number }) => call<T.Ask>("/ask", "ask.json", body),
  nudge: (body: { signal: { type: T.SignalType; value?: number; source?: string }; campus?: string; lat?: number; lng?: number; now?: string }) =>
    call<T.Nudge>("/nudge", "nudge.json", body),
  aggregateWeekly: (q: { campus?: string; level?: string; dimension?: string } = {}) =>
    call<T.AggregateWeekly>(`/aggregate?${new URLSearchParams(q as Record<string, string>)}`, "aggregate.weekly.json"),
  aggregateDips: (q: { campus?: string; level?: string; dimension?: string } = {}) =>
    call<T.Dips>(`/aggregate/dips?${new URLSearchParams(q as Record<string, string>)}`, "aggregate.dips.json"),
  askStaff: (body: { question: string; campus?: string }) => live<T.StaffAnswer>("/aggregate/ask", "aggregate.ask.json", body),
  counselorStudents: () => call<T.CounselorStudent[]>("/counselor/students", "counselor.students.json"),
  counselorStudent: (id: string) =>
    call<T.CounselorStudentDetail>(`/counselor/students/${id}`, `counselor.student.${id}.json`),
  counselorAggregate: () => call<T.Aggregate>("/counselor/aggregate", "counselor.aggregate.json"),
};
