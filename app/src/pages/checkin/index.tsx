// Surface: checkin — owner: azra. Edit ONLY inside src/pages/checkin/. Spec: docs/SOURCE_OF_TRUTH.md §2.3 Check-in
// Items come from Swarbrick's public Wellness Inventory (app/src/data/inventory.ts). The 18-item short form that
// ScarletWell uses is a subset; until it is confirmed the UI says so.
import { useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PageRoute } from "@/App";
import { Card, Eyebrow, Title } from "@/components/ui";
import { SCALE, SHORT_FORM_CONFIRMED, TIMEFRAME, itemsFor, toFive, type Dimension } from "@/data/inventory";

export const route: PageRoute = { path: "/checkin", label: "Check-in", order: 3, owner: "azra", student: true };

export const DIMENSIONS = ["Physical", "Emotional", "Intellectual", "Financial", "Social", "Spiritual", "Occupational", "Environmental"] as const;
type Dim = (typeof DIMENSIONS)[number];
const ITEMS: Record<Dim, string[]> = Object.fromEntries(DIMENSIONS.map((d) => [d,
  itemsFor(d.toLowerCase() as Dimension).map((i) => i.text)])) as Record<Dim, string[]>;
const NEXT: Record<Dim, string> = {
  Physical: "A 10-minute walk after your next meal.", Emotional: "Five slow breaths before your next class.",
  Intellectual: "One 25-minute focus block, then a break.", Financial: "Look up what Student Basic Needs offers.",
  Social: "Message one person you'd like to see this week.", Spiritual: "Take ten quiet minutes outside.",
  Occupational: "Write down one thing you liked about this week's work.", Environmental: "Spend a few minutes at a campus green space.",
};

type Entry = { date: string; scores: Partial<Record<Dim, number>> };
const seed: Entry[] = [
  { date: "2026-09-08", scores: { Physical: 3.1, Emotional: 3.4, Social: 3.0, Intellectual: 3.6 } },
  { date: "2026-09-22", scores: { Physical: 2.9, Emotional: 3.0, Social: 2.8, Intellectual: 3.4 } },
];
const useStore = create<{ history: Entry[]; save: (e: Entry) => void }>()(persist(
  (set) => ({ history: seed, save: (e) => set((s) => ({ history: [...s.history, e] })) }), { name: "checkin" }));

function Spark({ vals }: { vals: number[] }) {
  if (vals.length < 2) return null;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * 60},${20 - ((v - 1) / 4) * 18}`).join(" ");
  return <svg width="60" height="22" aria-hidden><polyline points={pts} fill="none" stroke="var(--color-line)" strokeWidth="2" /></svg>;
}

export default function Checkin() {
  const { history, save } = useStore();
  const [dim, setDim] = useState<Dim | "all" | null>(null);
  const [ans, setAns] = useState<Record<string, number>>({});
  const dims = dim === "all" ? [...DIMENSIONS] : dim ? [dim] : [];
  const latest = history[history.length - 1];
  const low = DIMENSIONS.filter((d) => latest?.scores[d] != null).sort((a, b) => latest.scores[a]! - latest.scores[b]!)[0];

  function finish() {
    const scores: Entry["scores"] = {};
    dims.forEach((d) => { const v = toFive(ITEMS[d].map((_, i) => ans[`${d}${i}`]).filter(Boolean)); if (v != null) scores[d] = v; });
    save({ date: new Date().toISOString().slice(0, 10), scores });
    setDim(null); setAns({});
  }

  if (dim) return (
    <section className="space-y-4">
      <Title>{dim === "all" ? "Full check-in" : dim}</Title>
      <p className="text-xs opacity-60">{TIMEFRAME} Answer any you like; skip the rest.{SHORT_FORM_CONFIRMED ? "" : " Short form pending confirmation with ScarletWell."}</p>
      {dims.map((d) => ITEMS[d].map((q, i) => (
        <Card key={d + i}>
          <p>{q}</p>
          <div className="mt-3 grid grid-cols-4 gap-2" role="radiogroup">
            {SCALE.map((o) => (
              <button key={o.value} role="radio" aria-checked={ans[`${d}${i}`] === o.value} onClick={() => setAns({ ...ans, [`${d}${i}`]: o.value })}
                className={`min-h-11 rounded border px-1 py-2 text-xs leading-tight ${ans[`${d}${i}`] === o.value ? "border-ink bg-acid text-ink" : "border-mist"}`}>{o.label.replace(" true for me", "")}</button>))}
          </div>
        </Card>)))}
      <button onClick={finish} className="btn btn-primary">Save check-in</button>
    </section>
  );

  return (
    <section className="space-y-4">
      <Title>Check-in</Title>
      {low && <Card className="border-ink"><Eyebrow>One small next step · {low}</Eyebrow><p className="mt-1 display text-lg">{NEXT[low]}</p></Card>}
      <ul className="grid grid-cols-2 gap-3">
        {DIMENSIONS.map((d) => {
          const vals = history.map((h) => h.scores[d]).filter((v): v is number => v != null);
          return (
            <li key={d}><Card>
              <p className="display">{d}</p>
              <div className="mt-1 flex items-end justify-between"><span className="font-mono text-2xl">{vals.length ? vals[vals.length - 1].toFixed(1) : "–"}</span><Spark vals={vals} /></div>
              <button onClick={() => setDim(d)} className="mt-2 text-sm text-ink underline">Retake just this one</button>
            </Card></li>);
        })}
      </ul>
      <button onClick={() => setDim("all")} className="btn btn-primary">Take all eight</button>
    </section>
  );
}
