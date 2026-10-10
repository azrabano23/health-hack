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

export const api = {
  participants: () => call<T.Participant[]>("/participants", "participants.json"),
  timeline: (id: string) => call<T.Timeline>(`/participants/${id}/timeline`, `timeline.${id}.json`),
  predict: (body: unknown = {}) => call<T.Prediction>("/predict", "predict.json", body),
  attribute: (body: unknown = {}) => call<T.Attribution>("/attribute", "attribute.json", body),
  optimize: (body: unknown = {}) => call<T.Optimize>("/optimize", "optimize.json", body),
  nextMeal: (body: unknown = {}) => call<T.NextMeal>("/next_meal", "next_meal.json", body),
  eval: () => call<T.EvalPayload>("/eval", "eval.json"),
  resources: (q: { dimension?: string; campus?: string; lat?: number; lng?: number } = {}) =>
    call<{ items: T.Resource[] }>(`/resources?${new URLSearchParams(q as Record<string, string>)}`, "resources.json"),
  // v3: feedback for a partial check-in; fixture answers Maya's three dimensions
  feedback: (body: { scores: Partial<Record<T.Dimension, number>>; campus?: string; lat?: number; lng?: number; now?: string }) =>
    call<T.Feedback>("/checkin/feedback", "checkin.feedback.json", body),
  aggregateWeekly: (q: { campus?: string; level?: string; dimension?: string } = {}) =>
    call<T.AggregateWeekly>(`/aggregate?${new URLSearchParams(q as Record<string, string>)}`, "aggregate.weekly.json"),
  aggregateDips: (q: { campus?: string; level?: string; dimension?: string } = {}) =>
    call<T.Dips>(`/aggregate/dips?${new URLSearchParams(q as Record<string, string>)}`, "aggregate.dips.json"),
  counselorStudents: () => call<T.CounselorStudent[]>("/counselor/students", "counselor.students.json"),
  counselorStudent: (id: string) =>
    call<T.CounselorStudentDetail>(`/counselor/students/${id}`, `counselor.student.${id}.json`),
  counselorAggregate: () => call<T.Aggregate>("/counselor/aggregate", "counselor.aggregate.json"),
};
