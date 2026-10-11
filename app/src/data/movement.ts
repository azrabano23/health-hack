// The phone as a sensor: DeviceMotion samples for a minute, the same two features and logistic rule the engine fitted on
// the UCI MHEALTH dataset (engine/recommend/movement_params.json), so "still" or "moving" works with the engine off.
// Samples never leave the phone unless the engine is up, and then only the per-window features go.
import params from "../../../engine/recommend/movement_params.json";

type View = "chest" | "wrist";
const P = params as { window_s: number; hz: number; source: string; views: Record<View, { w: number[]; b: number; mu: number[]; sd: number[]; loso_accuracy_mean: number }> };
export const MOVEMENT_SOURCE = P.source;
export const ACCURACY = P.views.wrist.loso_accuracy_mean;
const WIN = Math.round(P.window_s * P.hz);

export function features(samples: [number, number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i + WIN <= samples.length; i += WIN) {
    const mags = samples.slice(i, i + WIN).map(([x, y, z]) => Math.hypot(x, y, z));
    const m = mags.reduce((a, b) => a + b, 0) / mags.length;
    const sd = Math.sqrt(mags.reduce((a, v) => a + (v - m) ** 2, 0) / mags.length);
    out.push([m, sd]);
  }
  return out;
}
export function classify(feats: [number, number][], view: View = "wrist") {
  const v = P.views[view];
  const moving = feats.map((f) => 1 / (1 + Math.exp(-(f.reduce((acc, x, i) => acc + v.w[i] * ((x - v.mu[i]) / v.sd[i]), 0) + v.b))) > 0.5);
  const share = moving.length ? moving.filter(Boolean).length / moving.length : 0;
  const state: "moving" | "still" | "unknown" = feats.length ? (share >= 0.5 ? "moving" : "still") : "unknown";
  return { windows: feats.length, moving_share: share, still_share: 1 - share, state };
}

const KEY = "still_minutes";
export function stillMinutes(): { minutes: number; since: string | null } { try { return JSON.parse(localStorage.getItem(KEY) ?? '{"minutes":0,"since":null}'); } catch { return { minutes: 0, since: null }; } }
export function recordStill(stateNow: "still" | "moving" | "unknown", minutes: number) {
  const cur = stillMinutes();
  const next = stateNow === "still" ? { minutes: cur.minutes + minutes, since: cur.since ?? new Date().toISOString() } : { minutes: 0, since: null };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

/** Sample DeviceMotion for `seconds`; resolves with the samples (about 50 Hz where the browser allows). iOS asks permission first. */
export async function sample(seconds = 60): Promise<[number, number, number][]> {
  const DM = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
  if (!DM) throw new Error("This browser has no motion sensor access.");
  if (DM.requestPermission) { const r = await DM.requestPermission(); if (r !== "granted") throw new Error("Motion access was not allowed."); }
  const out: [number, number, number][] = [];
  const on = (e: DeviceMotionEvent) => { const a = e.accelerationIncludingGravity; if (a && a.x != null && a.y != null && a.z != null) out.push([a.x, a.y, a.z]); };
  window.addEventListener("devicemotion", on);
  await new Promise((r) => setTimeout(r, seconds * 1000));
  window.removeEventListener("devicemotion", on);
  return out;
}
