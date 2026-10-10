// Surface: trend. First pass by the team; Arnav polishes. Spec: docs/SOURCE_OF_TRUTH.md 2.6.
// The student's own check-ins over the term, one sparkline per dimension, exam weeks shaded. Stays on the phone.
import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { PageRoute } from "@/App";
import { Card, Eyebrow, Source, Title } from "@/components/ui";
import calendar from "../../../../data/academic_calendar_fall2026.json";
import { loadWearable, sleepSentence, windowBefore, type DayRow } from "@/data/wearable";

export const route: PageRoute = { path: "/trend", label: "Trend", order: 4.5, owner: "team", student: true };

type Entry = { date: string; scores: Record<string, number> };
const DIMS = ["Physical", "Emotional", "Intellectual", "Financial", "Social", "Spiritual", "Occupational", "Environmental"];
const TERM = { start: "2026-08-31", end: "2026-12-22" };
const SEED: Entry[] = [
  { date: "2026-09-08", scores: { Physical: 3.1, Emotional: 3.4, Social: 3.0, Intellectual: 3.6 } },
  { date: "2026-09-22", scores: { Physical: 2.9, Emotional: 3.0, Social: 2.8, Intellectual: 3.4 } },
];

function history(): { entries: Entry[]; sample: boolean } {
  try {
    const raw = localStorage.getItem("checkin");
    const h = raw ? (JSON.parse(raw)?.state?.history as Entry[] | undefined) : undefined;
    if (h?.length) return { entries: h, sample: h.length <= SEED.length };
  } catch { /* fall through */ }
  return { entries: SEED, sample: true };
}

const day = (d: string) => new Date(d + "T00:00:00").getTime();
const x = (d: string) => ((day(d) - day(TERM.start)) / (day(TERM.end) - day(TERM.start))) * 100;

function Spark({ dim, entries, wear }: { dim: string; entries: Entry[]; wear: DayRow[] | null }) {
  const pts = entries.filter((e) => e.scores[dim] != null).map((e) => ({ x: x(e.date), y: e.scores[dim] }));
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${(36 - ((p.y - 1) / 4) * 32).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const first = pts[0];
  const delta = last && first && pts.length > 1 ? last.y - first.y : 0;
  const sentence = wear ? sleepSentence(dim, entries.filter((e) => e.scores[dim] != null).map((e) => ({ date: e.date, score: e.scores[dim] })), wear) : null;
  const sleepPts = wear ? entries.filter((e) => e.scores[dim] != null).map((e) => ({ x: x(e.date), h: windowBefore(wear, e.date).sleep_h })).filter((p) => p.h != null) as { x: number; h: number }[] : [];
  const shaded = (calendar.periods as { id: string; label: string; start: string; end: string; kind: string; verified?: boolean }[])
    .filter((p) => p.kind === "academic" && p.id !== "classes-begin" && p.id !== "add-drop");
  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <p className="display text-lg">{dim}</p>
        <span className="font-mono text-xs text-soft">{last ? `${last.y.toFixed(1)} / 5` : "not yet"}{pts.length > 1 ? ` · ${delta >= 0 ? "up" : "down"} ${Math.abs(delta).toFixed(1)} since ${entries[0].date.slice(5)}` : ""}</span>
      </div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="mt-2 h-14 w-full" role="img" aria-label={`${dim} over the term`}>
        {shaded.map((p) => <rect key={p.id} x={x(p.start)} y={0} width={Math.max(0.8, x(p.end) - x(p.start))} height={40} fill="var(--color-acid)" opacity={p.verified ? 0.35 : 0.18} />)}
        <line x1={0} x2={100} y1={36} y2={36} stroke="var(--color-rule)" strokeWidth={0.5} />
        <line x1={0} x2={100} y1={4} y2={4} stroke="var(--color-rule)" strokeWidth={0.5} />
        {path && <path d={path} fill="none" stroke="var(--color-ink)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
        {sleepPts.map((p, i) => <rect key={"s" + i} x={p.x - 1.2} y={40 - Math.min(10, p.h) * 0.9} width={2.4} height={Math.min(10, p.h) * 0.9} fill="var(--color-teal)" opacity={0.45} />)}
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={36 - ((p.y - 1) / 4) * 32} r={i === pts.length - 1 ? 2.2 : 1.4} fill={i === pts.length - 1 ? "var(--color-acid)" : "var(--color-ink)"} stroke="var(--color-ink)" strokeWidth={0.6} />)}
      </svg>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-teal"><span>Aug 31</span><span>stretched 1 · flourishing 5{sleepPts.length ? " · teal = sleep" : ""}</span><span>Dec 22</span></div>
      {sentence && <p className="mt-2 text-sm">{sentence}</p>}
    </Card>
  );
}

export default function Trend() {
  const { entries, sample } = useMemo(history, []);
  const wearable = useMemo(loadWearable, []);
  const answered = DIMS.filter((d) => entries.some((e) => e.scores[d] != null));
  const latest = entries[entries.length - 1];
  const moved = answered.map((d) => { const v = entries.filter((e) => e.scores[d] != null).map((e) => e.scores[d]); return { d, delta: v.length > 1 ? v[v.length - 1] - v[0] : 0 }; })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  return (
    <section className="space-y-4">
      <Title>Your term so far</Title>
      <p className="text-sm text-soft">{entries.length} check-in{entries.length === 1 ? "" : "s"} since {entries[0]?.date}. Latest {latest?.date}.
        {moved && Math.abs(moved.delta) >= 0.3 ? ` ${moved.d} is ${moved.delta > 0 ? "up" : "down"} ${Math.abs(moved.delta).toFixed(1)} since ${entries[0].date.slice(5)}.` : ""}</p>
      {sample && <p className="text-xs text-soft">Sample history. <Link to="/checkin" className="underline">Check in</Link> to start your own; it stays on this phone.</p>}
      {answered.map((d) => <Spark key={d} dim={d} entries={entries} wear={wearable?.rows ?? null} />)}
      <p className="text-xs text-soft">{wearable ? `Sleep from ${wearable.source}, on this phone only. ` : ""}<Link to="/devices" className="underline">{wearable ? "Manage devices" : "Add sleep and steps from your watch"}</Link></p>
      {!answered.length && <Card><p className="text-sm">No check-ins yet. Pick one dimension on the check-in page to start a line.</p></Card>}
      <Eyebrow>Shaded weeks</Eyebrow>
      <p className="text-xs text-soft">{(calendar.periods as { label: string; kind: string; verified?: boolean }[]).filter((p) => p.kind === "academic").map((p) => p.label + (p.verified ? "" : " (approximate)")).join(" · ")}</p>
      <Source text="your own check-ins, local storage only; calendar from data/academic_calendar_fall2026.json (registrar pages)" />
    </section>
  );
}
