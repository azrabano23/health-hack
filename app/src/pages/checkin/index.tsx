// Surface: checkin — owner: azra. Edit ONLY inside src/pages/checkin/. Spec: docs/SOURCE_OF_TRUTH.md §2.3 Check-in
// PLACEHOLDER ITEMS: the real 18-item short form is not public yet (ScarletWell to share). Labelled as such in the UI.
import { useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PageRoute } from "@/App";
import { PageHead, Title } from "@/components/ui";

export const route: PageRoute = { path: "/checkin", label: "Check-in", order: 3, owner: "azra", student: true };

export const DIMENSIONS = ["Physical", "Emotional", "Intellectual", "Financial", "Social", "Spiritual", "Occupational", "Environmental"] as const;
type Dim = (typeof DIMENSIONS)[number];
const ITEMS: Record<Dim, string[]> = Object.fromEntries(DIMENSIONS.map((d) => [d, [
  `In the last 30 days, how steady has your ${d.toLowerCase()} wellbeing felt?`,
  `How supported do you feel in your ${d.toLowerCase()} wellbeing?`]])) as Record<Dim, string[]>;
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
  return <svg width="60" height="22" aria-hidden><polyline points={pts} fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
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
    dims.forEach((d) => { const v = ITEMS[d].map((_, i) => ans[`${d}${i}`]).filter(Boolean); if (v.length) scores[d] = v.reduce((a, b) => a + b, 0) / v.length; });
    save({ date: new Date().toISOString().slice(0, 10), scores });
    setDim(null); setAns({});
  }

  if (dim) return (
    <section>
      <button onClick={() => { setDim(null); setAns({}); }} className="cursor-pointer text-[15px] text-soft underline-offset-4 hover:text-ink hover:underline">Back to check-in</button>
      <div className="mt-2"><Title>{dim === "all" ? "Full check-in" : dim}</Title></div>
      <p className="mt-2 text-[15px] text-soft">1 means not at all, 5 means very. There are no wrong answers. These are placeholder questions until ScarletWell shares the short form.</p>
      <ol className="mt-6 space-y-6">
        {dims.map((d) => ITEMS[d].map((q, i) => (
          <li key={d + i}>
            {dim === "all" && <p className="text-[14px] font-bold text-soft">{d}</p>}
            <p className="mt-1">{q}</p>
            <div className="mt-3 grid grid-cols-5 gap-2" role="radiogroup" aria-label={q}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} role="radio" aria-checked={ans[`${d}${i}`] === n} onClick={() => setAns({ ...ans, [`${d}${i}`]: n })}
                  className={`num h-12 cursor-pointer rounded-[10px] border-[1.5px] text-[17px] font-bold ${ans[`${d}${i}`] === n ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-soft"}`}>{n}</button>))}
            </div>
          </li>)))}
      </ol>
      <button onClick={finish} className="btn btn-primary mt-8 w-full">Save check-in</button>
    </section>
  );

  return (
    <section>
      <PageHead kicker="ScarletWell wellness inventory" title="Check-in" sub="Eight parts of wellbeing. Answer all of them, or only the one on your mind." />
      {low && (
        <div className="mt-6 rounded-[20px] bg-ink p-5 text-white">
          <p className="text-white/70">One small next step for {low.toLowerCase()} wellbeing</p>
          <p className="display mt-2 text-[22px]">{NEXT[low]}</p>
        </div>)}
      <ul className="mt-8 divide-y-[1.5px] divide-rule border-y-[1.5px] border-rule">
        {DIMENSIONS.map((d) => {
          const vals = history.map((h) => h.scores[d]).filter((v): v is number => v != null);
          return (
            <li key={d}>
              <button onClick={() => setDim(d)} className="flex w-full cursor-pointer items-center gap-4 py-3.5 text-left">
                <span className="flex-1"><span className="display block text-[19px]">{d}</span>
                  <span className="text-[14px] text-soft">{vals.length ? "Retake this one" : "Not taken yet"}</span></span>
                <Spark vals={vals} />
                <span className="num w-10 text-right text-[21px] font-bold">{vals.length ? vals[vals.length - 1].toFixed(1) : ""}</span>
              </button>
            </li>);
        })}
      </ul>
      <button onClick={() => setDim("all")} className="btn btn-primary mt-6 w-full">Take all eight (about 5 minutes)</button>
    </section>
  );
}
