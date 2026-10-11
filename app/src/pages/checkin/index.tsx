// Surface: checkin. The Wellness Inventory in the layout ScarletWell students already know: dimension tabs on top,
// Always / Sometimes / Rarely / Never columns, Previous / Next / Submit. Three things differ from the MyRutgers form:
// every section is optional (submit whenever you like); the mood tap reorders the tabs so the dimensions that feeling
// usually touches come first (the 54 items themselves never change); and a visible Quick / Full choice sits above the
// questions, Quick by default. A free-text note about today is read on the phone into removable chips and never enters
// any aggregate. Items: Swarbrick et al., Psychiatric Services 2025.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/api/client";
import type { PageRoute } from "@/App";
import { Source } from "@/components/ui";
import { guessDimension } from "@/data/dimension_guess";
import { CITATION, DIMENSION_BLURB, ITEMS, SCALE, toFive, type Dimension } from "@/data/inventory";
import { understandLocal } from "@/data/profile";

export const route: PageRoute = { path: "/checkin", label: "Check-in", order: 3, owner: "azra", student: true, wide: true };

// ScarletWell's tab order
const TABS: Dimension[] = ["physical", "intellectual", "environmental", "spiritual", "emotional", "financial", "social", "occupational"];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
// Soft hyphens so the three long names break cleanly ("Occu-pational") in a 360px four-column tab row, and nowhere else.
const TAB_LABEL: Partial<Record<Dimension, string>> = { occupational: "Occu­pational", intellectual: "Intel­lectual", environmental: "Environ­mental" };
const COLS = [...SCALE].reverse();   // Always, Sometimes, Rarely, Never, as on the MyRutgers form

export type Entry = { date: string; scores: Partial<Record<string, number>>; answered?: number; mood?: Mood; note?: string; chips?: string[] };
export type Mood = "great" | "okay" | "low" | "stressed" | "tired";
// One tap before any item. A feeling, not a score: it colours the reply and the counselor's tone, and it never enters the aggregate.
export const MOODS: [Mood, string, string][] = [["great", "😄", "Great"], ["okay", "🙂", "Okay"], ["low", "😔", "Low"], ["stressed", "😤", "Stressed"], ["tired", "🥱", "Tired"]];
// Mood-led order: the dimensions a feeling usually touches come first, the rest follow in the usual order. No item changes.
const LEAD: Record<Mood, Dimension[]> = {
  great: ["social", "intellectual", "physical"], okay: [], low: ["emotional", "social", "spiritual"],
  stressed: ["emotional", "occupational", "intellectual", "financial"], tired: ["physical", "emotional", "occupational"],
};
const orderFor = (m?: Mood): Dimension[] => (m ? [...LEAD[m], ...TABS.filter((d) => !LEAD[m].includes(d))] : TABS);
// [what changed, the reassurance]; the first part is bold so the reorder is obvious, the second keeps it gentle
const WHY: Record<Mood, [string, string]> = {
  great: ["Because you said Great, Social comes first and the quick set is plenty.", "Every section is still optional."],
  okay: ["Okay works. The usual order, Physical first.", "Every section is still optional."],
  low: ["Because you said Low, Emotional comes first.", "Every section is still optional."],
  stressed: ["Because you said Stressed, Emotional comes first.", "Every section is still optional."],
  tired: ["Because you said Tired, Physical comes first.", "Every section is still optional."],
};
const DEPTH = [
  [false, "Quick", "2 to 3 per section · about 2 minutes"],
  [true, "Full inventory", "54 items · about 10 minutes"],
] as const;
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
  const [note, setNote] = useState("");
  const [found, setFound] = useState<string[]>([]);       // chips read from the note, before the student removes any
  const [dropped, setDropped] = useState<string[]>([]);   // chips the student tapped away; they stay away if the note is re-read
  const [guess, setGuess] = useState<Dimension | null>(null);
  const [reading, setReading] = useState(false);
  const [readBy, setReadBy] = useState<string | null>(null);
  const [blurred, setBlurred] = useState(0);   // bumps on blur so the note is read straight away, not after the pause
  const immediate = useRef(false);
  const seq = useRef(0);
  const streak = history.length;
  const order = orderFor(mood);
  const idx = order.indexOf(tab);
  const items = useMemo(() => ITEMS.filter((i) => i.dimension === tab && (full || i.quick)), [tab, full]);
  const inTab = ITEMS.filter((i) => i.dimension === tab).length;
  const answeredIn = (d: Dimension) => ITEMS.filter((i) => i.dimension === d && ans[i.n] != null).length;
  const totalAnswered = Object.keys(ans).length;
  const latest = history[history.length - 1];
  const chips = found.filter((c) => !dropped.includes(c));
  const trimmed = note.trim();

  // Read the note after a pause, or straight away on blur: rules on the phone first, the engine's reading added when it runs.
  // POST /profile/understand is not an aggregate call and the engine stores nothing; in fixtures mode the fetch fails quietly.
  useEffect(() => {
    const t = note.trim();
    const ms = immediate.current ? 0 : 700;
    immediate.current = false;
    const mine = ++seq.current;
    const timer = window.setTimeout(async () => {
      if (!t) { setFound([]); setGuess(null); setReadBy(null); return; }
      const local = understandLocal(t);
      const base = [...local.notes, ...local.conditions];
      setFound(base);
      const g = guessDimension(t);
      setGuess(g.hits ? g.dimension : null);
      setReadBy(null);
      setReading(true);
      const r = await api.understand(t);
      if (mine !== seq.current) return;   // the student kept typing; a newer read is on its way
      setReading(false);
      if (r) { setFound([...new Set([...base, ...r.facts.notes, ...r.facts.conditions])]); setReadBy(r.method); }
    }, ms);
    return () => window.clearTimeout(timer);
  }, [note, blurred]);

  function pick(m: Mood) {
    const next = mood === m ? undefined : m;
    setMood(next);
    setTab(orderFor(next)[0]);
    if (next === "great") setFull(false);
  }
  function submit() {
    const scores: Entry["scores"] = {};
    for (const d of TABS) {
      const v = toFive(ITEMS.filter((i) => i.dimension === d).map((i) => ans[i.n]).filter((x): x is number => x != null));
      if (v != null) scores[cap(d)] = v;
    }
    if (!Object.keys(scores).length && !mood && !trimmed) return;
    save({ date: new Date().toISOString().slice(0, 10), scores, answered: totalAnswered, mood, ...(trimmed ? { note: trimmed, chips } : {}) });
    setAns({});
    setNote("");
    navigate("/feedback");
  }
  const canSubmit = totalAnswered > 0 || !!mood || !!trimmed;

  return (
    <section className="-mx-5 md:mx-0 md:overflow-hidden md:rounded-2xl md:border-[1.5px] md:border-rule">
      <div className="bg-scarlet px-5 py-4 text-white">
        <h1 className="display text-center text-[26px]">Wellness Inventory</h1>
      </div>
      <div className="border-b-[1.5px] border-rule bg-white px-5 py-4">
        <p className="text-[15px] font-bold">First, how are you right now?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {MOODS.map(([k, e, l]) => (
            <button key={k} aria-pressed={mood === k} onClick={() => pick(k)} className={`flex items-center gap-2 rounded-full border-[1.5px] px-3 py-1.5 text-[15px] ${mood === k ? "border-scarlet bg-acid" : "border-rule bg-white"}`}>
              <span aria-hidden className="text-[20px]">{e}</span>{l}</button>))}
        </div>
        {mood
          ? <p key={mood} className="settle mt-2 text-[14px]" aria-live="polite"><span className="font-bold text-scarlet">{WHY[mood][0]}</span> {WHY[mood][1]}</p>
          : <p className="mt-1.5 text-[13px] text-soft">One tap counts as a check-in on its own, and it puts the sections that feeling usually touches first.</p>}
      </div>
      <div className="bg-white px-5 py-4 md:flex md:items-baseline md:justify-between md:gap-8">
        <p className="text-[15px] md:max-w-2xl">Think about the past 30 days and mark how often each statement is true for you. Every section is optional; submit whenever you like.</p>
        <p className="mt-2 text-[13px] text-soft md:mt-0 md:shrink-0">{latest ? `Last time: ${Object.keys(latest.scores).length} of 8 on ${latest.date}` : "First time here"}</p>
      </div>

      <div key={order.join()} className="settle grid grid-cols-4 gap-2 bg-scarlet-deep p-3">
        {order.map((d, i) => {
          const n = answeredIn(d), on = d === tab, first = i === 0 && !!mood && !n;
          return (
            <button key={d} onClick={() => setTab(d)}
              className={`rounded-[10px] border-2 px-1 py-2.5 text-[12px] font-bold leading-tight transition sm:text-[13px] ${on ? "border-white bg-white text-scarlet" : n ? "border-white/60 bg-white/25 text-white" : "border-transparent bg-white/15 text-white"}`}>
              {TAB_LABEL[d] ?? cap(d)}{n ? <span className="block text-[11px] font-normal">{n} answered</span> : first ? <span className="block text-[11px] font-normal">start here</span> : null}
            </button>);
        })}
      </div>

      <div className="bg-white">
        <div role="radiogroup" aria-label="How much to answer" className="grid gap-2 px-5 pt-4 sm:grid-cols-2">
          {DEPTH.map(([v, label, detail]) => (
            <button key={label} role="radio" aria-checked={full === v} onClick={() => setFull(v)}
              className={`rounded-xl border-[1.5px] px-4 py-2.5 text-left transition ${full === v ? "border-scarlet bg-acid" : "border-rule bg-white"}`}>
              <span className="block text-[15px] font-bold">{label}</span>
              <span className="block text-[13px] text-soft">{detail}</span>
            </button>))}
        </div>
        <div className="flex items-baseline justify-between gap-3 px-5 pt-4">
          <h2 className="display text-[21px]">{cap(tab)}</h2>
          <span className="shrink-0 text-[13px] text-soft">{full ? `all ${inTab} items` : `${items.length} of ${inTab} items`}</span>
        </div>
        <p className="px-5 pb-2 text-[13px] text-soft">{DIMENSION_BLURB[tab]}</p>
        <div className="grid grid-cols-[1fr_repeat(4,52px)] items-center gap-x-1 bg-[#8d8d94] px-3 py-2 text-[10px] font-bold leading-tight text-white md:grid-cols-[1fr_repeat(4,88px)] md:text-[12px]">
          <span />{COLS.map((c) => <span key={c.value} className="text-center">{c.label.replace(" true", "")}</span>)}
        </div>
        <ol>
          {items.map((it, i) => (
            <li key={it.n} className={`grid grid-cols-[1fr_repeat(4,52px)] items-center gap-x-1 px-3 py-4 md:grid-cols-[1fr_repeat(4,88px)] ${i % 2 ? "bg-[#d9d9de]" : "bg-[#f2f2f4]"}`}>
              <span className="pr-2 text-[14px] font-bold leading-snug">{it.text}</span>
              {COLS.map((c) => (
                <label key={c.value} className="flex cursor-pointer justify-center">
                  <input type="radio" name={`q${it.n}`} value={c.value} checked={ans[it.n] === c.value}
                    onChange={() => setAns({ ...ans, [it.n]: c.value })} className="h-5 w-5 accent-[#cc0033]" aria-label={`${it.text}: ${c.label}`} />
                </label>))}
            </li>))}
        </ol>

        <div className="border-t-[1.5px] border-rule px-5 py-4">
          <label htmlFor="checkin-note" className="block text-[15px] font-bold">Anything about today, in your own words?</label>
          <p className="text-[13px] text-soft">Optional. We read it for a few plain facts; tap any chip away.</p>
          <textarea id="checkin-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            onBlur={() => { if (note.trim()) { immediate.current = true; setBlurred((b) => b + 1); } }}
            placeholder="e.g. slept four hours, midterm Thursday, skipped lunch"
            className="mt-2 w-full resize-y rounded-xl border-[1.5px] border-rule bg-white px-3 py-2 text-[15px] leading-snug placeholder:text-soft/70 focus:border-scarlet focus:outline-none" />
          {trimmed && (chips.length > 0 || reading || (guess && guess !== tab)) && (
            <div className="mt-2 flex flex-wrap items-center gap-2" aria-live="polite">
              <span className="text-[13px] text-soft">{reading && !chips.length ? "Reading…" : chips.length ? "What we read:" : ""}</span>
              {chips.map((c) => (
                <button key={c} type="button" className="chip" onClick={() => setDropped([...dropped, c])} aria-label={`Remove ${c}`}>{c} <span aria-hidden>×</span></button>))}
              {guess && guess !== tab && (
                <button type="button" onClick={() => setTab(guess)} className="rounded-full border-[1.5px] border-scarlet bg-white px-3 py-1 text-[13px] font-bold text-scarlet">Jump to {cap(guess)}</button>)}
            </div>
          )}
          <Source text={`read on this phone${readBy && !readBy.startsWith("rules") ? ` and by the engine (${readBy})` : ""}; with the engine running, Comprehend Medical and the model add to it; never stored off this phone`} />
        </div>

        <div className="flex items-center justify-between gap-2 border-t-[1.5px] border-rule px-3 py-3">
          <button onClick={() => setTab(order[Math.max(0, idx - 1)])} disabled={idx === 0} className="btn btn-ghost disabled:opacity-40">Previous</button>
          <div className="flex gap-2">
            <button onClick={() => setTab(order[Math.min(order.length - 1, idx + 1)])} disabled={idx === order.length - 1} className="btn btn-ghost disabled:opacity-40">Next</button>
            <button onClick={submit} disabled={!canSubmit} className="btn btn-primary disabled:opacity-40">Submit{totalAnswered ? ` (${totalAnswered})` : mood ? " mood" : trimmed ? " note" : ""}</button>
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
          <Source text={`Wellness Inventory items: ${CITATION}; quick set chosen by the team, not a validated short form, all items one tap away; nothing leaves this phone until you submit, and then only the dimension scores`} />
        </div>
      </div>
    </section>
  );
}
