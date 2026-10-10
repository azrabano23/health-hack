// The landing hero: one full day of a synthetic participant's glucose (timeline fixture), with the
// day's own events written onto it. No y-axis numbers: shape and context only.
import type { Timeline } from "@/api/types";
import { Icon } from "@/components/ui";

const W = 1440, H = 300, TOP = 120, BOT = 280;
// Fixture timestamps are a synthetic wall-clock day; read HH:MM directly so time zones can't shift it.
const mins = (ts: string) => +ts.slice(11, 13) * 60 + +ts.slice(14, 16);
const clock = (m: number) => { const h = Math.floor(m / 60) % 24, mm = m % 60; return `${h % 12 || 12}${mm ? `:${String(mm).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`; };
const x = (m: number) => (m / 1440) * W;

export function DayLine({ t }: { t: Timeline }) {
  // Light display smoothing (7-reading centred average, ~35 min) so fixture step artefacts don't read as events.
  const pts = t.glucose.map((p, i, all) => {
    const w = all.slice(Math.max(0, i - 3), i + 4);
    return { ts: p.ts, g: w.reduce((a, b) => a + b.g, 0) / w.length };
  });
  const gs = pts.map((p) => p.g);
  const lo = Math.min(...gs) - 6, hi = Math.max(...gs) + 6;
  const y = (g: number) => BOT - ((g - lo) / (hi - lo)) * (BOT - TOP);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(mins(p.ts)).toFixed(1)} ${y(p.g).toFixed(1)}`).join(" ");
  const gAt = (m: number) => pts.reduce((a, b) => (Math.abs(mins(b.ts) - m) < Math.abs(mins(a.ts) - m) ? b : a)).g;

  const sleep = t.events.find((e) => e.type === "sleep");
  const sleepEnd = sleep?.end ? mins(sleep.end) : 0;
  const walk = t.events.find((e) => e.type === "exercise");
  const marks = [
    ...t.meals.map((m) => ({ m: mins(m.ts), label: m.label, icon: "meal" })),
    ...(walk ? [{ m: mins(walk.start), label: `${walk.value.minutes}-minute walk`, icon: "move" }] : []),
  ].sort((a, b) => a.m - b.m)
    .map((k, i, all) => ({ ...k, row: i > 0 && k.m - all[i - 1].m < 150 ? 1 : 0 }));

  const ns = { vectorEffect: "non-scaling-stroke" as const };
  return (
    <figure>
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <div className="relative h-[336px] min-w-[760px]">
          {/* Stretches horizontally only: viewBox y-units are real pixels, so HTML labels line up. */}
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[300px] w-full" role="img"
            aria-label="One day of glucose: short sleep overnight, then rises after breakfast, lunch and dinner, and a smaller rise after the walk.">
            {sleep && <rect x="0" y="0" width={x(sleepEnd)} height={H} fill="var(--color-acid-soft)" />}
            <line x1="0" x2={W} y1={H - 1} y2={H - 1} stroke="var(--color-rule)" strokeWidth="1.5" {...ns} />
            {marks.map((k) => <line key={k.m} x1={x(k.m)} x2={x(k.m)} y1={y(gAt(k.m)) - 12} y2={k.row ? 100 : 48} stroke="var(--color-ink)" strokeWidth="1.2" strokeDasharray="2 4" {...ns} />)}
            <path d={d} fill="none" stroke="var(--color-ink)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" className="draw" {...ns} />
          </svg>
          {sleep && (
            <p className="absolute left-3 top-[150px] max-w-[14ch] text-[15px] leading-snug text-soft">
              <Icon name="sleep" size={16} className="mb-1 text-ink" />{String(sleep.value.hours)} hours of sleep
            </p>)}
          {marks.map((k) => (
            <p key={k.m} className="absolute z-10 -translate-x-1/2 whitespace-nowrap bg-white px-2 pb-1 text-center text-[15px] leading-tight" style={{ left: `${(k.m / 1440) * 100}%`, top: k.row ? 52 : 0 }}>
              <span className="flex items-center justify-center gap-1 font-bold"><Icon name={k.icon} size={15} />{k.label}</span>
              <span className="num text-soft">{clock(k.m)}</span>
            </p>))}
          {[0, 360, 720, 1080, 1440].map((m, i) => (
            <span key={m} className={`absolute top-[306px] text-[14px] text-soft ${i === 0 ? "" : i === 4 ? "-translate-x-full" : "-translate-x-1/2"}`} style={{ left: `${(m / 1440) * 100}%` }}>
              {m === 720 ? "noon" : m % 1440 === 0 ? "midnight" : clock(m)}</span>))}
        </div>
      </div>
      <figcaption className="mt-3 text-[14px] text-soft">One day of glucose from a synthetic participant in our demo data, lightly smoothed. No real student data is used anywhere.</figcaption>
    </figure>
  );
}
