// Surface: trend. Spec: docs/SOURCE_OF_TRUTH.md 2.6.
// The student's twin: their own usual per dimension (a running average and the band they normally move in), the
// latest check-in placed against it on a body figure, and the kinds of place that have worked for them. It sharpens
// with every check-in and every "I went" tap. Computed by the engine when it runs, otherwise on the phone; never predicted.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { Tap, Twin, TwinRow } from "@/api/types";
import type { PageRoute } from "@/App";
import { TwinBody } from "@/components/TwinBody";
import { Card, Eyebrow, Source, Title } from "@/components/ui";
import calendar from "../../../../data/academic_calendar_fall2026.json";
import { forEngine, loadTaps } from "@/data/taps";
import { loadWearable, sleepSentence, windowBefore, type DayRow } from "@/data/wearable";

export const route: PageRoute = { path: "/trend", label: "Your twin", order: 4.5, owner: "team" };

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
const DAY = 864e5;
const SHADED = (calendar.periods as { id: string; label: string; start: string; end: string; kind: string; verified?: boolean }[])
  .filter((p) => p.kind === "academic" && p.id !== "classes-begin" && p.id !== "add-drop");

function Chart({ pts, usual, band, sleep, label }: { pts: { date: string; score: number }[]; usual: number; band: number; sleep: { date: string; h: number }[]; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const H = 156, L = 26, R = 10, T = 14, B = 22, SB = sleep.length ? 18 : 0;
  const sorted = [...pts].sort((a, b) => a.date.localeCompare(b.date));
  const times = sorted.map((p) => day(p.date));
  // Zoom to the weeks that have data (at least four), not the whole term, so the line has room to move.
  const t0 = Math.min(...times) - 3 * DAY;
  const t1 = Math.max(t0 + 28 * DAY, Math.max(...times, Math.min(Date.now(), day(TERM.end))) + 3 * DAY);
  const vals = [...sorted.map((p) => p.score), usual - band, usual + band];
  let lo = Math.max(1, Math.min(...vals) - 0.4), hi = Math.min(5, Math.max(...vals) + 0.4);
  if (hi - lo < 1.6) { hi = Math.min(5, lo + 1.6); lo = Math.max(1, hi - 1.6); }
  const X = (t: number) => L + ((t - t0) / (t1 - t0)) * (w - L - R);
  const Y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B - SB);
  const yticks: number[] = []; for (let v = Math.ceil(lo * 2) / 2; v <= hi; v += 0.5) yticks.push(v);
  const last = sorted[sorted.length - 1], plotB = H - B - SB;
  return (
    <div ref={box} className="mt-3">
      <svg width={w} height={H} role="img" aria-label={label} className="block">
        {SHADED.map((p) => { const a = Math.max(X(day(p.start)), L), b = Math.min(X(day(p.end) + DAY), w - R); return b > a ? <rect key={p.id} x={a} y={T} width={b - a} height={plotB - T} fill="var(--color-acid)" opacity={p.verified ? 0.45 : 0.25} /> : null; })}
        {yticks.map((v) => <g key={v}><line x1={L} x2={w - R} y1={Y(v)} y2={Y(v)} stroke="var(--color-rule)" strokeWidth={1} /><text x={L - 6} y={Y(v) + 4} textAnchor="end" fontSize={11} fill="var(--color-soft)">{v % 1 ? v.toFixed(1) : v}</text></g>)}
        <rect x={L} y={Y(usual + band)} width={w - L - R} height={Math.max(2, Y(usual - band) - Y(usual + band))} fill="var(--color-ink)" opacity={0.07} />
        <line x1={L} x2={w - R} y1={Y(usual)} y2={Y(usual)} stroke="var(--color-ink)" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
        <text x={w - R} y={Y(usual) - 5} textAnchor="end" fontSize={11} fill="var(--color-soft)">your usual {usual.toFixed(1)}</text>
        {sleep.map((p, i) => <rect key={"s" + i} x={X(day(p.date)) - 3} y={H - B - Math.min(10, p.h) / 10 * SB} width={6} height={Math.min(10, p.h) / 10 * SB} rx={1} fill="var(--color-teal)" opacity={0.5} />)}
        <path d={sorted.map((p, i) => `${i ? "L" : "M"}${X(day(p.date)).toFixed(1)},${Y(p.score).toFixed(1)}`).join(" ")} fill="none" stroke="var(--color-ink)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {sorted.map((p, i) => {
          const isLast = p === last, cx = X(day(p.date)), cy = Y(p.score);
          return <g key={i}><circle cx={cx} cy={cy} r={isLast ? 6 : 4.5} fill={isLast ? "var(--color-scarlet)" : "var(--color-ink)"} stroke="white" strokeWidth={2} />
            {(isLast || sorted.length <= 6) && <text x={cx} y={cy - 11} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--color-ink)">{p.score.toFixed(1)}</text>}</g>;
        })}
        <line x1={L} x2={w - R} y1={H - B} y2={H - B} stroke="var(--color-rule)" strokeWidth={1} />
        {sorted.map((p, i) => <text key={i} x={X(day(p.date))} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--color-soft)">{new Date(day(p.date)).toLocaleString("en-US", { month: "short", day: "numeric" })}</text>)}
      </svg>
      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-soft">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-scarlet" />latest check-in</span>
        <span><i className="mr-1 inline-block h-2 w-4 rounded-sm bg-ink/10" />where you normally move</span>
        <span><i className="mr-1 inline-block h-2 w-4 rounded-sm bg-acid" />exam weeks</span>
        {sleep.length > 0 && <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-teal/50" />hours slept</span>}
      </p>
    </div>
  );
}

function Row({ row, entries, wear }: { row: TwinRow; entries: Entry[]; wear: DayRow[] | null }) {
  const dim = cap(row.dimension);
  const mine = entries.filter((e) => (e.scores[dim] ?? e.scores[row.dimension]) != null).map((e) => ({ date: e.date, score: e.scores[dim] ?? e.scores[row.dimension] }));
  const sentence = wear ? sleepSentence(row.dimension, mine, wear) : null;
  const sleepPts = wear ? mine.map((p) => ({ date: p.date, h: windowBefore(wear, p.date).sleep_h })).filter((p) => p.h != null) as { date: string; h: number }[] : [];
  const tone = row.word === "about your usual" ? "bg-canvas text-ink" : "bg-acid text-ink";
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="display text-[20px] leading-tight">{dim}</p>
          <p className="mt-1 text-[14px] text-soft">Now <span className="num font-bold text-ink">{row.latest.toFixed(1)}</span> · usually <span className="num font-bold text-ink">{row.usual.toFixed(1)}</span> out of 5</p>
        </div>
        <span className={`shrink-0 rounded-full border-[1.5px] border-rule px-3 py-1 text-[13px] font-bold ${tone}`}>{row.word === "about your usual" ? "about your usual" : row.deviation < 0 ? "below your usual" : "above your usual"}</span>
      </div>
      <Chart pts={mine} usual={row.usual} band={row.band} sleep={sleepPts} label={`${dim} over the term against your usual`} />
      <p className="mt-2 text-[14px]">
        {row.word === "about your usual" ? "About your usual." : `${Math.abs(row.deviation).toFixed(1)} ${row.deviation < 0 ? "below" : "above"} your usual. Worth a look, not a verdict.`}
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
  const off = twin.dimensions.filter((r) => r.word !== "about your usual");
  return (
    <section className="space-y-4">
      <Title>Your twin</Title>
      <p className="text-[16px] leading-relaxed">Your twin is your own usual in each of the eight wellness dimensions, worked out from nothing but your check-ins and your "I went" taps.
        On the figure, scarlet means a dimension is below your usual right now, pink means above it, and grey means you are about where you normally are.</p>
      <p className="text-[15px] leading-relaxed text-soft">{off.length ? `Right now ${off.map((r) => `${r.dimension} is ${r.deviation < 0 ? "lower" : "higher"} than usual for you`).join(" and ")}. ` : "Everything is about where it usually is for you. "}
        {entries.length} check-in{entries.length === 1 ? "" : "s"} since {entries[0]?.date}. Nothing here is predicted and nothing leaves your phone.</p>
      {sample && <p className="text-[13px] text-soft">Sample history. <Link to="/checkin" className="underline">Check in</Link> to start your own; it stays on this phone.</p>}

      <Card>
        <Eyebrow>Your twin, today</Eyebrow>
        <TwinBody rows={twin.dimensions} />
        <p className="mt-3 text-[14px] leading-relaxed text-soft">Your twin is a picture of your own usual, built only from your check-ins. Scarlet where you are below your usual right now, pink where you are above it, grey where you are about where you normally are. Outlined parts are waiting for a first check-in. It never predicts.</p>
      </Card>

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
          <li>Every check-in updates your usual, with recent weeks counting most.</li>
          <li>Every "I went" or "Not for me" teaches it which kinds of places suit you.</li>
          <li>It never guesses ahead and it never stores anything off your phone.</li>
        </ul>
      </Card>

      <p className="text-[13px] text-soft">{wearable ? `Sleep from ${wearable.source}, on this phone only. ` : ""}<Link to="/devices" className="underline">{wearable ? "Manage devices" : "Add sleep and steps from your watch"}</Link></p>
      <Eyebrow>Shaded weeks</Eyebrow>
      <p className="text-[13px] text-soft">{(calendar.periods as { label: string; kind: string; verified?: boolean }[]).filter((p) => p.kind === "academic").map((p) => p.label + (p.verified ? "" : " (approximate)")).join(" · ")}</p>
      <Source text={`${twin.source}; method ${twin.method}; calendar from data/academic_calendar_fall2026.json (registrar pages)`} />
    </section>
  );
}
