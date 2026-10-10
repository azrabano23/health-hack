// Surface: staff (Challenge 2). First pass by the team; Nitu owns the natural-language box and polish.
// Aggregate only. Never an individual. Cells under k = 5 never reach this page (the engine drops them).
import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/client";
import type { AggregateCell, AggregateWeekly, Dimension, Dip, Resource, Stressor } from "@/api/types";
import type { PageRoute } from "@/App";
import { Card, Eyebrow, Source, Title } from "@/components/ui";
import { DINING_FACTS, DINING_PLANS, PELL, PELL_SOURCE, WEEK_PATTERN } from "@/data/dining_context";

export const route: PageRoute = { path: "/staff", label: "Staff view", order: 6.5, owner: "team" };

const CAMPUS = { nb: "New Brunswick", nwk: "Newark", cam: "Camden" } as const;
const LEVEL = { undergrad: "Undergrad", grad: "Grad" } as const;
type Campus = keyof typeof CAMPUS; type Level = keyof typeof LEVEL;

// Sequential, one hue (teal), lighter = flourishing, darker = stretched. Magnitude is 5 - mean.
function shade(mean: number) {
  const t = Math.min(1, Math.max(0, (5 - mean - 0.8) / 2.4));   // 4.2 and above reads as the lightest step
  const l = 96 - t * 58;                                          // lightness 96 to 38
  return `hsl(192 22% ${l}%)`;
}
const inkOn = (mean: number) => (5 - mean - 0.8) / 2.4 > 0.55 ? "#fff" : "var(--color-ink)";

function weekOf(ws: string, start: string, end: string) {
  const w0 = new Date(ws + "T00:00:00"), w1 = new Date(w0.getTime() + 6 * 86400000);
  return new Date(start + "T00:00:00") <= w1 && new Date(end + "T00:00:00") >= w0;
}

export default function Staff() {
  const [agg, setAgg] = useState<AggregateWeekly>();
  const [dips, setDips] = useState<Dip[]>([]);
  const [campus, setCampus] = useState<Campus>("cam");
  const [level, setLevel] = useState<Level>("undergrad");
  const [sel, setSel] = useState<Dip | null>(null);
  const [places, setPlaces] = useState<Resource[]>([]);
  const [dining, setDining] = useState<Resource[]>([]);
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<AggregateCell | null>(null);

  useEffect(() => { api.aggregateWeekly().then(setAgg); api.aggregateDips().then((d) => setDips(d.dips)); }, []);
  useEffect(() => { if (sel) api.resources({ dimension: sel.dimension, campus: sel.campus }).then((r) => setPlaces(r.items.slice(0, 3))); }, [sel]);
  useEffect(() => { api.resources({ dimension: "physical", campus }).then((r) => setDining(r.items.filter((i) => i.kind === "dining" || /pantry|basic needs|raptor's nest/i.test(i.name)))); }, [campus]);

  const cells = useMemo(() => agg?.cells.filter((c) => c.campus === campus && c.level === level) ?? [], [agg, campus, level]);
  const weeks = useMemo(() => [...new Set(cells.map((c) => c.week))].sort((a, b) => a - b), [cells]);
  const weekStart = useMemo(() => Object.fromEntries(cells.map((c) => [c.week, c.week_start])), [cells]);
  const dims = agg?.dimensions ?? [];
  const grid = useMemo(() => { const m: Record<string, AggregateCell> = {}; cells.forEach((c) => { m[`${c.dimension}:${c.week}`] = c; }); return m; }, [cells]);
  const here = dips.filter((d) => d.campus === campus && d.level === level).slice(0, 6);
  const stressors = agg?.stressors ?? [];

  useEffect(() => { if (!sel && here.length) setSel(here[0]); }, [here, sel]);

  if (!agg) return <p className="py-12 text-sm opacity-60">Loading the campus picture…</p>;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Title>Where the need is</Title>
          <p className="text-sm text-soft">Weekly mean by dimension, {agg.term}. At least {agg.k_min} students behind every cell; smaller cells are dropped before they reach this page.</p>
        </div>
        <span className="rounded border border-ink px-2 py-1 font-mono text-[10px] uppercase tracking-wider">{agg.synthetic ? "synthetic data" : "de-identified data"}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(CAMPUS) as Campus[]).map((k) => (
          <button key={k} onClick={() => { setCampus(k); setSel(null); }} className={`rounded border px-3 py-1.5 text-sm ${campus === k ? "border-ink bg-acid" : "border-rule"}`}>{CAMPUS[k]}</button>))}
        <span className="w-2" />
        {(Object.keys(LEVEL) as Level[]).map((k) => (
          <button key={k} onClick={() => { setLevel(k); setSel(null); }} className={`rounded border px-3 py-1.5 text-sm ${level === k ? "border-ink bg-ink text-canvas" : "border-rule"}`}>{LEVEL[k]}</button>))}
        <button onClick={() => setTable((t) => !t)} className="ml-auto rounded border border-rule px-3 py-1.5 text-sm">{table ? "Grid" : "Table"}</button>
      </div>

      <Card>
        <div className="flex items-baseline justify-between">
          <Eyebrow>Dimension by week · {CAMPUS[campus]} {LEVEL[level].toLowerCase()}</Eyebrow>
          <span className="font-mono text-[10px] text-soft">lighter = flourishing · darker = stretched</span>
        </div>
        {!table ? (
          <div className="mt-3 overflow-x-auto">
            <div className="grid gap-[2px]" style={{ gridTemplateColumns: `110px repeat(${weeks.length}, minmax(28px, 1fr))` }}>
              {/* stressor bands */}
              <div className="font-mono text-[10px] text-soft">stressors</div>
              {weeks.map((w) => {
                const hits = stressors.filter((s) => weekOf(weekStart[w], s.start, s.end) && s.kind !== "break");
                return <div key={w} title={hits.map((s) => s.label).join(", ")} className={`h-3 rounded-sm ${hits.length ? "bg-acid" : "bg-rule"}`} />;
              })}
              {dims.map((d) => (
                <DimRow key={d} d={d} weeks={weeks} grid={grid} onHover={setHover} sel={sel} onPick={(c) => {
                  const hit = dips.find((x) => x.campus === campus && x.level === level && x.dimension === d && x.week === c.week);
                  if (hit) setSel(hit);
                }} />
              ))}
              <div />
              {weeks.map((w) => <div key={w} className="text-center font-mono text-[10px] text-soft">{w}</div>)}
            </div>
            <p className="mt-2 min-h-5 font-mono text-xs text-soft">
              {hover ? `${hover.dimension}, week ${hover.week} (${hover.week_start}): mean ${hover.mean.toFixed(2)}, n = ${hover.n}` : "hover a cell"}
            </p>
            <StressorKey stressors={stressors} />
          </div>
        ) : (
          <table className="mt-3 w-full text-left font-mono text-xs">
            <thead><tr><th className="py-1">dimension</th>{weeks.map((w) => <th key={w} className="py-1 text-right">w{w}</th>)}</tr></thead>
            <tbody>{dims.map((d) => <tr key={d} className="border-t border-rule"><td className="py-1 capitalize">{d}</td>{weeks.map((w) => <td key={w} className="py-1 text-right">{grid[`${d}:${w}`]?.mean.toFixed(2) ?? ""}</td>)}</tr>)}</tbody>
          </table>
        )}
        <Source text="synthetic check-ins generated from data/academic_calendar_fall2026.json; k = 5 enforced in engine/aggregate/cells.py" />
      </Card>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Eyebrow>Dining and eating habits · {CAMPUS[campus]}</Eyebrow>
          <span className="font-mono text-[10px] text-soft">Pell share {PELL[campus]} ({PELL_SOURCE})</span>
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm font-bold">What the numbers say</p>
            <ul className="mt-2 space-y-2">
              {DINING_FACTS.map((f) => (
                <li key={f.label} className="text-sm" title={f.source}><span className="font-mono font-bold">{f.value}</span> {f.label}<span className="block text-[11px] text-soft">{f.source}</span></li>))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold">Quick-service share of logged meals by day</p>
            <p className="text-[11px] text-soft">synthetic shape until Dining or ScarletWell share logs; direction from Montarroyos et al. 2024</p>
            <div className="mt-3 flex h-28 items-end gap-2">
              {WEEK_PATTERN.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="font-mono text-[10px] text-soft">{Math.round(d.quick * 100)}%</span>
                  <div className="w-full rounded-t-sm" style={{ height: `${d.quick * 150}px`, background: d.quick >= 0.45 ? "hsl(345 70% 46%)" : "hsl(192 22% 70%)" }} aria-label={`${d.day} ${Math.round(d.quick * 100)}%`} />
                  <span className="font-mono text-[10px]">{d.day}</span>
                </div>))}
            </div>
            <p className="mt-2 text-[12px] text-soft">Friday to Sunday run higher. That is where the operational levers below point.</p>
          </div>
          <div>
            <p className="text-sm font-bold">Dining halls and pantry on this campus</p>
            <ul className="mt-2 space-y-1 text-sm">
              {dining.length ? dining.slice(0, 8).map((d) => <li key={d.id}>{d.name}{d.open_now === true ? <span className="text-[11px] text-soft"> · open now</span> : d.open_now === false ? <span className="text-[11px] text-soft"> · closed now</span> : null}</li>)
                : <li className="text-soft">none in the registry for this campus yet</li>}
            </ul>
            <p className="mt-3 text-sm font-bold">Operational plan</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">{DINING_PLANS[campus].map((x) => <li key={x}>{x}</li>)}</ol>
          </div>
        </div>
        <Source text="numbers: docs/EVIDENCE.md section 6; dining halls and pantry: data/rutgers_resources.json; weekday bars synthetic" />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <Eyebrow>Dips worth a look</Eyebrow>
          <ul className="mt-2 divide-y divide-rule">
            {here.map((d) => (
              <li key={`${d.dimension}${d.week}`}>
                <button onClick={() => setSel(d)} className={`flex w-full items-baseline justify-between py-2 text-left ${sel === d ? "font-medium" : ""}`}>
                  <span className="capitalize">{d.dimension} · week {d.week}</span>
                  <span className="font-mono text-xs text-soft">{d.previous_mean.toFixed(2)} to {d.mean.toFixed(2)} · n {d.n}</span>
                </button>
              </li>))}
            {!here.length && <li className="py-2 text-sm text-soft">No dips over the threshold here.</li>}
          </ul>
          <Source text="dip = week-over-week drop over 0.3 on 1 to 5, or lowest week of the term (engine/aggregate/dips.py)" />
        </Card>

        <Card className="border-ink">
          <Eyebrow>What a program lead does with it</Eyebrow>
          {sel ? <Decision d={sel} places={places} campus={campus} /> : <p className="text-sm text-soft">Pick a dip.</p>}
        </Card>
      </div>
    </section>
  );
}

function DimRow({ d, weeks, grid, onHover, sel, onPick }: { d: Dimension; weeks: number[]; grid: Record<string, AggregateCell>; onHover: (c: AggregateCell | null) => void; sel: Dip | null; onPick: (c: AggregateCell) => void }) {
  return (
    <>
      <div className="truncate pr-2 text-sm capitalize">{d}</div>
      {weeks.map((w) => {
        const c = grid[`${d}:${w}`];
        if (!c) return <div key={w} className="h-8 rounded-sm bg-rule" title="suppressed" />;
        const isSel = sel?.dimension === d && sel?.week === w;
        return (
          <button key={w} onMouseEnter={() => onHover(c)} onMouseLeave={() => onHover(null)} onClick={() => onPick(c)}
            className={`h-8 rounded-sm text-[10px] font-mono ${isSel ? "ring-2 ring-ink ring-offset-1" : ""}`}
            style={{ background: shade(c.mean), color: inkOn(c.mean) }} aria-label={`${d} week ${w} mean ${c.mean}`}>
            {c.mean < 3 ? c.mean.toFixed(1) : ""}
          </button>);
      })}
    </>
  );
}

function StressorKey({ stressors }: { stressors: Stressor[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-soft">
      {stressors.filter((s) => s.kind !== "break").map((s) => <li key={s.id}>{s.label} ({s.start.slice(5)} to {s.end.slice(5)}{s.approximate && !("verified" in s) ? "" : ""})</li>)}
    </ul>
  );
}

const ACTION: Record<Dimension, string> = {
  financial: "move the next Scarlet$ense or Basic Needs pop-up into this week and put the pantry hours on the widget",
  emotional: "add a Let's Talk drop-in slot this week and push the CAPS group offerings",
  physical: "schedule an extra free group fitness block and a walk-with-a-trainer hour",
  social: "fund a Wellness Connection Grant event for this week next term",
  intellectual: "extend learning center hours and run a study-skills workshop before the deadline",
  occupational: "bring a careers drop-in to the campus center this week",
  spiritual: "open the reflection room hours and list the interfaith events",
  environmental: "promote the green spaces and the clean-up events on the calendar",
};

function Decision({ d, places, campus }: { d: Dip; places: Resource[]; campus: Campus }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="display text-xl leading-tight">{d.dimension[0].toUpperCase() + d.dimension.slice(1)} dipped at {CAMPUS[campus]} in week {d.week}</p>
      <p>Mean fell from {d.previous_mean.toFixed(2)} to {d.mean.toFixed(2)} on a 1 to 5 scale across {d.n} check-ins{d.lowest_week ? ", the lowest week of the term" : ""}.
        {d.stressor ? ` It lines up with ${d.stressor.label.toLowerCase()} (${d.stressor.start} to ${d.stressor.end}).` : " No calendar stressor overlaps it."}</p>
      <div>
        <Eyebrow>Resources that match, ranked by fit</Eyebrow>
        {places.length ? <ul className="mt-1 list-disc pl-5">{places.map((p) => <li key={p.id}>{p.name}{p.online ? " (online)" : ` (${p.distance_km} km from campus centre)`}</li>)}</ul>
          : <p className="text-soft">none listed for this dimension on this campus yet</p>}
      </div>
      <div>
        <Eyebrow>Decision</Eyebrow>
        <p>{places.length < 2 ? "Resource gap: fewer than two matching resources on this campus. " : ""}Plan: {ACTION[d.dimension]}. Re-check this cell next week.</p>
      </div>
      <Source text="plan text is a template per dimension; stressor from data/academic_calendar_fall2026.json" />
    </div>
  );
}
