// About you: the inputs a student chooses to give. All optional, all on this phone, none sent to the aggregate.
// The engine only ever sees a campus, a dimension score, a signal type, or a message the student typed.
export interface Profile {
  name: string; campus: "nb" | "nwk" | "cam"; level: "undergrad" | "grad";
  medications: string[];                       // free text, e.g. "metformin", "sertraline"; used only to phrase nudges kindly
  family: { diabetes: boolean; heart: boolean; mental_health: boolean; other: string };
  sensor: "none" | "cgm" | "glucometer";       // a glucose sensor the student wears; readings come from it, never predicted
  cycle: { tracks: boolean; last_period: string | null; typical_length: number };
  alcohol: "none" | "rarely" | "weekly" | "most_days";
  calendar: { source: "none" | "ics"; name: string | null };
  consent: { aggregate: boolean; counselor: boolean };
}
export const EMPTY: Profile = {
  name: "", campus: "nb", level: "undergrad", medications: [], family: { diabetes: false, heart: false, mental_health: false, other: "" },
  sensor: "none", cycle: { tracks: false, last_period: null, typical_length: 28 }, alcohol: "none", calendar: { source: "none", name: null },
  consent: { aggregate: false, counselor: false },
};
const KEY = "profile";
export function loadProfile(): Profile { try { const r = localStorage.getItem(KEY); return r ? { ...EMPTY, ...JSON.parse(r) } : EMPTY; } catch { return EMPTY; } }
export function saveProfile(p: Profile) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage blocked */ } }

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
