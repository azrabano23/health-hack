// Surface: profile ("About you"). Every input is optional and stays on this phone. Spec: docs/SOURCE_OF_TRUTH.md 2.9.
import { useState } from "react";
import { Link } from "react-router-dom";
import type { PageRoute } from "@/App";
import { PageHead, Source, Toggle } from "@/components/ui";
import { EMPTY, cycleDay, loadCalendar, loadProfile, parseIcs, saveCalendar, saveProfile, type Profile } from "@/data/profile";

export const route: PageRoute = { path: "/profile", label: "About you", order: 4.8, owner: "team" };

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="border-b-[1.5px] border-rule py-4"><p className="eyebrow">{label}</p><div className="mt-2">{children}</div></div>);
const Seg = <T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) => (
  <div className="flex flex-wrap gap-2">{options.map(([v, l]) => <button key={v} onClick={() => onChange(v)} className={`chip ${value === v ? "chip-on" : ""}`}>{l}</button>)}</div>);

export default function ProfilePage() {
  const [p, setP] = useState<Profile>(loadProfile);
  const [cal, setCal] = useState(loadCalendar());
  const [med, setMed] = useState("");
  const set = (patch: Partial<Profile>) => { const n = { ...p, ...patch }; setP(n); saveProfile(n); };
  const cd = cycleDay(p);
  async function onIcs(f: File | undefined) { if (!f) return; const ev = parseIcs(await f.text()); saveCalendar(ev); setCal(ev); set({ calendar: { source: "ics", name: f.name } }); }
  return (
    <section>
      <PageHead kicker="Optional, on this phone only" title="About you" sub="Tell ScarletWell what you want it to know. Each line changes how it talks to you; none of it leaves your phone or reaches the campus picture." />
      <Row label="Name and campus">
        <input value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="What should we call you?" className="mb-2 w-full rounded-[10px] border-[1.5px] border-rule bg-white px-3 py-2" />
        <Seg value={p.campus} options={[["nb", "New Brunswick"], ["nwk", "Newark"], ["cam", "Camden"]]} onChange={(campus) => set({ campus })} />
      </Row>
      <Row label="Medications you take (so nudges make sense, e.g. a snack idea if you use insulin)">
        <div className="flex gap-2">
          <input value={med} onChange={(e) => setMed(e.target.value)} placeholder="e.g. metformin" className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-rule bg-white px-3 py-2" />
          <button className="btn btn-ghost" onClick={() => { if (med.trim()) { set({ medications: [...p.medications, med.trim()] }); setMed(""); } }}>Add</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">{p.medications.map((m) => <button key={m} onClick={() => set({ medications: p.medications.filter((x) => x !== m) })} className="chip">{m} ×</button>)}</div>
        <p className="mt-1 text-[13px] text-soft">We never tell you to change a medication. Your prescriber does that.</p>
      </Row>
      <Row label="Family history, if you want it in">
        <Toggle on={p.family.diabetes} onChange={(v) => set({ family: { ...p.family, diabetes: v } })} label="Diabetes in my family" detail="ScarletWell leans on steady-energy food ideas and the Student Health check-up resource. No screening, no label." />
        <Toggle on={p.family.mental_health} onChange={(v) => set({ family: { ...p.family, mental_health: v } })} label="Mental health conditions in my family" detail="Emotional check-ins get a gentler cadence and CAPS stays one tap away." />
      </Row>
      <Row label="A glucose sensor you wear">
        <Seg value={p.sensor} options={[["none", "No"], ["cgm", "Continuous sensor"], ["glucometer", "Finger-stick meter"]]} onChange={(sensor) => set({ sensor })} />
        <p className="mt-1 text-[13px] text-soft">If yes, a reading from it can trigger a nudge. We show the reading; we never predict it.</p>
      </Row>
      <Row label="Alcohol, typically">
        <Seg value={p.alcohol} options={[["none", "None"], ["rarely", "Rarely"], ["weekly", "Most weeks"], ["most_days", "Most days"]]} onChange={(alcohol) => set({ alcohol })} />
        <p className="mt-1 text-[13px] text-soft">Only shapes the morning-after sleep and hydration notes. ADAP and HOPE are in Nearby if you ever want them.</p>
      </Row>
      <Row label="Cycle, if applicable">
        <Toggle on={p.cycle.tracks} onChange={(v) => set({ cycle: { ...p.cycle, tracks: v } })} label="Track my cycle" detail="Sleep and energy notes mention where you are in your cycle. Nothing else changes." />
        {p.cycle.tracks && (
          <div className="mt-2 flex items-center gap-2 text-[15px]">
            <span>Last period started</span>
            <input type="date" value={p.cycle.last_period ?? ""} onChange={(e) => set({ cycle: { ...p.cycle, last_period: e.target.value || null } })} className="rounded-[10px] border-[1.5px] border-rule bg-white px-2 py-1" />
            {cd && <span className="text-soft">day {cd} today</span>}
          </div>)}
      </Row>
      <Row label="Your watch or phone">
        <Link to="/devices" className="underline">Import sleep and steps</Link>
        <p className="mt-1 text-[13px] text-soft">Fitbit, Apple Health, Oura, Garmin exports. Shows on your day and your trend.</p>
      </Row>
      <Row label="Your calendar (Google Calendar or Canvas export)">
        <input type="file" accept=".ics,text/calendar" onChange={(e) => onIcs(e.target.files?.[0])} className="block w-full text-[14px]" aria-label="ICS file" />
        <p className="mt-1 text-[13px] text-soft">{cal.length ? `${cal.length} events loaded from ${p.calendar.name}.` : "Google Calendar: Settings, Export. Canvas: Calendar, Calendar Feed, download the .ics."} Classes and due dates appear on your day so nudges land in the gaps.</p>
      </Row>
      <Row label="Sharing">
        <Toggle on={p.consent.aggregate} onChange={(v) => set({ consent: { ...p.consent, aggregate: v } })} label="Add my check-ins to the campus picture" detail="Only check-in scores, only with at least five other students in every cell. Never this page, never your devices." />
        <Toggle on={p.consent.counselor} onChange={(v) => set({ consent: { ...p.consent, counselor: v } })} label="Let my counselor see my trend" detail="Only if you name one. Off by default." />
      </Row>
      <div className="mt-4 flex gap-3">
        <Link to="/day" className="btn btn-primary">See your day</Link>
        <button className="btn btn-ghost" onClick={() => { saveProfile(EMPTY); setP(EMPTY); saveCalendar([]); setCal([]); }}>Clear everything</button>
      </div>
      <Source text="on-device only (localStorage); the engine receives a campus, a dimension score, a signal type or a typed message, never this page" />
    </section>
  );
}
