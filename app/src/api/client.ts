// One client for everyone. Fixtures by default; VITE_USE_FIXTURES=0 hits the FastAPI engine.
import type * as T from "./types";
import { guessDimension } from "@/data/dimension_guess";
import { localTwin } from "@/data/twin";

const fixtures = import.meta.glob("../../../engine/fixtures/*.json", { eager: true, import: "default" }) as Record<string, unknown>;
const USE_FIXTURES = import.meta.env.VITE_USE_FIXTURES !== "0";
const BASE: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const hasFx = (name: string) => `../../../engine/fixtures/${name}` in fixtures;
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

export const api = {
  // engine when it runs; otherwise the template reply for the dimension the student's own words point at, on their campus
  chat: (body: { messages: { role: "user" | "assistant"; content: string }[]; campus?: string; lat?: number; lng?: number }) => {
    const last = [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const dim = guessDimension(last).dimension;
    const name = `chat.${body.campus ?? "nb"}.${dim}.json`;
    return live<T.ChatReply>("/chat", hasFx(name) ? name : "chat.json", body);
  },
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
  feedback: (body: { scores: Partial<Record<T.Dimension, number>>; campus?: string; lat?: number; lng?: number; now?: string; taps?: T.Tap[] }) =>
    call<T.Feedback>("/checkin/feedback", "checkin.feedback.json", body),
  ask: (body: { text: string; campus?: string; lat?: number; lng?: number }) => call<T.Ask>("/ask", "ask.json", body),
  nudge: (body: { signal: { type: T.SignalType; value?: number; source?: string }; campus?: string; lat?: number; lng?: number; now?: string }) =>
    call<T.Nudge>("/nudge", hasFx(`nudge.${body.signal.type}.json`) ? `nudge.${body.signal.type}.json` : "nudge.json", body),
  // Rutgers email verification: engine only (it needs the mail service); the page says plainly when the engine is off
  verifySend: async (email: string): Promise<{ ok: boolean; sent: boolean; dev_code?: string; why?: string }> => {
    try { const r = await fetch(BASE + "/verify/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) }); if (r.ok) return r.json(); } catch { /* engine off */ }
    return { ok: false, sent: false, why: "The engine is not running, so no code can be sent right now." };
  },
  verifyCheck: async (email: string, code: string): Promise<boolean> => {
    try { const r = await fetch(BASE + "/verify/check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, code }) }); if (r.ok) return (await r.json()).verified === true; } catch { /* engine off */ }
    return false;
  },
  // v3 twin: engine when it is running, otherwise the same arithmetic on the phone (never a canned fixture: the numbers are the student's own)
  twin: async (body: { history: { date: string; scores: Record<string, number> }[]; taps: T.Tap[]; now?: string }): Promise<T.Twin> => {
    try {
      const r = await fetch(BASE + "/twin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) return r.json();
    } catch { /* engine not running */ }
    return localTwin(body.history, body.taps);
  },
  aggregateWeekly: (q: { campus?: string; level?: string; dimension?: string } = {}) =>
    call<T.AggregateWeekly>(`/aggregate?${new URLSearchParams(q as Record<string, string>)}`, "aggregate.weekly.json"),
  aggregateInsights: (q: { campus: string; level: string }) =>
    call<T.Insights>(`/aggregate/insights?${new URLSearchParams(q)}`, `aggregate.insights.${q.campus}.${q.level}.json`),
  aggregateDips: (q: { campus?: string; level?: string; dimension?: string } = {}) =>
    call<T.Dips>(`/aggregate/dips?${new URLSearchParams(q as Record<string, string>)}`, "aggregate.dips.json"),
  counselorStudents: () => call<T.CounselorStudent[]>("/counselor/students", "counselor.students.json"),
  counselorStudent: (id: string) =>
    call<T.CounselorStudentDetail>(`/counselor/students/${id}`, `counselor.student.${id}.json`),
  counselorAggregate: () => call<T.Aggregate>("/counselor/aggregate", "counselor.aggregate.json"),
};
