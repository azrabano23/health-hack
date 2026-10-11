// Surface: trend. Spec: docs/SOURCE_OF_TRUTH.md 2.6.
// The student's twin: a personal baseline per dimension (a running usual and the band they normally move in), the
// latest check-in placed against it, and the kinds of place that have worked for them. It sharpens with every
// check-in and every "I went" tap. Computed by the engine when it runs, otherwise on the phone; never predicted.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { Tap, Twin, TwinRow } from "@/api/types";
import type { PageRoute } from "@/App";
import { Card, Eyebrow, Source, Title } from "@/components/ui";
import calendar from "../../../../data/academic_calendar_fall2026.json";
import { forEngine, loadTaps } from "@/data/taps";
import { loadWearable, sleepSentence, windowBefore, type DayRow } from "@/data/wearable";

export const route: PageRoute = { path: "/trend", label: "Trend", order: 4.5, owner: "team" };

type Entry = { date: string; scores: Record<string, number> };
const TERM = { start: "2026-08-31", end: "2026-12-22" };
const SEED: Entry[] = [
  { date: "2026-09-08", scores: { Physical: 3.1, Emotional: 3.4, Social: 3.0, Intellectual: 3.6 } },
  { date: "2026-09-22", scores: { Physical: 2.9, Emotional: 3.0, Social: 2.8, Intellectual: 3.4 } },
];
const KIND_WORDS: Record<string, string> = { green: "green space", recreation: "rec and fitness", counseling: "counseling", social: "student centres",
  dining: "dining", library: "libraries", "quiet-space": "quiet rooms", health: "health services", academic: "academic support", financial: "money help",
  career: "career services", spiritual: "chaplaincies and quiet", cultural: "cultural centres" };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

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
const y = (v: number) => 36 - ((v - 1) / 4) * 32;
const SHADED = (calendar.periods as { id: string; label: string; start: string; end: string; kind: string; verified?: boolean }[])
  .filter((p) => p.kind === "academic" && p.id !== "classes-begin" && p.id !== "add-drop");

function Row({ row, entries, wear }: { row: TwinRow; entries: Entry[]; wear: DayRow[] | null }) {
  const dim = cap(row.dimension);
  const mine = entries.filter((e) => (e.scores[dim] ?? e.scores[row.dimension]) != null).map((e) => ({ date: e.date, score: e.scores[dim] ?? e.scores[row.dimension] }));
  const pts = mine.map((p) => ({ x: x(p.date), y: y(p.score) }));
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const sentence = wear ? sleepSentence(row.dimension, mine, wear) : null;
  const sleepPts = wear ? mine.map((p) => ({ x: x(p.date), h: windowBefore(wear, p.date).sleep_h })).filter((p) => p.h != null) as { x: number; h: number }[] : [];
  const tone = row.word === "about your usual" ? "bg-canvas text-ink" : "bg-acid text-ink";
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="display text-[20px] leading-tight">{dim}</p>
          <p className="mt-1 text-[14px] text-soft">Now <span className="num font-bold text-ink">{row.latest.toFixed(1)}</span> · usually <span className="num font-bold text-ink">{row.usual.toFixed(1)}</span> out of 5</p>
        </div>
        <span className={`shrink-0 rounded-full border-[1.5px] border-rule px-3 py-1 text-[13px] font-bold ${tone}`}>{row.word === "about your usual" ? "normal for you" : row.deviation < 0 ? "lower than usual" : "higher than usual"}</span>
      </div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="mt-3 h-16 w-full" role="img" aria-label={`${dim} over the term against your usual`}>
        {SHADED.map((p) => <rect key={p.id} x={x(p.start)} y={0} width={Math.max(0.8, x(p.end) - x(p.start))} height={40} fill="var(--color-acid)" opacity={p.verified ? 0.35 : 0.18} />)}
        <rect x={0} y={y(row.usual + row.band)} width={100} height={Math.max(1, y(row.usual - row.band) - y(row.usual + row.band))} fill="var(--color-ink)" opacity={0.08} />
        <line x1={0} x2={100} y1={y(row.usual)} y2={y(row.usual)} stroke="var(--color-ink)" strokeWidth={0.6} strokeDasharray="1.5 1.5" vectorEffect="non-scaling-stroke" />
        {path && <path d={path} fill="none" stroke="var(--color-ink)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
        {sleepPts.map((p, i) => <rect key={"s" + i} x={p.x - 1.2} y={40 - Math.min(10, p.h) * 0.9} width={2.4} height={Math.min(10, p.h) * 0.9} fill="var(--color-teal)" opacity={0.45} />)}
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 2.4 : 1.4} fill={i === pts.length - 1 ? "var(--color-scarlet)" : "var(--color-ink)"} stroke="white" strokeWidth={0.6} />)}
      </svg>
      <div className="flex justify-between text-[11px] uppercase tracking-wider text-soft"><span>Aug 31</span><span>grey = normal · pink = exams{sleepPts.length ? " · teal = sleep" : ""}</span><span>Dec 22</span></div>
      <p className="mt-2 text-[14px]">
        {row.word === "about your usual" ? "Within your normal range." : `${Math.abs(row.deviation).toFixed(1)} ${row.deviation < 0 ? "below" : "above"} what is normal for you. Worth a look, not a verdict.`}
        {row.trend === "settling" ? " The last three check-ins have been going down." : row.trend === "rising" ? " The last three check-ins have been going up." : ""}
      </p>
      {sentence && <p className="mt-1 text-[14px] text-soft">{sentence}</p>}
    </Card>
  );
}

export default function Trend() {
  const { entries, sample } = useMemo(history, []);
  const wearable = useMemo(loadWearable, []);
  const [taps, setTaps] = useState<Tap[]>(loadTaps);
  const [twin, setTwin] = useState<Twin>();
  useEffect(() => { const f = () => setTaps(loadTaps()); window.addEventListener("taps", f); return () => window.removeEventListener("taps", f); }, []);
  useEffect(() => { api.twin({ history: entries, taps: forEngine(taps) }).then(setTwin); }, [entries, taps]);
  if (!twin) return <p className="py-12 text-[15px] text-soft">Working out your usual…</p>;
  const latest = entries[entries.length - 1];
  const off = twin.dimensions.filter((r) => r.word !== "about your usual");
  return (
    <section className="space-y-4">
      <Title>How you are doing</Title>
      <p className="text-[16px] leading-relaxed">{off.length ? `Right now ${off.map((r) => `${r.dimension} is ${r.deviation < 0 ? "lower" : "higher"} than usual for you`).join(" and ")}. ` : "Everything is about where it usually is for you. "}
        The rest of this page is just that comparison, one line per dimension: your latest check-in next to what is normal for you.</p>
      <p className="text-[14px] text-soft">{entries.length} check-in{entries.length === 1 ? "" : "s"} since {entries[0]?.date}. Nothing here is predicted and nothing leaves your phone.</p>
      {sample && <p className="text-[13px] text-soft">Sample history. <Link to="/checkin" className="underline">Check in</Link> to start your own; it stays on this phone.</p>}

      {twin.dimensions.map((r) => <Row key={r.dimension} row={r} entries={entries} wear={wearable?.rows ?? null} />)}
      {!twin.dimensions.length && <Card><p className="text-[15px]">No check-ins yet. Pick one dimension on the check-in page to start a line.</p></Card>}

      <Card>
        <Eyebrow>Places that have worked for you</Eyebrow>
        {twin.learned.kinds.length ? (
          <ul className="mt-2 divide-y-[1.5px] divide-rule">
            {twin.learned.kinds.map((k) => (
              <li key={k.kind} className="flex items-center gap-3 py-2.5">
                <div className="flex-1">
                  <p className="text-[15px] font-bold">{KIND_WORDS[k.kind] ?? k.kind}</p>
                  <p className="text-[13px] text-soft">went {k.followed} of {k.shown} time{k.shown === 1 ? "" : "s"}</p>
                </div>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-rule"><div className="h-full rounded-full bg-scarlet" style={{ width: `${Math.round(k.rate * 100)}%` }} /></div>
                <span className="num w-12 text-right text-[13px] text-soft">{k.delta > 0 ? "+" : ""}{k.delta.toFixed(2)}</span>
              </li>))}
          </ul>
        ) : <p className="mt-1 text-[15px] text-soft">Nothing learned yet. On <Link to="/feedback" className="underline">Feedback</Link>, tap "I went" or "Not for me" under a place and your ranking starts to lean toward the kinds that work for you.</p>}
        <p className="mt-2 text-[13px] text-soft">Each "I went" moves that kind of place up your list a little; each "Not for me" moves it down. Only the kind and a yes or no leave the phone.</p>
      </Card>

      <Card>
        <Eyebrow>Next check-in</Eyebrow>
        <p className="mt-1 display text-[20px] leading-tight">{cap(twin.next_checkin.cadence)}</p>
        <p className="mt-1 text-[14px] text-soft">{twin.next_checkin.why}</p>
      </Card>

      <Card>
        <Eyebrow>How this gets better</Eyebrow>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px]">
          <li>Every check-in updates what counts as normal for you, with recent weeks weighing most.</li>
          <li>Every "I went" or "Not for me" teaches it which kinds of places suit you.</li>
          <li>It never guesses the future and it never stores anything off your phone.</li>
        </ul>
      </Card>

      <p className="text-[13px] text-soft">{wearable ? `Sleep from ${wearable.source}, on this phone only. ` : ""}<Link to="/devices" className="underline">{wearable ? "Manage devices" : "Add sleep and steps from your watch"}</Link></p>
      <Eyebrow>Shaded weeks</Eyebrow>
      <p className="text-[13px] text-soft">{(calendar.periods as { label: string; kind: string; verified?: boolean }[]).filter((p) => p.kind === "academic").map((p) => p.label + (p.verified ? "" : " (approximate)")).join(" · ")}</p>
      <Source text={`${twin.source}; method ${twin.method}; calendar from data/academic_calendar_fall2026.json (registrar pages)`} />
    </section>
  );
}
