// Surface: staff (Challenge 2). First pass by the team; Nitu owns the natural-language box and polish.
// Aggregate only. Never an individual. Cells under k = 5 never reach this page (the engine drops them).
import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/client";
import type { AggregateCell, AggregateWeekly, Areas, Dimension, Dip, Insight, RegistryStatus, Resource, StaffAnswer, Stressor } from "@/api/types";
import type { PageRoute } from "@/App";
import { Card, Eyebrow, Source, Title } from "@/components/ui";
import { DIMENSION_BLURB } from "@/data/inventory";
import { DINING_FACTS, PELL, PELL_SOURCE, WEEK_PATTERN } from "@/data/dining_context";
import { FOOD, PANTRY_TIMING_NOTE, pantryGapDays } from "@/data/food_faith";
import type { ArcEvent, CountyContext } from "@/api/types";
import { AZURE_MAPS, AzureHeatmap, areaNeed, campusNeed, type Pin } from "@/components/AzureHeatmap";

export const route: PageRoute = { path: "/staff", label: "ScarletWell view", order: 6.5, owner: "team", staff: true };

const CAMPUS = { nb: "New Brunswick", nwk: "Newark", cam: "Camden" } as const;
const LEVEL = { undergrad: "Undergraduates", grad: "Graduate students", faculty_staff: "Faculty and staff" } as const;
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
  const [insights, setInsights] = useState<Insight[]>([]);
  const [freeFood, setFreeFood] = useState<{ via: string; events: ArcEvent[] }>();
  const [county, setCounty] = useState<CountyContext>();
  useEffect(() => { api.aggregateContext(campus).then(setCounty).catch(() => setCounty(undefined)); }, [campus]);
  useEffect(() => { api.arcEvents({ campus, days: 14, free_food: true }).then((r) => setFreeFood({ via: r.via, events: r.events.filter((e) => e.free_food) })).catch(() => setFreeFood(undefined)); }, [campus]);
  const [table, setTable] = useState(false);
  const [areas, setAreas] = useState<Areas>();
  const [mapView, setMapView] = useState<"campuses" | "nb">("campuses");
  useEffect(() => { api.aggregateAreas().then(setAreas).catch(() => setAreas(undefined)); }, []);
  const [hover, setHover] = useState<AggregateCell | null>(null);
  const [registry, setRegistry] = useState<RegistryStatus>();
  const [q, setQ] = useState("");
  const [ans, setAns] = useState<StaffAnswer>();
  const [asking, setAsking] = useState(false);

  useEffect(() => { api.aggregateWeekly().then(setAgg); api.aggregateDips().then((d) => setDips(d.dips)); api.registryStatus().then(setRegistry).catch(() => {}); }, []);
  useEffect(() => { if (sel) api.resources({ dimension: sel.dimension, campus: sel.campus }).then((r) => setPlaces(r.items.slice(0, 3))); }, [sel]);
  useEffect(() => { api.resources({ dimension: "physical", campus }).then((r) => setDining(r.items.filter((i) => i.kind === "dining" || /pantry|basic needs|raptor's nest/i.test(i.name)))); }, [campus]);
  useEffect(() => { api.aggregateInsights({ campus, level }).then((r) => setInsights(r.insights)).catch(() => setInsights([])); }, [campus, level]);

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
          <p className="text-sm text-soft">What moved, for whom, when, and what to put in place by which date. {agg.term}. At least {agg.k_min} people behind every cell; smaller cells never reach this page.</p>
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

      <Card className="border-scarlet">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Eyebrow>What to do this month · {CAMPUS[campus]} {LEVEL[level].toLowerCase()}</Eyebrow>
          <span className="text-[12px] text-soft">rules over k-anonymous cells, the registrar calendar and the resource registry; the model polishes words, never facts</span>
        </div>
        {insights.length ? (
          <ol className="mt-3 grid gap-4 md:grid-cols-2">
            {insights.map((x, i) => (
              <li key={x.dimension + x.week_start} className="rounded-[12px] border-[1.5px] border-rule bg-white p-4">
                <p className="display text-[19px] leading-tight">{i + 1}. {x.headline}</p>
                {x.upcoming === false && <p className="mt-1 text-[12px] uppercase tracking-wider text-soft">already passed this term; plan it for next term</p>}
                <p className="mt-1 text-[13px] text-soft">Lowest mean {x.low_mean.toFixed(2)} on 1 to 5 · drop {x.drop.toFixed(2)} · {x.n} check-ins across {x.weeks.length} week{x.weeks.length === 1 ? "" : "s"}{x.lowest_of_term ? " · lowest of the term" : ""}</p>
                {x.context && <p className="mt-2 text-[14px]">{x.context}</p>}
                <p className="mt-2 text-[14px]"><span className="font-bold">The lever:</span> {x.lever}.</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[14px]">{x.actions.map((a) => <li key={a}>{a}</li>)}</ul>
                {x.act_by && <p className="mt-2 text-[14px]"><span className="font-bold">In place by:</span> <span className="num">{x.act_by}</span>{x.stressor ? ` (a week before ${x.stressor.label.toLowerCase()})` : ""}</p>}
                {!!x.places.length && <p className="mt-1 text-[13px] text-soft">Matching resources: {x.places.map((p) => p.name).join(" · ")}</p>}
              </li>))}
          </ol>
        ) : <p className="mt-2 text-[14px] text-soft">No episode flagged for this group this term.</p>}
        <Source text="dip rule: drop over 0.3 on 1 to 5 or the lowest week of the term, consecutive weeks folded into one episode; stressor from data/academic_calendar_fall2026.json; actions from the playbook in engine/aggregate/insights.py; Pell shares NJ FY27 Hunger-Free Campus NGO" />
      </Card>

      {county && (
        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Eyebrow>The county around {CAMPUS[campus]} · {county.county} County</Eyebrow>
            <span className="text-[12px] text-soft">{county.enrollment ? `Rutgers ${CAMPUS[campus]}: ${Number(county.enrollment.student_population ?? 0).toLocaleString()} students (IPEDS)` : ""}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
            {county.places.slice(0, 5).map((r) => (
              <div key={r.measure} title={`${r.low} to ${r.high}, 95% interval; ${r.source}`}>
                <p className="num text-[22px] font-bold">{r.value.toFixed(1)}%</p>
                <p className="text-[12px] leading-snug text-soft">{r.label}</p>
                <p className="num text-[11px] text-soft">{r.low.toFixed(1)} to {r.high.toFixed(1)}</p>
              </div>))}
          </div>
          <Source text={`CDC PLACES 2025 release (BRFSS 2023; sleep 2022), county, age-adjusted, adults, model-based; ${county.caution}`} />
          {county.sdoh && county.sdoh.rows.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-[12px] text-soft">Second opinion from AHRQ, {county.sdoh.year ?? "county file"}</p>
              <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-5">
                {county.sdoh.rows.slice(0, 5).map((r) => (
                  <div key={r.measure} title={r.source}>
                    <p className="num text-[22px] font-bold">{r.unit === "USD" ? `$${Math.round(r.value).toLocaleString()}` : `${r.value.toFixed(1)}%`}</p>
                    <p className="text-[12px] leading-snug text-soft">{r.label}</p>
                    <p className="num text-[11px] text-soft">{r.variable}</p>
                  </div>))}
              </div>
              <Source text={`AHRQ Social Determinants of Health Database, county file; each number carries AHRQ's own variable name${county.sdoh.url ? `; ${county.sdoh.url}` : ""}`} />
            </div>)}
        </Card>)}

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
          <Eyebrow>Food · {CAMPUS[campus]}</Eyebrow>
          <span className="font-mono text-[10px] text-soft">Pell share {PELL[campus]} ({PELL_SOURCE})</span>
        </div>
        <div className="mt-3 grid gap-5 md:grid-cols-3">
          <div>
            <p className="text-sm font-bold">Pantry access by day, from published hours</p>
            <p className="text-[12px] text-soft">{FOOD[campus].pantry.name}, {FOOD[campus].pantry.where}</p>
            <table className="mt-2 w-full text-[13px]">
              <tbody>{FOOD[campus].pantry.hours.map((h) => (
                <tr key={h.day} className={`border-t border-rule ${!h.appt && !h.walkin ? "bg-acid/40" : ""}`}>
                  <td className="py-1 pr-2 font-bold">{h.day}</td><td className="py-1 pr-2">{h.appt ?? ""}</td><td className="py-1 text-soft">{h.walkin ? `walk-in ${h.walkin}` : !h.appt ? "no way in" : "appointment only"}</td>
                </tr>))}</tbody>
            </table>
            <p className="mt-2 text-[13px]"><span className="font-bold">The gap:</span> no access on {pantryGapDays(campus).join(", ")}{campus === "nb" ? "; appointments for the week open Sunday at noon and the first walk-in window is Tuesday 4 pm" : ""}. A Sunday pickup window or a Monday walk-in hour before the week starts is the cheapest change on this page.</p>
            <p className="mt-1 text-[11px] text-soft">Inferred from hours, not a count. {PANTRY_TIMING_NOTE}{FOOD[campus].pantry.stale_note ? ` Note: ${FOOD[campus].pantry.stale_note}.` : ""}</p>
          </div>
          <div>
            <p className="text-sm font-bold">Free food this week</p>
            <p className="text-[12px] text-soft">{freeFood?.via === "arc" ? "The Arc (CampusLabs Engage), Free Food benefit, live" : "Wellness Calendar free events; The Arc is read live where the engine can reach it"}</p>
            <ul className="mt-2 space-y-1.5 text-[13px]">
              {(freeFood?.events ?? []).slice(0, 6).map((e) => <li key={e.id}><span className="font-bold">{e.title.split(" (")[0]}</span><span className="text-soft"> · {new Date(e.start).toLocaleString([], { weekday: "short", hour: "numeric" })}{e.location ? ` · ${e.location}` : ""}</span></li>)}
              {!freeFood?.events.length && <li className="text-soft">none tagged in the next two weeks</li>}
            </ul>
            <p className="mt-3 text-sm font-bold">Quick-service share by day</p>
            <p className="text-[11px] text-soft">synthetic shape until Dining shares logs; the weekend gap is documented (Daily Targum 2022)</p>
            <div className="mt-2 flex h-20 items-end gap-1.5">
              {WEEK_PATTERN.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-0.5">
                  <div className="w-full rounded-t-sm" style={{ height: `${d.quick * 110}px`, background: d.quick >= 0.45 ? "hsl(345 70% 46%)" : "hsl(192 22% 70%)" }} aria-label={`${d.day} ${Math.round(d.quick * 100)}%`} />
                  <span className="font-mono text-[10px]">{d.day}</span>
                </div>))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold">Who this lands on</p>
            <ul className="mt-2 space-y-2">
              {DINING_FACTS.slice(0, 3).map((f) => (
                <li key={f.label} className="text-[13px]" title={f.source}><span className="font-mono font-bold">{f.value}</span> {f.label}<span className="block text-[11px] text-soft">{f.source}</span></li>))}
            </ul>
            <p className="mt-3 text-sm font-bold">Dining options students can be pointed to</p>
            <ul className="mt-1 space-y-1 text-[13px]">
              {FOOD[campus].dining.map((d) => <li key={d.label}><span className="font-bold">{d.label}.</span> {d.detail}</li>)}
              {dining.slice(0, 4).map((d) => <li key={d.id} className="text-soft">{d.name}{d.open_now === true ? " · open now" : d.open_now === false ? " · closed now" : ""}</li>)}
            </ul>
          </div>
        </div>
        <Source text="pantry hours and dining facts: docs/RESEARCH_FOOD_FAITH_APPS.md, each with its Rutgers page URL; national and Rutgers numbers: docs/EVIDENCE.md section 6; free food: The Arc discovery API or data/wellness_events.json; weekday bars synthetic" />
      </Card>
      {sel && (
        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Eyebrow>{sel.dimension[0].toUpperCase() + sel.dimension.slice(1)} need {mapView === "nb" ? "across New Brunswick" : "across campuses"} · week {sel.week}</Eyebrow>
            <div className="flex gap-1">
              {(["campuses", "nb"] as const).map((k) => (
                <button key={k} onClick={() => setMapView(k)} disabled={k === "nb" && !areas}
                  className={`rounded border px-2 py-1 text-xs ${mapView === k ? "border-ink bg-ink text-canvas" : "border-rule"}`}>{k === "nb" ? "New Brunswick areas" : "All campuses"}</button>))}
            </div>
          </div>
          <div className="mt-3"><MapCard view={mapView === "nb" && areas ? "nb" : "campuses"} areas={areas} cells={agg.cells} sel={sel} /></div>
          <Source text={`need = 5 minus the weekly mean; ${mapView === "nb" ? "New Brunswick by the home area a student picks on the check-in (never GPS), all levels; synthetic areas are assigned evenly, so differences here are noise; centers approximate" : "n-weighted across levels, at campus centroids"}; k = 5 per circle${AZURE_MAPS ? "" : "; dots are the places that match this dimension (data/rutgers_resources.json, coordinates approximate)"}; map by ${AZURE_MAPS ? "Azure Maps" : "OpenStreetMap"}`} />
        </Card>
      )}

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

        <Card>
          <Eyebrow>Ask the aggregate</Eyebrow>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!q.trim()) return; setAsking(true);
            api.askStaff({ question: q, campus }).then(setAns).finally(() => setAsking(false)); }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Which campus had the biggest social dip?"
              className="min-w-0 flex-1 border-[1.5px] border-rule px-3 py-2 text-sm" />
            <button className="border-[1.5px] border-ink px-3 py-2 text-sm font-bold" disabled={asking}>{asking ? "Asking" : "Ask"}</button>
          </form>
          {ans && <p className="pt-3 text-sm">{ans.answer}</p>}
          {ans && <Source text={`synthetic dips from engine/aggregate/dips.py, k = 5; answered by ${ans.method}`} />}
        </Card>

        <Card className="border-ink">
          <Eyebrow>What a program lead does with it</Eyebrow>
          {sel ? <Decision d={sel} places={places} campus={campus} /> : <p className="text-sm text-soft">Pick a dip.</p>}
        </Card>
      </div>

      {registry && <RegistryCard r={registry} />}
    </section>
  );
}

// The registry replaces hand copying: public Rutgers pages are read with Anakin.io, changes wait for a person to approve.
function RegistryCard({ r }: { r: RegistryStatus }) {
  const when = r.last_checked ? new Date(r.last_checked).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null;
  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Eyebrow>Resource registry</Eyebrow>
        <span className="font-mono text-xs text-soft">{when ? `pages last read ${when}` : "pages not read yet"}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div><dt className="text-sm text-soft">Places with opening hours</dt><dd className="display text-2xl">{r.with_hours} <span className="text-base text-soft">of {r.places}</span></dd></div>
        <div><dt className="text-sm text-soft">Hours read from their pages</dt><dd className="display text-2xl">{r.hours_via_anakin}</dd></div>
        <div><dt className="text-sm text-soft">Source pages changed</dt><dd className="display text-2xl">{r.source_pages ? <>{r.changed} <span className="text-base text-soft">of {r.source_pages}</span></> : "–"}</dd></div>
        <div><dt className="text-sm text-soft">Waiting for review</dt><dd className="display text-2xl">{r.pending_review}</dd></div>
      </dl>
      <p className="mt-3 text-sm text-soft">Hours drive the open-now part of the ranking, so a place without them is never marked open or closed. Changes found on a page wait here until someone approves them.</p>
      <Source text={`pages read with ${r.via} (engine/registry/refresh.py); hours shape from engine/recommend/hours.py`} />
    </Card>
  );
}

function MapCard({ view, areas, cells, sel }: { view: "campuses" | "nb"; areas?: Areas; cells: AggregateCell[]; sel: Dip }) {
  const points = useMemo(() => view === "nb" && areas ? areaNeed(areas, sel.dimension, sel.week) : campusNeed(cells, sel.dimension, sel.week), [view, areas, cells, sel]);
  const [pins, setPins] = useState<Pin[]>([]);
  useEffect(() => {
    const campuses = view === "nb" ? ["nb"] : ["nb", "nwk", "cam"];
    Promise.all(campuses.map((c) => api.resources({ dimension: sel.dimension, campus: c }).then((r) => r.items).catch(() => [])))
      .then((all) => setPins(all.flat().filter((r) => !r.online && r.lat != null && r.lng != null)
        .map((r) => ({ id: r.id, name: r.name, lat: r.lat!, lng: r.lng!, sub: r.open_now ? "open now" : undefined }))));
  }, [view, sel.dimension]);
  const label = `Map of ${sel.dimension} need in week ${sel.week}: ${points.map((p) => `${p.name} mean ${p.mean.toFixed(2)}`).join(", ")}; ${pins.length} matching places`;
  return <AzureHeatmap points={points} view={view} label={label} pins={pins} />;
}

function DimRow({ d, weeks, grid, onHover, sel, onPick }: { d: Dimension; weeks: number[]; grid: Record<string, AggregateCell>; onHover: (c: AggregateCell | null) => void; sel: Dip | null; onPick: (c: AggregateCell) => void }) {
  return (
    <>
      <div className="truncate pr-2 text-sm capitalize underline decoration-dotted underline-offset-4" title={`${DIMENSION_BLURB[d]} Weekly mean of this dimension's inventory items; cells with fewer than five students are suppressed in the engine.`}>{d}</div>
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
