// Surface: profile ("About you"). Every input is optional and stays on this phone. Spec: docs/SOURCE_OF_TRUTH.md 2.9.
// The only thing that leaves is an email address, to the engine, to prove it is a Rutgers one.
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { PageRoute } from "@/App";
import { PageHead, Source, Toggle } from "@/components/ui";
import { DEVICES, KIND_WORDS as DEVICE_KIND, isGlucose, searchDevices } from "@/data/devices_catalog";
import { CITATION as MED_CITATION, KIND_WORDS as MED_KIND, TIMES, searchMedications, type MedTime } from "@/data/medications";
import { canNotify, notify, notifyState, requestNotify } from "@/data/notify";
import { ACTIVITIES, DAYS, EMPTY, INTRAMURALS, SLOTS, TRIGGERS, cycleDay, loadCalendar, loadProfile, parseFamily, parseIcs, saveCalendar, saveProfile, type CalendarSource, type Day, type MedEntry, type Profile, type Slot } from "@/data/profile";

export const route: PageRoute = { path: "/profile", label: "About you", order: 0.3, owner: "team", student: true, wide: true };

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="card p-5"><p className="eyebrow">{title}</p><div className="mt-3 space-y-5">{children}</div></div>);
const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div><p className="text-[15px] font-bold">{label}</p><div className="mt-2">{children}</div>{hint && <p className="mt-1.5 text-[13px] text-soft">{hint}</p>}</div>);
const Seg = <T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) => (
  <div className="flex flex-wrap gap-2">{options.map(([v, l]) => <button key={v} onClick={() => onChange(v)} className={`chip ${value === v ? "chip-on" : ""}`}>{l}</button>)}</div>);
const Multi = ({ value, options, onChange }: { value: string[]; options: string[]; onChange: (v: string[]) => void }) => (
  <div className="flex flex-wrap gap-2">{options.map((o) => <button key={o} aria-pressed={value.includes(o)} onClick={() => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])} className={`chip ${value.includes(o) ? "chip-on" : ""}`}>{o}</button>)}</div>);
const input = "w-full rounded-[10px] border-[1.5px] border-rule bg-white px-3 py-2 text-[15px]";

const CAL: [CalendarSource, string, string][] = [
  ["google", "Google Calendar", "calendar.google.com, Settings, Import and export, Export. Unzip and choose the .ics for your main calendar."],
  ["microsoft", "Outlook", "outlook.office.com, Settings, Calendar, Shared calendars, Publish a calendar, then open the ICS link to download it."],
  ["canvas", "Canvas", "canvas.rutgers.edu, Calendar, Calendar Feed, open the link; your browser downloads an .ics with every due date."],
  ["webreg", "WebReg schedule", "Course Schedule Planner (sims.rutgers.edu/csp), open your schedule, Export to calendar, save the .ics."],
];

export default function ProfilePage() {
  const [p, setP] = useState<Profile>(loadProfile);
  const [cal, setCal] = useState(loadCalendar());
  const [medQ, setMedQ] = useState(""); const [devQ, setDevQ] = useState("");
  const [code, setCode] = useState(""); const [mail, setMail] = useState<string>();
  const [calPick, setCalPick] = useState<CalendarSource>(p.calendar.source === "none" || p.calendar.source === "ics" ? "google" : p.calendar.source);
  const set = (patch: Partial<Profile>) => { const n = { ...p, ...patch }; saveProfile(n); setP(loadProfile()); };
  const cd = cycleDay(p);
  const rutgers = /@([a-z0-9.-]+\.)?rutgers\.edu$|@scarletmail\.rutgers\.edu$/i.test(p.email.address.trim());

  async function sendCode() {
    const r = await api.verifySend(p.email.address.trim());
    setMail(r.ok ? (r.sent ? "Code sent. Check your Rutgers inbox." : `${r.why} Code: ${r.dev_code}`) : r.why);
    if (r.ok) set({ email: { ...p.email, sent: true } });
  }
  async function checkCode() {
    const ok = await api.verifyCheck(p.email.address.trim(), code);
    setMail(ok ? "Verified. Thanks." : "That code did not match, or it expired. Send a new one.");
    if (ok) set({ email: { ...p.email, verified: true } });
  }
  async function onIcs(f: File | undefined) { if (!f) return; const ev = parseIcs(await f.text()); saveCalendar(ev); setCal(ev); set({ calendar: { source: calPick, name: f.name } }); }
  const updMed = (i: number, patch: Partial<MedEntry>) => set({ meds: p.meds.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
  const grid = (d: Day, s: Slot) => { const cur = p.alcohol_grid[d] ?? []; set({ alcohol_grid: { ...p.alcohol_grid, [d]: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] } }); };

  return (
    <section>
      <PageHead kicker="Optional, on this phone only" title="About you" sub="Each line changes how ScarletWell talks to you. None of it reaches the campus picture." />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Section title="Who you are">
          <Field label="Name"><input value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="What should we call you?" className={input} /></Field>
          <Field label="Campus"><Seg value={p.campus} options={[["nb", "New Brunswick"], ["nwk", "Newark"], ["cam", "Camden"]]} onChange={(campus) => set({ campus })} /></Field>
          <Field label="You are"><Seg value={p.level} options={[["undergrad", "Undergraduate"], ["grad", "Graduate"], ["faculty_staff", "Faculty or staff"]]} onChange={(level) => set({ level })} /></Field>
          <Field label="Rutgers email" hint={p.email.verified ? "Verified Rutgers address. Student features stay unlocked on this phone." : "Students verify once with a code mailed to a scarletmail.rutgers.edu or rutgers.edu address. Nothing else about you is stored."}>
            <div className="flex gap-2">
              <input value={p.email.address} onChange={(e) => set({ email: { address: e.target.value, verified: false, sent: false } })} placeholder="netid@scarletmail.rutgers.edu" type="email" className={`${input} min-w-0 flex-1`} />
              {p.email.verified ? <span className="chip chip-on shrink-0">Verified</span> : <button className="btn btn-ghost shrink-0" disabled={!rutgers} onClick={sendCode}>Send code</button>}
            </div>
            {p.email.address && !rutgers && <p className="mt-1.5 text-[13px] text-scarlet">That is not a Rutgers address.</p>}
            {p.email.sent && !p.email.verified && (
              <div className="mt-2 flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="6-digit code" className={`${input} min-w-0 flex-1`} />
                <button className="btn btn-primary shrink-0" disabled={code.trim().length !== 6} onClick={checkCode}>Verify</button>
              </div>)}
            {mail && <p className="mt-1.5 text-[13px] text-soft">{mail}</p>}
          </Field>
          <Field label="Phone and notifications" hint={canNotify() ? (notifyState() === "granted" ? "Nudges show as notifications while ScarletWell is open on this device. Text messages come once a provider is connected." : "Allow notifications and a nudge can reach you here; texts come once a provider is connected.") : "This browser cannot show notifications."}>
            <div className="flex flex-wrap gap-2">
              <input value={p.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="Mobile number, for texts" type="tel" className={`${input} min-w-0 flex-1`} />
              {notifyState() === "granted"
                ? <button className="btn btn-ghost shrink-0" onClick={() => notify("ScarletWell", "This is what a nudge looks like. One line, one small thing, one place.")}>Test a nudge</button>
                : <button className="btn btn-ghost shrink-0" disabled={!canNotify()} onClick={async () => set({ push: await requestNotify() })}>Allow notifications</button>}
            </div>
          </Field>
        </Section>

        <Section title="Your schedule">
          <Field label="Where your classes and due dates live" hint={cal.length ? `${cal.length} events loaded from ${p.calendar.name}. They appear on Your day so nudges land in the gaps.` : "Pick one and follow its three steps; the file never leaves this phone."}>
            <Seg value={calPick} options={CAL.map(([k, l]) => [k, l] as [CalendarSource, string])} onChange={setCalPick} />
            <p className="mt-2 text-[14px]">{CAL.find(([k]) => k === calPick)?.[2]}</p>
            <input type="file" accept=".ics,text/calendar" onChange={(e) => onIcs(e.target.files?.[0])} className="mt-2 block w-full text-[14px]" aria-label="Calendar file" />
          </Field>
          <Field label="Gym days, if you want them planned in">
            <Multi value={p.prefs.gym_days} options={DAYS} onChange={(gym_days) => set({ prefs: { ...p.prefs, gym_days: gym_days as Day[] } })} />
            <div className="mt-2"><Seg value={p.prefs.gym_time} options={[["", "Any time"], ["morning", "Before class"], ["midday", "Midday"], ["evening", "Evening"]]} onChange={(gym_time) => set({ prefs: { ...p.prefs, gym_time } })} /></div>
          </Field>
          <Field label="Intramural sports you play or want to" hint="Rutgers Recreation runs leagues each semester; Your day will show the sign-up windows."><Multi value={p.prefs.intramurals} options={INTRAMURALS} onChange={(intramurals) => set({ prefs: { ...p.prefs, intramurals } })} /></Field>
          <Field label="Other ways you like to move"><Multi value={p.prefs.activities} options={ACTIVITIES} onChange={(activities) => set({ prefs: { ...p.prefs, activities } })} /></Field>
        </Section>

        <Section title="Health">
          <Field label="Medications you take" hint={`${MED_CITATION}. We never tell you to change one; your prescriber does.`}>
            <input value={medQ} onChange={(e) => setMedQ(e.target.value)} placeholder="Start typing: metformin, sertraline, Adderall, the pill" className={input} />
            {medQ && (
              <ul className="mt-1 divide-y divide-rule rounded-[10px] border-[1.5px] border-rule bg-white">
                {searchMedications(medQ).map((m) => (
                  <li key={m.name}><button className="flex w-full items-baseline justify-between px-3 py-2 text-left text-[14px] hover:bg-canvas" onClick={() => { if (!p.meds.some((x) => x.name === m.name)) set({ meds: [...p.meds, { name: m.name, dose: m.strengths[0] ?? null, unit: m.unit, times: [] }] }); setMedQ(""); }}>
                    <span>{m.name}</span><span className="text-[12px] text-soft">{MED_KIND[m.kind]}</span></button></li>))}
                {!searchMedications(medQ).length && <li><button className="w-full px-3 py-2 text-left text-[14px] hover:bg-canvas" onClick={() => { set({ meds: [...p.meds, { name: medQ.trim(), dose: null, unit: "mg", times: [] }] }); setMedQ(""); }}>Add "{medQ.trim()}" as typed</button></li>}
              </ul>)}
            <ul className="mt-2 space-y-2">
              {p.meds.map((m, i) => {
                const cat = searchMedications(m.name, 1)[0];
                return (
                  <li key={m.name + i} className="rounded-[10px] border-[1.5px] border-rule bg-white p-3">
                    <div className="flex items-baseline justify-between gap-2"><p className="text-[15px] font-bold">{m.name}</p><button className="text-[13px] text-soft underline" onClick={() => set({ meds: p.meds.filter((_, j) => j !== i) })}>Remove</button></div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[14px]">
                      <span>Dose</span>
                      {cat?.strengths.length ? (
                        <select value={m.dose ?? ""} onChange={(e) => updMed(i, { dose: e.target.value ? Number(e.target.value) : null })} className="rounded-[8px] border-[1.5px] border-rule bg-white px-2 py-1">
                          <option value="">pick</option>{cat.strengths.map((s) => <option key={s} value={s}>{s} {cat.unit}</option>)}</select>
                      ) : <><input type="number" inputMode="decimal" value={m.dose ?? ""} onChange={(e) => updMed(i, { dose: e.target.value ? Number(e.target.value) : null })} className="w-24 rounded-[8px] border-[1.5px] border-rule bg-white px-2 py-1" /><span>{m.unit}</span></>}
                      {cat?.note && <span className="text-[12px] text-soft">{cat.note}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">{TIMES.map((t) => <button key={t} aria-pressed={m.times.includes(t)} onClick={() => updMed(i, { times: m.times.includes(t) ? m.times.filter((x) => x !== t) : [...m.times, t as MedTime] })} className={`chip ${m.times.includes(t) ? "chip-on" : ""}`}>{t}</button>)}</div>
                  </li>);
              })}
            </ul>
          </Field>
          <Field label="Past medical history, in your own words" hint="Shown back to you on Your day when it matters; never scored, never shared.">
            <textarea value={p.history_text} onChange={(e) => set({ history_text: e.target.value })} rows={2} placeholder="e.g. asthma since childhood, a concussion in 2024, iron deficiency" className={input} />
          </Field>
          <Field label="Family history, in your own words" hint="Read for three things only: diabetes, heart, mental health. No screening, no label.">
            <textarea value={p.family_text} onChange={(e) => set({ family_text: e.target.value, family: parseFamily(e.target.value) })} rows={2} placeholder="e.g. My dad has type 2 diabetes. Anxiety runs on my mom's side." className={input} />
            <div className="mt-2 flex flex-wrap gap-2 text-[13px]">
              {p.family.diabetes && <span className="chip chip-on">diabetes: steady-energy food notes</span>}
              {p.family.heart && <span className="chip chip-on">heart: movement notes and a check-up resource</span>}
              {p.family.mental_health && <span className="chip chip-on">mental health: gentler cadence, CAPS one tap away</span>}
            </div>
          </Field>
          <Field label="Sensors and wearables you use" hint="A glucose sensor lets a reading trigger a nudge; a watch or ring brings sleep and steps. Connect or export on Devices.">
            <input value={devQ} onChange={(e) => setDevQ(e.target.value)} placeholder="Start typing: Dexcom, Libre, Apple Watch, Oura, Whoop, Garmin" className={input} />
            {devQ && (
              <ul className="mt-1 divide-y divide-rule rounded-[10px] border-[1.5px] border-rule bg-white">
                {searchDevices(devQ).map((d) => (
                  <li key={d.name}><button className="flex w-full items-baseline justify-between px-3 py-2 text-left text-[14px] hover:bg-canvas" onClick={() => { set(isGlucose(d) ? { sensors: [...new Set([...p.sensors, d.name])] } : { wearables: [...new Set([...p.wearables, d.name])] }); setDevQ(""); }}>
                    <span>{d.maker ? `${d.maker} ` : ""}{d.name}</span><span className="text-[12px] text-soft">{DEVICE_KIND[d.kind]} · {d.gives.join(", ").replace(/_/g, " ")}</span></button></li>))}
                {!searchDevices(devQ).length && <li className="px-3 py-2 text-[13px] text-soft">Not in the list yet. Tell us the name in Chat and we will add it.</li>}
              </ul>)}
            <div className="mt-2 flex flex-wrap gap-2">
              {p.sensors.map((s) => <button key={s} onClick={() => set({ sensors: p.sensors.filter((x) => x !== s) })} className="chip chip-on">{s} ×</button>)}
              {p.wearables.map((s) => <button key={s} onClick={() => set({ wearables: p.wearables.filter((x) => x !== s) })} className="chip">{s} ×</button>)}
            </div>
            {!!p.wearables.length && <p className="mt-1.5 text-[13px]"><Link to="/devices" className="underline">Connect {p.wearables[0]} on Devices</Link></p>}
          </Field>
        </Section>

        <Section title="Habits">
          <Field label="Alcohol: which days, and when" hint="Only shapes the sleep and hydration notes the morning after. ADAP and HOPE are in Nearby if you ever want them.">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead><tr><th className="py-1 text-left font-normal text-soft">Typically</th>{DAYS.map((d) => <th key={d} className="py-1 font-normal text-soft">{d}</th>)}</tr></thead>
                <tbody>{SLOTS.map(([s, l]) => (
                  <tr key={s}><td className="py-1 pr-2">{l}</td>{DAYS.map((d) => (
                    <td key={d} className="py-1 text-center"><input type="checkbox" checked={(p.alcohol_grid[d] ?? []).includes(s)} onChange={() => grid(d, s)} className="h-4 w-4 accent-[#cc0033]" aria-label={`${l} ${d}`} /></td>))}</tr>))}</tbody>
              </table>
            </div>
          </Field>
          <Field label="Menstrual cycle">
            <Toggle on={p.cycle.tracks} onChange={(v) => set({ cycle: { ...p.cycle, tracks: v } })} label="Track my menstrual cycle" detail="Sleep and energy notes mention where you are in your cycle. Over months, your own average cycle length replaces the default." />
            {p.cycle.tracks && (
              <div className="mt-3 space-y-2 text-[14px]">
                <div className="flex flex-wrap items-center gap-2"><span>Last period started</span>
                  <input type="date" value={p.cycle.last_period ?? ""} onChange={(e) => { const v = e.target.value || null; set({ cycle: { ...p.cycle, last_period: v, starts: v && !p.cycle.starts.includes(v) ? [...p.cycle.starts, v].sort().slice(-12) : p.cycle.starts } }); }} className="rounded-[8px] border-[1.5px] border-rule bg-white px-2 py-1" />
                  {cd && <span className="text-soft">day {cd} today</span>}</div>
                <div className="flex flex-wrap items-center gap-2"><span>Cycle length</span>
                  <input type="number" min={20} max={45} value={p.cycle.typical_length} onChange={(e) => set({ cycle: { ...p.cycle, typical_length: Number(e.target.value) || 28 } })} className="w-20 rounded-[8px] border-[1.5px] border-rule bg-white px-2 py-1" /><span>days</span>
                  <span className="ml-3">Period length</span>
                  <input type="number" min={1} max={10} value={p.cycle.period_length} onChange={(e) => set({ cycle: { ...p.cycle, period_length: Number(e.target.value) || 5 } })} className="w-16 rounded-[8px] border-[1.5px] border-rule bg-white px-2 py-1" /><span>days</span></div>
                {p.cycle.starts.length >= 2 && (() => { const s = p.cycle.starts; const gaps = s.slice(1).map((d, i) => (new Date(d).getTime() - new Date(s[i]).getTime()) / 86400000); const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length); return (
                  <p className="text-soft">{s.length} starts logged; your average cycle is {avg} days. <button className="underline" onClick={() => set({ cycle: { ...p.cycle, typical_length: avg } })}>Use {avg}</button></p>); })()}
              </div>)}
          </Field>
        </Section>

        <Section title="Nudges">
          <div className="space-y-2">
            {TRIGGERS.map(([k, label, detail]) => (
              <label key={k} className="flex cursor-pointer items-start gap-3 text-[15px]">
                <input type="checkbox" checked={p.triggers[k]} onChange={(e) => set({ triggers: { ...p.triggers, [k]: e.target.checked } })} className="mt-1 h-4 w-4 accent-[#cc0033]" />
                <span><span className="font-bold">{label}.</span> <span className="text-soft">{detail}</span></span>
              </label>))}
          </div>
          <p className="text-[13px] text-soft">One line, one small thing, one place. Never more than two a day.</p>
        </Section>

        <Section title="Share with a counselor or clinician">
          <div className="flex gap-2">
            <input value={p.counselor.name} onChange={(e) => set({ counselor: { ...p.counselor, name: e.target.value } })} placeholder="Counselor or clinician name" className={`${input} min-w-0 flex-1`} />
            <button className="btn btn-ghost shrink-0" disabled={!p.counselor.name.trim()} onClick={() => set({ counselor: { ...p.counselor, invited: new Date().toISOString().slice(0, 10) }, consent: { ...p.consent, counselor: true } })}>Invite</button>
          </div>
          <p className="text-[13px] text-soft">{p.counselor.invited ? `${p.counselor.name} invited on ${p.counselor.invited}. They see your check-in trend and your sleep line, nothing else. ` : "They see your check-in trend and your sleep line, never this page or your meals. "}
            {p.consent.counselor && <button className="underline" onClick={() => set({ counselor: { name: "", invited: null }, consent: { ...p.consent, counselor: false } })}>Stop sharing</button>}</p>
        </Section>
      </div>
      <div className="mt-5 flex gap-3">
        <Link to="/day" className="btn btn-primary">See your day</Link>
        <button className="btn btn-ghost" onClick={() => { saveProfile(EMPTY); setP(EMPTY); saveCalendar([]); setCal([]); }}>Clear everything</button>
      </div>
      <Source text={`on-device only (localStorage); the engine receives a campus, a dimension score, a signal type, a typed message or an email to verify, never this page; devices listed: ${DEVICES.length}`} />
    </section>
  );
}
