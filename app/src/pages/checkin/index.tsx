// Surface: checkin. The Wellness Inventory in the layout ScarletWell students already know: dimension tabs on top,
// Always / Sometimes / Rarely / Never columns, Previous / Next / Submit. Two things differ from the MyRutgers form:
// every section is optional (submit whenever you like), and the quick set is on by default (2 or 3 items per
// dimension); "Show all items" expands to the full validated 54. Items: Swarbrick et al., Psychiatric Services 2025.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PageRoute } from "@/App";
import { Source } from "@/components/ui";
import { CITATION, DIMENSION_BLURB, ITEMS, SCALE, toFive, type Dimension } from "@/data/inventory";

export const route: PageRoute = { path: "/checkin", label: "Check-in", order: 3, owner: "azra", student: true, wide: true };

// ScarletWell's tab order
const TABS: Dimension[] = ["physical", "intellectual", "environmental", "spiritual", "emotional", "financial", "social", "occupational"];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const COLS = [...SCALE].reverse();   // Always, Sometimes, Rarely, Never, as on the MyRutgers form

export type Entry = { date: string; scores: Partial<Record<string, number>>; answered?: number; mood?: Mood };
export type Mood = "great" | "okay" | "low" | "stressed" | "tired";
// One tap before any item. A feeling, not a score: it colours the reply and the counselor's tone, and it never enters the aggregate.
export const MOODS: [Mood, string, string][] = [["great", "😄", "Great"], ["okay", "🙂", "Okay"], ["low", "😔", "Low"], ["stressed", "😤", "Stressed"], ["tired", "🥱", "Tired"]];
// What checking in can earn. General on purpose: partners are in outreach; nothing here is a promise yet.
export const PERKS: [string, string][] = [
  ["🥗", "Discounts at nearby places with healthy options"], ["🏋️", "Rutgers Recreation class passes"], ["🎟️", "Entries into tuition and fee challenges"],
  ["☕", "Campus cafe credit"], ["🎧", "Early access to wellness events"],
];
const seed: Entry[] = [
  { date: "2026-09-08", scores: { Physical: 3.1, Emotional: 3.4, Social: 3.0, Intellectual: 3.6 } },
  { date: "2026-09-22", scores: { Physical: 2.9, Emotional: 3.0, Social: 2.8, Intellectual: 3.4 } },
];
const useStore = create<{ history: Entry[]; save: (e: Entry) => void }>()(persist(
  (set) => ({ history: seed, save: (e) => set((s) => ({ history: [...s.history, e] })) }), { name: "checkin" }));

export default function Checkin() {
  const { history, save } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Dimension>("physical");
  const [full, setFull] = useState(false);
  const [ans, setAns] = useState<Record<number, number>>({});
  const [mood, setMood] = useState<Mood>();
  const streak = history.length;
  const items = useMemo(() => ITEMS.filter((i) => i.dimension === tab && (full || i.quick)), [tab, full]);
  const answeredIn = (d: Dimension) => ITEMS.filter((i) => i.dimension === d && ans[i.n] != null).length;
  const totalAnswered = Object.keys(ans).length;
  const latest = history[history.length - 1];
  const idx = TABS.indexOf(tab);

  function submit() {
    const scores: Entry["scores"] = {};
    for (const d of TABS) {
      const v = toFive(ITEMS.filter((i) => i.dimension === d).map((i) => ans[i.n]).filter((x): x is number => x != null));
      if (v != null) scores[cap(d)] = v;
    }
    if (!Object.keys(scores).length && !mood) return;
    save({ date: new Date().toISOString().slice(0, 10), scores, answered: totalAnswered, mood });
    setAns({});
    navigate("/feedback");
  }

  return (
    <section className="-mx-5 md:mx-0 md:overflow-hidden md:rounded-2xl md:border-[1.5px] md:border-rule">
      <div className="bg-scarlet px-5 py-4 text-white">
        <h1 className="display text-center text-[26px]">Wellness Inventory</h1>
      </div>
      <div className="border-b-[1.5px] border-rule bg-white px-5 py-4">
        <p className="text-[15px] font-bold">First, how are you right now?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {MOODS.map(([k, e, l]) => (
            <button key={k} aria-pressed={mood === k} onClick={() => setMood(mood === k ? undefined : k)} className={`flex items-center gap-2 rounded-full border-[1.5px] px-3 py-1.5 text-[15px] ${mood === k ? "border-scarlet bg-acid" : "border-rule bg-white"}`}>
              <span aria-hidden className="text-[20px]">{e}</span>{l}</button>))}
        </div>
        <p className="mt-1.5 text-[13px] text-soft">One tap counts as a check-in on its own. The items below are there when you want them.</p>
      </div>
      <div className="bg-white px-5 py-4 md:flex md:items-baseline md:justify-between md:gap-8">
        <p className="text-[15px] md:max-w-2xl">Think about the past 30 days and mark how often each statement is true for you. Every section is optional; submit whenever you like.</p>
        <p className="mt-2 text-[13px] text-soft md:mt-0 md:shrink-0">{latest ? `Last time: ${Object.keys(latest.scores).length} of 8 on ${latest.date}` : "First time here"}</p>
      </div>

      <div className="grid grid-cols-4 gap-2 bg-scarlet-deep p-3">
        {TABS.map((d) => {
          const n = answeredIn(d), on = d === tab;
          return (
            <button key={d} onClick={() => setTab(d)}
              className={`rounded-[10px] border-2 px-1 py-2.5 text-[13px] font-bold leading-tight transition ${on ? "border-white bg-white text-scarlet" : n ? "border-white/60 bg-white/25 text-white" : "border-transparent bg-white/15 text-white"}`}>
              {cap(d)}{n ? <span className="block text-[11px] font-normal">{n} answered</span> : null}
            </button>);
        })}
      </div>

      <div className="bg-white">
        <div className="flex items-baseline justify-between px-5 pt-4">
          <h2 className="display text-[21px]">Questions</h2>
          <button onClick={() => setFull((f) => !f)} className="text-[13px] text-scarlet underline underline-offset-2">{full ? "Show the quick set" : `Show all ${ITEMS.filter((i) => i.dimension === tab).length} items`}</button>
        </div>
        <p className="px-5 pb-2 text-[13px] text-soft">{DIMENSION_BLURB[tab]}</p>
        <div className="grid grid-cols-[1fr_repeat(4,44px)] items-center gap-x-1 bg-[#8d8d94] px-3 py-2 text-[12px] font-bold text-white md:grid-cols-[1fr_repeat(4,88px)]">
          <span />{COLS.map((c) => <span key={c.value} className="text-center">{c.label.replace(" true", "")}</span>)}
        </div>
        <ol>
          {items.map((it, i) => (
            <li key={it.n} className={`grid grid-cols-[1fr_repeat(4,44px)] items-center gap-x-1 px-3 py-4 md:grid-cols-[1fr_repeat(4,88px)] ${i % 2 ? "bg-[#d9d9de]" : "bg-[#f2f2f4]"}`}>
              <span className="pr-2 text-[14px] font-bold leading-snug">{it.text}</span>
              {COLS.map((c) => (
                <label key={c.value} className="flex cursor-pointer justify-center">
                  <input type="radio" name={`q${it.n}`} value={c.value} checked={ans[it.n] === c.value}
                    onChange={() => setAns({ ...ans, [it.n]: c.value })} className="h-5 w-5 accent-[#cc0033]" aria-label={`${it.text}: ${c.label}`} />
                </label>))}
            </li>))}
        </ol>
        <div className="flex items-center justify-between gap-2 border-t-[1.5px] border-rule px-3 py-3">
          <button onClick={() => setTab(TABS[Math.max(0, idx - 1)])} disabled={idx === 0} className="btn btn-ghost disabled:opacity-40">Previous</button>
          <div className="flex gap-2">
            <button onClick={() => setTab(TABS[Math.min(TABS.length - 1, idx + 1)])} disabled={idx === TABS.length - 1} className="btn btn-ghost disabled:opacity-40">Next</button>
            <button onClick={submit} disabled={!totalAnswered && !mood} className="btn btn-primary disabled:opacity-40">Submit{totalAnswered ? ` (${totalAnswered})` : mood ? " mood" : ""}</button>
          </div>
        </div>
        <div className="border-t-[1.5px] border-rule bg-canvas px-5 py-4">
          <p className="text-[15px] font-bold">What checking in can earn</p>
          <p className="text-[13px] text-soft">{streak} check-in{streak === 1 ? "" : "s"} so far. Partners are being lined up; these are the kinds of things, not promises.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PERKS.map(([e, l]) => <span key={l} className="flex items-center gap-2 rounded-full border-[1.5px] border-rule bg-white px-3 py-1.5 text-[14px]"><span aria-hidden>{e}</span>{l}</span>)}
          </div>
        </div>
        <div className="px-5 pb-5">
          <Source text={`Wellness Inventory items: ${CITATION}; quick set chosen by the team, all items available; nothing leaves this phone until you submit, and then only the dimension scores`} />
        </div>
      </div>
    </section>
  );
}
