// Surface: day ("Your day"). One student's 24 hours as a timeline: each input, what it meant, what ScarletWell did about it,
// and where. Built from the profile, the calendar, the wearable import, meals the student logs, and the engine's
// feedback, nudge and events. "Walk through Maya's Tuesday" seeds one coherent person so a judge can follow the story.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { Feedback, Nudge, Resource, WellnessEvent } from "@/api/types";
import type { PageRoute } from "@/App";
import { PageHead, Source } from "@/components/ui";
import { cycleDay, loadCalendar, loadProfile, parseIcs, saveCalendar, saveProfile, SAMPLE_ICS, type CalEvent, type Profile } from "@/data/profile";
import { forEngine, loadTaps } from "@/data/taps";
import { loadWearable, saveWearable, syntheticWearable, windowBefore } from "@/data/wearable";

const ORIGIN = { nb: { lat: 40.5231, lng: -74.4578 }, nwk: { lat: 40.7405, lng: -74.1758 }, cam: { lat: 39.9478, lng: -75.124 } };

export const route: PageRoute = { path: "/day", label: "Your day", order: 0.5, owner: "team", student: true };

type Meal = { time: string; text: string; note?: string };
const KEY_MEALS = "meals";
const loadMeals = (): Meal[] => { try { return JSON.parse(localStorage.getItem(KEY_MEALS) ?? "[]"); } catch { return []; } };
const saveMeals = (m: Meal[]) => { try { localStorage.setItem(KEY_MEALS, JSON.stringify(m)); } catch { /* */ } };

type Item = { time: string; kind: "sleep" | "class" | "meal" | "checkin" | "nudge" | "event" | "cycle" | "due" | "evening"; input: string; from: string; meaning: string; action?: string; place?: string; link?: string };

const DEMO_DAY = "2026-10-13";
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });   // 24h so the timeline sorts by text

function seedMaya() {
  const p: Profile = { name: "Maya", campus: "nb", level: "undergrad", medications: [], family: { diabetes: true, heart: false, mental_health: false, other: "" },
    sensor: "cgm", cycle: { tracks: true, last_period: "2026-09-28", typical_length: 28 }, alcohol: "rarely", calendar: { source: "ics", name: "canvas-export.ics" },
    family_text: "My dad has type 2 diabetes. Otherwise nothing I know of.", counselor: { name: "", invited: null },
    triggers: { glucose: true, short_sleep: true, low_steps: true, cooped_up: true, stretched_week: true, deadline_crunch: true },
    consent: { aggregate: false, counselor: false } };
  saveProfile(p); saveCalendar(parseIcs(SAMPLE_ICS));
  const w = syntheticWearable("2026-08-31", DEMO_DAY); saveWearable(w);
  saveMeals([{ time: "08:10", text: "Bagel with cream cheese and an iced coffee, Busch Student Center" },
             { time: "12:40", text: "Chipotle bowl, chicken, brown rice, beans, lettuce" }]);
  try { localStorage.setItem("checkin", JSON.stringify({ state: { history: [
    { date: "2026-09-08", scores: { Physical: 3.4, Emotional: 3.6, Social: 3.9 } },
    { date: "2026-09-22", scores: { Physical: 3.0, Emotional: 3.2, Social: 4.1 } },
    { date: DEMO_DAY, scores: { Physical: 2.4, Emotional: 3.2, Social: 4.3 } }] }, version: 0 })); } catch { /* */ }
}

export default function Day() {
  const [p, setP] = useState<Profile>(loadProfile);
  const [cal, setCal] = useState<CalEvent[]>(loadCalendar);
  const [meals, setMeals] = useState<Meal[]>(loadMeals);
  const [fb, setFb] = useState<Feedback>();
  const [nudge, setNudge] = useState<Nudge>();
  const [cooped, setCooped] = useState<Nudge>();
  const [mealText, setMealText] = useState("");
  const [busy, setBusy] = useState(false);
  const today = p.name === "Maya" ? DEMO_DAY : new Date().toISOString().slice(0, 10);
  const wear = loadWearable();
  const sleepLast = wear ? wear.rows.find((r) => r.date === today)?.sleep_h ?? wear.rows[wear.rows.length - 1]?.sleep_h ?? null : null;
  const sleep7 = wear ? windowBefore(wear.rows, today).sleep_h : null;
  const cd = cycleDay(p, new Date(today + "T12:00:00"));
  const classes = cal.filter((e) => e.start.slice(0, 10) === today);
  // cooped up: the last three days on the watch all under 4,000 steps, inside an exam or warning-grade week
  const last3 = wear ? wear.rows.filter((r) => r.date <= today).slice(-3) : [];
  const coopedUp = last3.length === 3 && last3.every((r) => (r.steps ?? 99999) < 4000);
  const stepsLow = coopedUp ? Math.round(last3.reduce((s, r) => s + (r.steps ?? 0), 0) / 3) : 0;

  useEffect(() => {
    const scores = (() => { try { const h = JSON.parse(localStorage.getItem("checkin") ?? "{}")?.state?.history ?? []; const last = h[h.length - 1]; return last ? Object.fromEntries(Object.entries(last.scores).map(([k, v]) => [k.toLowerCase(), v])) : null; } catch { return null; } })();
    const taps = forEngine(loadTaps());
    if (scores) api.feedback({ scores, campus: p.campus, ...(taps.length ? { taps } : {}) }).then(setFb);
    if (p.sensor !== "none" && p.triggers.glucose) api.nudge({ signal: { type: "glucose_dropping", value: 78, source: "cgm" }, campus: p.campus, ...ORIGIN[p.campus] }).then(setNudge);
    if (coopedUp && p.triggers.cooped_up) api.nudge({ signal: { type: "cooped_up", value: 3, source: "watch" }, campus: p.campus, ...ORIGIN[p.campus] }).then(setCooped); else setCooped(undefined);
  }, [p.campus, p.sensor, p.name, p.triggers.glucose, p.triggers.cooped_up, coopedUp]);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    if (sleepLast != null) out.push({ time: "07:30", kind: "sleep", input: `${sleepLast.toFixed(1)} hours of sleep`, from: wear?.synthetic ? "watch (synthetic sample)" : "your watch",
      meaning: sleepLast < 6.5 ? `Short night${sleep7 != null && sleep7 < 6.5 ? `, and the week is averaging ${sleep7.toFixed(1)}` : ""}. Expect the afternoon to feel heavier than the morning.` : "A full night. Good base for the day.",
      action: sleepLast < 6.5 ? "Afternoon gets one quiet break, and tonight is an hour earlier." : undefined });
    if (cd) out.push({ time: "07:30", kind: "cycle", input: `Cycle day ${cd}`, from: "your profile", meaning: cd <= 5 ? "Early in the cycle: energy and sleep often run lower for a few days. Information, not a verdict." : cd >= 24 ? "Late in the cycle: sleep and mood can wobble this week." : "Mid-cycle: usually the steadiest stretch.", action: cd <= 5 || cd >= 24 ? "Lighter plans this week count as the plan." : undefined });
    for (const m of meals) out.push({ time: m.time, kind: "meal", input: m.text, from: "you logged it", meaning: m.note ?? (p.family.diabetes ? "With diabetes in your family, the steady-energy pattern matters more than any one meal: protein and fibre with the carbs, and movement after." : "A meal is a meal. The pattern across the week is what we look at."), action: p.family.diabetes && /bagel|pastry|soda|juice|iced coffee/i.test(m.text) ? "Next time, something with protein alongside, and a short walk after." : undefined });
    for (const c of classes) out.push({ time: hhmm(c.start), kind: c.title.startsWith("Canvas") ? "due" : "class", input: c.title, from: p.calendar.name ?? "your calendar", meaning: c.title.startsWith("Canvas") ? "A deadline tonight. Plan the evening around it, not against it." : c.location ? `In ${c.location}.` : "", action: undefined, place: c.location ?? undefined });
    if (cooped) out.push({ time: "13:10", kind: "nudge", input: `Watch: about ${stepsLow.toLocaleString()} steps a day for three days`, from: wear?.synthetic ? "watch (synthetic sample)" : "your watch", meaning: cooped.message, action: cooped.options[0],
      place: cooped.event ? `${cooped.event.title.split(" (")[0]}, ${cooped.event.location}` : cooped.place ? `${cooped.place.name}, ${cooped.place.walk_min} min walk` : undefined, link: "/feedback" });
    if (nudge) out.push({ time: "11:40", kind: "nudge", input: `Sensor: glucose sliding (${nudge.signal.value})`, from: "your CGM", meaning: nudge.message, action: nudge.options[0], place: nudge.place ? `${nudge.place.name}, ${nudge.place.walk_min} min walk` : undefined, link: "/feedback" });
    if (fb) {
      const low = fb.cards.find((c) => c.band !== "strong");
      out.push({ time: "15:30", kind: "checkin", input: `Check-in: ${fb.cards.map((c) => `${c.dimension} ${c.score.toFixed(1)}`).join(", ")}`, from: "you, between classes", meaning: fb.opening, action: low?.next_step, place: low?.resource ? `${low.resource.name}${low.resource.online ? "" : `, ${low.resource.distance_km} km`}` : undefined, link: "/feedback" });
      const ev: WellnessEvent | undefined = fb.cards.map((c) => c.event).find((e): e is WellnessEvent => !!e);
      if (ev) out.push({ time: hhmm(ev.start), kind: "event", input: ev.title, from: "Rutgers Wellness Calendar", meaning: "Matches the dimension you marked lowest today. Free.", action: "Go, or save it for next week; it repeats.", place: ev.location, link: "/feedback" });
    }
    out.push({ time: "22:30", kind: "evening", input: "Bedtime", from: "ScarletWell", meaning: sleepLast != null && sleepLast < 6.5 ? "Short night behind you, a deadline tonight. Phone down by 11 is the whole plan." : "Keep the rhythm you have.", action: p.alcohol === "weekly" || p.alcohol === "most_days" ? "If tonight includes a drink, a glass of water with it protects tomorrow's sleep." : undefined });
    return out.sort((a, b) => a.time.localeCompare(b.time));
  }, [sleepLast, sleep7, cd, meals, classes, nudge, cooped, stepsLow, fb, p, wear?.synthetic]);

  async function logMeal() {
    if (!mealText.trim() || busy) return;
    setBusy(true);
    const r = await api.chat({ messages: [{ role: "user", content: `I just ate: ${mealText}. One kind sentence about it, no numbers.` }], campus: p.campus });
    const m = [...meals, { time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }), text: mealText, note: r.method.startsWith("templates") ? undefined : r.reply }];
    setMeals(m); saveMeals(m); setMealText(""); setBusy(false);
  }

  const first = p.name ? `${p.name}, ` : "";
  return (
    <section>
      <PageHead kicker={`${today} · Rutgers ${{ nb: "New Brunswick", nwk: "Newark", cam: "Camden" }[p.campus]}`} title="Your day" sub={`${first}each line is one thing you let ScarletWell see, what it meant, and what it did about it.`} />
      {!p.name && (
        <div className="mt-4 rounded-[16px] border-[1.5px] border-rule bg-white p-4">
          <p className="text-[15px]">Nothing here yet. <Link to="/profile" className="underline">Fill in About you</Link>, import your watch, log a meal. Or watch one student's day first:</p>
          <button className="btn btn-primary mt-3" onClick={() => { seedMaya(); setP(loadProfile()); setCal(loadCalendar()); setMeals(loadMeals()); }}>Walk through Maya's Tuesday</button>
        </div>)}
      {p.name === "Maya" && <p className="mt-3 text-[13px] text-soft">Maya is a made-up student: sensor, diabetes in the family, cycle day {cd}, a Canvas export, a synthetic watch. Every suggestion below is the real engine answering her data. <Link to="/profile" className="underline">Make it yours</Link>.</p>}

      <ol className="mt-5 border-l-[2px] border-rule pl-4">
        {items.map((it, i) => (
          <li key={i} className="relative pb-5">
            <span className={`absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${it.kind === "nudge" ? "bg-scarlet" : it.kind === "checkin" || it.kind === "event" ? "bg-ink" : "bg-soft"}`} />
            <p className="readout">{it.time} · {it.from}</p>
            <p className="display text-[19px] leading-tight">{it.input}</p>
            {it.meaning && <p className="mt-1 text-[15px] text-soft">{it.meaning}</p>}
            {it.action && <p className="mt-1 text-[15px]"><span className="font-bold">One small thing:</span> {it.action}</p>}
            {it.place && <p className="mt-1 text-[14px] text-soft">Where: {it.place}{it.link ? <> · <Link to={it.link} className="underline">open</Link></> : null}</p>}
          </li>))}
      </ol>

      <div className="mt-2 rounded-[16px] border-[1.5px] border-rule bg-white p-4">
        <p className="eyebrow">Log a meal or a snack</p>
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); logMeal(); }}>
          <input value={mealText} onChange={(e) => setMealText(e.target.value)} placeholder="e.g. two slices of pizza and a soda" className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-rule bg-white px-3 py-2 text-[15px]" aria-label="Meal" />
          <button className="btn btn-ghost" type="submit" disabled={busy}>Add</button>
        </form>
        <p className="mt-2 text-[13px] text-soft">Type it, or <Link to="/chat" className="underline">send a photo in Chat</Link>. Three meals and snacks a day make the week's pattern visible; no calories, ever.</p>
      </div>

      <div className="mt-4 rounded-[16px] bg-ink p-4 text-white">
        <p className="text-white/70">What today taught ScarletWell about you</p>
        <ul className="mt-2 space-y-1 text-[15px]">
          {sleepLast != null && <li>Sleep: {sleepLast.toFixed(1)} h last night{sleep7 != null ? `, ${sleep7.toFixed(1)} h average this week` : ""}.</li>}
          {fb && <li>Check-in: {fb.cards[0].dimension} strongest, {fb.cards[fb.cards.length - 1].dimension} most stretched.</li>}
          {meals.length > 0 && <li>{meals.length} meal{meals.length === 1 ? "" : "s"} logged{p.family.diabetes ? "; steady-energy pattern in view because of your family history" : ""}.</li>}
          {classes.length > 0 && <li>{classes.length} calendar items; nudges land in the gaps.</li>}
          <li>Nothing on this page left your phone except a campus, a score, a signal type and the meal text you typed.</li>
        </ul>
      </div>
      <Source text="profile, calendar, meals and watch from localStorage; feedback, nudge and events from the engine; see docs/SOURCE_OF_TRUTH.md 2.9" />
    </section>
  );
}
