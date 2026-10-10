// The same arithmetic as engine/recommend/baseline.py, for when the engine is not running. Keep the two in step by hand.
// Personal baseline per dimension (exponentially weighted usual, band, latest vs usual) and learned kinds from taps.
import type { Dimension, LearnedKind, Tap, Twin, TwinRow } from "@/api/types";

export const DIMS: Dimension[] = ["physical", "emotional", "intellectual", "financial", "social", "spiritual", "occupational", "environmental"];
const ALPHA = 0.4, MIN_BAND = 0.3, DEFAULT_SPREAD = 0.4, MAX_DELTA = 0.3, LEARN_RATE = 0.6;
const r2 = (x: number) => Math.round(x * 100) / 100;

function ewma(v: number[]) { let m = v[0]; for (const x of v.slice(1)) m = ALPHA * x + (1 - ALPHA) * m; return m; }

export function baseline(history: { date: string; scores: Record<string, number | undefined> }[]): TwinRow[] {
  const rows = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const out: TwinRow[] = [];
  for (const d of DIMS) {
    const pts = rows.flatMap((h) => { const v = h.scores[d] ?? h.scores[d[0].toUpperCase() + d.slice(1)]; return typeof v === "number" ? [{ date: h.date, v }] : []; });
    if (!pts.length) continue;
    const vals = pts.map((p) => p.v);
    const latest = vals[vals.length - 1];
    const prev = vals.slice(0, -1);
    const usual = prev.length ? ewma(prev) : latest;
    const spread = vals.length >= 3 ? prev.reduce((s, v) => s + Math.abs(v - usual), 0) / prev.length : DEFAULT_SPREAD;
    const band = Math.max(MIN_BAND, spread);
    const dev = latest - usual;
    const word = Math.abs(dev) <= band ? "about your usual" : dev > 0 ? "above your usual" : "below your usual";
    const l3 = vals.slice(-3);
    const trend = l3.length === 3 && l3[0] < l3[1] && l3[1] < l3[2] ? "rising" : l3.length === 3 && l3[0] > l3[1] && l3[1] > l3[2] ? "settling" : "steady";
    out.push({ dimension: d, n: vals.length, latest: r2(latest), latest_date: pts[pts.length - 1].date, usual: r2(usual), band: r2(band), deviation: r2(dev), word, trend });
  }
  return out;
}

export function learned(taps: Tap[]): { kinds: LearnedKind[]; taps: number } {
  const agg = new Map<string, LearnedKind>();
  for (const t of taps) {
    if (!t.kind) continue;
    const a = agg.get(t.kind) ?? { kind: t.kind, shown: 0, followed: 0, rate: 0, delta: 0 };
    a.shown += 1; a.followed += t.followed ? 1 : 0; agg.set(t.kind, a);
  }
  const kinds = [...agg.values()].map((a) => { const rate = (a.followed + 1) / (a.shown + 2); return { ...a, rate: r2(rate), delta: r2(Math.max(-MAX_DELTA, Math.min(MAX_DELTA, LEARN_RATE * (rate - 0.5)))) }; });
  kinds.sort((a, b) => b.rate - a.rate || b.shown - a.shown || a.kind.localeCompare(b.kind));
  return { kinds, taps: kinds.reduce((s, k) => s + k.shown, 0) };
}

export function localTwin(history: { date: string; scores: Record<string, number | undefined> }[], taps: Tap[]): Twin {
  const rows = baseline(history);
  const few = !rows.length || Math.min(...rows.map((r) => r.n)) < 3;
  const moving = rows.some((r) => r.word !== "about your usual" || r.trend !== "steady");
  const next_checkin = few ? { cadence: "weekly", why: "Three check-ins per dimension give you a usual worth comparing to." }
    : moving ? { cadence: "weekly", why: "Something is moving; a check-in next week shows whether it settles." }
      : { cadence: "every two weeks", why: "You are steady around your usual; two weeks is enough to notice a change." };
  return { n_checkins: history.length, dimensions: rows, learned: learned(taps), next_checkin, method: "ewma_v1 (on this phone)",
    constants: { alpha: ALPHA, min_band: MIN_BAND, max_kind_delta: MAX_DELTA },
    privacy: "computed on this phone from your own check-ins and taps; nothing stored anywhere else",
    source: "your own check-ins (Wellness Inventory items, Swarbrick et al. 2025) and your own taps; same rules as engine/recommend/baseline.py; no prediction" };
}
