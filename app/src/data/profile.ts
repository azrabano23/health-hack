// About you: the inputs a student chooses to give. All optional, all on this phone, none sent to the aggregate.
// The engine only ever sees a campus, a dimension score, a signal type, a typed message, or an email address to verify.
import { DEVICES, isGlucose } from "@/data/devices_catalog";
import type { MedTime } from "@/data/medications";

export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export type Slot = "day" | "midday" | "night";
export const SLOTS: [Slot, string][] = [["day", "Daytime"], ["midday", "Afternoon"], ["night", "Night"]];
export interface MedEntry { name: string; dose: number | null; unit: string; times: MedTime[] }
export type CalendarSource = "none" | "ics" | "google" | "microsoft" | "canvas" | "webreg";

export interface Profile {
  name: string; campus: "nb" | "nwk" | "cam"; level: "undergrad" | "grad" | "faculty_staff";
  email: { address: string; verified: boolean; sent: boolean };   // Rutgers address, verified by a mailed code (engine/recommend/verify.py)
  phone: string; push: boolean;                 // phone for SMS when a provider is wired; push = browser notifications allowed
  meds: MedEntry[];                             // name from the catalog or typed, dose and unit, times of day
  medications: string[];                        // older shape, migrated into meds on load
  history_text: string;                         // past medical history in the student's words; shown back, never scored
  family: { diabetes: boolean; heart: boolean; mental_health: boolean; other: string };
  family_text: string;                          // free text; parsed into the flags above, kept so the student can edit it
  sensors: string[]; wearables: string[];       // device names from the catalog
  sensor: "none" | "cgm" | "glucometer";        // derived from sensors; the nudge rules read this
  prefs: { gym_days: Day[]; gym_time: "" | "morning" | "midday" | "evening"; intramurals: string[]; activities: string[] };
  alcohol_grid: Partial<Record<Day, Slot[]>>;   // which days and which part of the day, typically
  alcohol: "none" | "rarely" | "weekly" | "most_days";   // derived from the grid; the day page reads this
  cycle: { tracks: boolean; last_period: string | null; typical_length: number; period_length: number; starts: string[] };
  calendar: { source: CalendarSource; name: string | null };
  counselor: { name: string; invited: string | null };
  triggers: Record<TriggerKey, boolean>;
  consent: { aggregate: boolean; counselor: boolean };
}
export type TriggerKey = "glucose" | "short_sleep" | "low_steps" | "cooped_up" | "stretched_week" | "deadline_crunch";
export const TRIGGERS: [TriggerKey, string, string][] = [
  ["glucose", "Sensor readings", "A glucose reading dropping, sliding or high after a meal, from a sensor you wear"],
  ["short_sleep", "Short nights", "Under six and a half hours on the watch"],
  ["low_steps", "Barely moved", "Very few steps by mid afternoon"],
  ["cooped_up", "Cooped up", "Several low-movement days in a row during exam weeks"],
  ["stretched_week", "Stretched week", "Two check-ins in a row below your usual"],
  ["deadline_crunch", "Deadline crunch", "Three or more due dates inside 48 hours on your calendar"],
];
export const INTRAMURALS = ["Basketball", "Flag football", "Indoor soccer", "Outdoor soccer", "Volleyball", "Softball", "Dodgeball", "Tennis", "Pickleball", "Badminton", "Spikeball", "Table tennis", "Ultimate frisbee", "Kickball", "Esports"];
export const ACTIVITIES = ["Group fitness classes", "Lifting", "Running", "Swimming", "Yoga", "Climbing wall", "Dance", "Walking", "Club sport", "Cycling"];
export const EMPTY: Profile = {
  name: "", campus: "nb", level: "undergrad", email: { address: "", verified: false, sent: false }, phone: "", push: false,
  meds: [], medications: [], history_text: "", family: { diabetes: false, heart: false, mental_health: false, other: "" }, family_text: "",
  sensors: [], wearables: [], sensor: "none", prefs: { gym_days: [], gym_time: "", intramurals: [], activities: [] },
  alcohol_grid: {}, alcohol: "none", cycle: { tracks: false, last_period: null, typical_length: 28, period_length: 5, starts: [] },
  calendar: { source: "none", name: null }, counselor: { name: "", invited: null },
  triggers: { glucose: true, short_sleep: true, low_steps: true, cooped_up: true, stretched_week: true, deadline_crunch: true },
  consent: { aggregate: false, counselor: false },
};

/** Derived fields the rest of the app reads (sensor, alcohol) and the migration from the first profile shape. */
export function normalize(p: Profile): Profile {
  const n: Profile = { ...EMPTY, ...p, email: { ...EMPTY.email, ...p.email }, prefs: { ...EMPTY.prefs, ...p.prefs }, cycle: { ...EMPTY.cycle, ...p.cycle } };
  if (!n.meds.length && n.medications?.length) n.meds = n.medications.map((name) => ({ name, dose: null, unit: "mg", times: [] }));
  if (!n.sensors.length && p.sensor && p.sensor !== "none" && !p.sensors) n.sensors = [p.sensor === "cgm" ? "Dexcom G7" : "Accu-Chek Guide"];
  const glucose = n.sensors.map((s) => DEVICES.find((d) => d.name === s)).filter((d): d is NonNullable<typeof d> => !!d && isGlucose(d));
  n.sensor = glucose.some((d) => d.kind === "cgm") ? "cgm" : glucose.length ? "glucometer" : "none";
  const slots = Object.values(n.alcohol_grid).reduce((a, v) => a + (v?.length ?? 0), 0);
  n.alcohol = slots === 0 ? "none" : slots <= 2 ? "rarely" : slots <= 6 ? "weekly" : "most_days";
  return n;
}

/** Family history in the student's own words, read for the three flags we act on. The engine's language model refines
 *  this when available (POST /profile/parse); these rules are the on-device fallback and run first. */
export function parseFamily(text: string): Profile["family"] {
  const t = text.toLowerCase();
  return {
    diabetes: /diabet|insulin|a1c|blood sugar|prediabet/.test(t),
    heart: /heart|cardiac|stroke|blood pressure|hypertens|cholesterol/.test(t),
    mental_health: /depress|anxiet|bipolar|schizo|ocd|ptsd|mental|suicid|addict|alcoholi/.test(t),
    other: text.trim(),
  };
}
const KEY = "profile";
export function loadProfile(): Profile { try { const r = localStorage.getItem(KEY); return r ? normalize(JSON.parse(r)) : EMPTY; } catch { return EMPTY; } }
export function saveProfile(p: Profile) { try { localStorage.setItem(KEY, JSON.stringify(normalize(p))); } catch { /* storage blocked */ } }

/** Day of cycle today, if tracked. Plain information for the student; nothing is diagnosed from it. */
export function cycleDay(p: Profile, today = new Date()): number | null {
  if (!p.cycle.tracks || !p.cycle.last_period) return null;
  const d = Math.floor((today.getTime() - new Date(p.cycle.last_period + "T00:00:00").getTime()) / 86400000);
  return d >= 0 ? (d % p.cycle.typical_length) + 1 : null;
}

// ---- calendar (Google Calendar or Canvas ICS export) ----
export interface CalEvent { title: string; start: string; end: string | null; location: string | null }
const KEY_CAL = "calendar";
export function loadCalendar(): CalEvent[] { try { return JSON.parse(localStorage.getItem(KEY_CAL) ?? "[]"); } catch { return []; } }
export function saveCalendar(ev: CalEvent[]) { try { localStorage.setItem(KEY_CAL, JSON.stringify(ev)); } catch { /* storage blocked */ } }

function icsDate(v: string): string | null {
  const m = v.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z?)/);
  if (!m) return null;
  const [, y, mo, d, h = "00", mi = "00", s = "00", z] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${z ? "Z" : ""}`;
  return z ? new Date(iso).toISOString() : iso;
}
/** Minimal ICS parser: VEVENT with DTSTART, DTEND, SUMMARY, LOCATION. Enough for a Google Calendar or Canvas export. */
export function parseIcs(text: string): CalEvent[] {
  const out: CalEvent[] = [];
  const lines = text.replace(/\r\n[ \t]/g, "").split(/\r?\n/);
  let cur: Partial<CalEvent> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT") { if (cur?.title && cur.start) out.push({ title: cur.title, start: cur.start, end: cur.end ?? null, location: cur.location ?? null }); cur = null; }
    else if (cur) {
      const i = line.indexOf(":"); if (i < 0) continue;
      const key = line.slice(0, i).split(";")[0], val = line.slice(i + 1);
      if (key === "DTSTART") cur.start = icsDate(val) ?? undefined;
      else if (key === "DTEND") cur.end = icsDate(val);
      else if (key === "SUMMARY") cur.title = val.replace(/\\,/g, ",");
      else if (key === "LOCATION") cur.location = val.replace(/\\,/g, ",") || null;
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}
export const SAMPLE_ICS = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART:20261013T135000Z
DTEND:20261013T151000Z
SUMMARY:01:198:111 Intro to Computer Science
LOCATION:Hill Center 114, Busch
END:VEVENT
BEGIN:VEVENT
DTSTART:20261013T180000Z
DTEND:20261013T192000Z
SUMMARY:01:830:101 General Psychology
LOCATION:Scott Hall 123, College Ave
END:VEVENT
BEGIN:VEVENT
DTSTART:20261013T220000Z
DTEND:20261013T230000Z
SUMMARY:Canvas: CS111 Problem Set 4 due
END:VEVENT
END:VCALENDAR`;
