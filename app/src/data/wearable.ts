// Sleep and steps a student brings from their own watch or phone. Stays in this browser's localStorage.
// Nothing here is sent to the engine or the aggregate; it only annotates the student's own trend and feedback.
// Accepts a CSV export (Fitbit "Sleep" and "Activities" exports, Apple Health via a converter, Oura, Garmin) with
// a date column, a sleep column (hours or minutes), and a steps column. Column names are matched loosely.

export interface DayRow { date: string; sleep_h: number | null; steps: number | null }
export interface WearableStore { rows: DayRow[]; source: string; synthetic: boolean; imported: string }

const KEY = "wearable";

export function loadWearable(): WearableStore | null {
  try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as WearableStore) : null; } catch { return null; }
}
export function saveWearable(s: WearableStore | null) {
  try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch { /* storage blocked */ }
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Parse a CSV with headers. Returns rows sorted by date, one per day (later rows win). */
export function parseWearableCsv(text: string): { rows: DayRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], warnings: ["No rows found."] };
  const head = lines[0].split(",").map((h) => norm(h.replace(/^"|"$/g, "")));
  const col = (...names: string[]) => head.findIndex((h) => names.some((n) => h.includes(n)));
  const iDate = col("date", "day", "startdate", "night");
  const iSleep = col("sleephours", "hoursasleep", "sleep", "asleep", "timeinbed", "duration");
  const iSteps = col("steps", "stepcount");
  if (iDate < 0) return { rows: [], warnings: ["No date column found."] };
  if (iSleep < 0 && iSteps < 0) return { rows: [], warnings: ["No sleep or steps column found."] };
  const byDay = new Map<string, DayRow>();
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    const d = toIsoDate(cells[iDate]);
    if (!d) continue;
    let sleep: number | null = null;
    if (iSleep >= 0 && cells[iSleep]) {
      const v = parseFloat(cells[iSleep].replace(/[^0-9.:]/g, "").split(":")[0]);
      sleep = isNaN(v) ? null : v > 24 ? v / 60 : v;   // minutes if over 24
    }
    const steps = iSteps >= 0 && cells[iSteps] ? parseInt(cells[iSteps].replace(/[^0-9]/g, ""), 10) : null;
    byDay.set(d, { date: d, sleep_h: sleep, steps: steps != null && !isNaN(steps) ? steps : null });
  }
  const rows = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (!rows.length) warnings.push("No rows had a readable date.");
  return { rows, warnings };
}

function toIsoDate(s: string): string | null {
  if (!s) return null;
  const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m2) { const y = m2[3].length === 2 ? `20${m2[3]}` : m2[3]; return `${y}-${m2[1].padStart(2, "0")}-${m2[2].padStart(2, "0")}`; }
  const t = Date.parse(s);
  return isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

/** Deterministic synthetic term for the demo: shorter sleep in the warning-grade weeks, fewer steps when it rains,
 *  and three rained-in days (Oct 11 to 13) under 4,000 steps so the cooped-up trigger has something real to fire on. */
export function syntheticWearable(start = "2026-08-31", end = "2026-10-10"): WearableStore {
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const rows: DayRow[] = [];
  for (let t = Date.parse(start + "T00:00:00Z"); t <= Date.parse(end + "T00:00:00Z"); t += 86400000) {
    const d = new Date(t).toISOString().slice(0, 10);
    const warning = d >= "2026-10-05" && d <= "2026-10-16";
    const weekend = [0, 6].includes(new Date(t).getUTCDay());
    const sleep = Math.round((7.1 + (weekend ? 0.8 : 0) - (warning ? 1.6 : 0) + (rnd() - 0.5) * 1.4) * 10) / 10;
    const rainedIn = d >= "2026-10-11" && d <= "2026-10-13";
    const steps = rainedIn ? Math.round(2600 + rnd() * 900) : Math.round(7800 + (weekend ? -1500 : 0) - (warning ? 1800 : 0) + (rnd() - 0.5) * 3000);
    rows.push({ date: d, sleep_h: Math.max(3.5, sleep), steps: Math.max(1200, steps) });
  }
  return { rows, source: "synthetic sample (not a real device)", synthetic: true, imported: new Date().toISOString().slice(0, 10) };
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Mean sleep and steps over the 7 days ending on `date` (inclusive). */
export function windowBefore(rows: DayRow[], date: string, days = 7) {
  const end = Date.parse(date + "T00:00:00Z"), startT = end - (days - 1) * 86400000;
  const w = rows.filter((r) => { const t = Date.parse(r.date + "T00:00:00Z"); return t >= startT && t <= end; });
  return { sleep_h: mean(w.map((r) => r.sleep_h).filter((v): v is number => v != null)), steps: mean(w.map((r) => r.steps).filter((v): v is number => v != null)), n: w.length };
}

/** Plain-words association between a dimension's check-ins and the week of sleep before each. Never a prediction. */
export function sleepSentence(dim: string, checkins: { date: string; score: number }[], rows: DayRow[]): string | null {
  const pairs = checkins.map((c) => ({ score: c.score, sleep: windowBefore(rows, c.date).sleep_h })).filter((p) => p.sleep != null) as { score: number; sleep: number }[];
  if (pairs.length < 3) return null;
  const lo = pairs.filter((p) => p.sleep < 6.5), hi = pairs.filter((p) => p.sleep >= 6.5);
  if (!lo.length || !hi.length) return null;
  const dl = mean(lo.map((p) => p.score))!, dh = mean(hi.map((p) => p.score))!;
  if (Math.abs(dh - dl) < 0.3) return `${dim} looks about the same on short-sleep weeks and others so far.`;
  return dh > dl
    ? `${dim} ran ${(dh - dl).toFixed(1)} higher in weeks you slept 6.5 hours or more (${hi.length} check-ins vs ${lo.length}).`
    : `${dim} ran ${(dl - dh).toFixed(1)} higher in your shorter-sleep weeks (${lo.length} check-ins vs ${hi.length}); worth a closer look.`;
}

/** Movement summary for the devices page: last 7 days vs the 7 before. Plain words, no targets, no grades. */
export function movementSummary(rows: DayRow[]): { steps7: number | null; delta: number | null; activeDays: number; sentence: string } | null {
  const withSteps = rows.filter((r) => r.steps != null);
  if (withSteps.length < 7) return null;
  const last = withSteps.slice(-7), prev = withSteps.slice(-14, -7);
  const steps7 = mean(last.map((r) => r.steps as number));
  const stepsPrev = prev.length >= 4 ? mean(prev.map((r) => r.steps as number)) : null;
  const delta = steps7 != null && stepsPrev != null ? Math.round(((steps7 - stepsPrev) / stepsPrev) * 100) : null;
  const activeDays = last.filter((r) => (r.steps as number) >= 7000).length;
  const sentence = steps7 == null ? "" :
    `About ${Math.round(steps7).toLocaleString()} steps a day this week, ${activeDays} of 7 days over seven thousand` +
    (delta == null ? "." : delta >= 10 ? `, up ${delta}% on the week before. Nice.` : delta <= -10 ? `, down ${Math.abs(delta)}% on the week before. A ten minute walk tomorrow is enough to turn that.` : ", about the same as last week.");
  return { steps7, delta, activeDays, sentence };
}
