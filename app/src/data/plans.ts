// Planning on Your day: which events the student says they are going to, and the counselor's suggestions for the week.
// Suggestions are rules over the student's own preferences, calendar, watch and the Wellness Calendar; the engine's model
// writes the words when it is configured (Chat). Nothing here predicts; it arranges what the student already said they want.
import type { WellnessEvent } from "@/api/types";
import type { CalEvent, Day, Profile } from "@/data/profile";
import type { DayRow } from "@/data/wearable";
import eventsJson from "../../../data/wellness_events.json";
import placesJson from "../../../data/rutgers_resources.json";

const KEY = "plans";
export function loadGoing(): string[] { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } }
export function toggleGoing(id: string): string[] { const g = loadGoing(); const n = g.includes(id) ? g.filter((x) => x !== id) : [...g, id]; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* ignore */ } return n; }

export const EVENTS = (eventsJson as { events: WellnessEvent[] }).events;
type Place = { id: string; name: string; campus: string; kind?: string; lat: number | null; lng: number | null; url?: string | null };
const PLACES = (placesJson as { resources: Place[] }).resources;

export function upcoming(campus: string, from: string, days = 14): WellnessEvent[] {
  const a = new Date(from + "T00:00:00").getTime(), b = a + days * 86400000;
  return EVENTS.filter((e) => e.campus === campus && new Date(e.start).getTime() >= a && new Date(e.start).getTime() <= b).sort((x, y) => x.start.localeCompare(y.start));
}

const DAY_IDX: Record<Day, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const dayOf = (iso: string) => new Date(iso).getDay();
const hh = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export interface Suggestion { when: string; what: string; why: string; where?: string; link?: string }

/** The counselor's plan for the week: gym slots that fit the timetable, sign-ups for the sports the student named,
 *  the events they said they are going to, and one honest adjustment when the watch says the week is short on sleep. */
export function suggest(p: Profile, cal: CalEvent[], wear: DayRow[] | null, going: string[], today: string): Suggestion[] {
  const out: Suggestion[] = [];
  const rec = PLACES.find((r) => r.campus === p.campus && r.kind === "recreation");
  const sleep7 = wear ? wear.filter((r) => r.date <= today).slice(-7).map((r) => r.sleep_h).filter((v): v is number => v != null) : [];
  const shortWeek = sleep7.length >= 3 && sleep7.reduce((a, b) => a + b, 0) / sleep7.length < 6.5;
  for (const d of p.prefs.gym_days) {
    const classes = cal.filter((c) => dayOf(c.start) === DAY_IDX[d] && !c.title.startsWith("Canvas")).sort((a, b) => a.start.localeCompare(b.start));
    const first = classes[0], last = classes[classes.length - 1];
    if (p.prefs.gym_time === "morning" && first) {
      const t = new Date(first.start); const start = new Date(t.getTime() - 80 * 60000);
      out.push({ when: `${d} ${hh(start.toISOString())}`, what: shortWeek && d === "Thu" ? "Skip the morning gym this once; sleep is short this week" : `Gym before ${first.title.split(" ").slice(0, 3).join(" ")}`, why: shortWeek && d === "Thu" ? `Your watch averages ${(sleep7.reduce((a, b) => a + b, 0) / sleep7.length).toFixed(1)} h this week. A lifted morning beats a forced one.` : `Fifty minutes, then a ten minute walk to ${first.location ?? "class"}.`, where: rec?.name, link: rec?.url ?? undefined });
    } else if (p.prefs.gym_time === "evening" && last) {
      const t = new Date(last.end ?? last.start); const start = new Date(t.getTime() + 30 * 60000);
      out.push({ when: `${d} ${hh(start.toISOString())}`, what: `Gym after ${last.title.split(" ").slice(0, 3).join(" ")}`, why: "Thirty minutes to get there and change, then the floor is quietest before dinner.", where: rec?.name, link: rec?.url ?? undefined });
    } else if (!classes.length) {
      out.push({ when: `${d}, any time`, what: "Gym on a free day", why: "No classes on the calendar; mornings are the emptiest at the rec centre.", where: rec?.name, link: rec?.url ?? undefined });
    } else {
      const gap = classes.length > 1 ? classes.map((c, i) => i ? (new Date(c.start).getTime() - new Date(classes[i - 1].end ?? classes[i - 1].start).getTime()) / 60000 : 0) : [];
      const gi = gap.findIndex((g) => g >= 110);
      out.push({ when: gi > 0 ? `${d} after ${classes[gi - 1].title.split(" ").slice(0, 3).join(" ")}` : `${d} midday`, what: "Gym in the gap", why: gi > 0 ? `${Math.round(gap[gi])} minutes free between classes.` : "Between the morning and afternoon blocks.", where: rec?.name, link: rec?.url ?? undefined });
    }
  }
  for (const sport of p.prefs.intramurals) {
    out.push({ when: "This week", what: `${sport} intramural sign-up`, why: "Rutgers Recreation runs leagues on IMLeagues each semester; registration closes early in the season.", where: "recreation.rutgers.edu", link: "https://recreation.rutgers.edu/" });
  }
  for (const id of going) {
    const e = EVENTS.find((x) => x.id === id);
    if (!e) continue;
    const sameDay = cal.filter((c) => c.start.slice(0, 10) === e.start.slice(0, 10) && !c.title.startsWith("Canvas"));
    const before = sameDay.filter((c) => (c.end ?? c.start) <= e.start).pop();
    out.push({ when: `${new Date(e.start).toLocaleDateString([], { weekday: "short" })} ${hh(e.start)}`, what: e.title.split(" (")[0], why: before ? `Right after ${before.title.split(" ").slice(0, 3).join(" ")}${before.location ? ` in ${before.location}` : ""}; leave when it ends.` : "Nothing on the calendar before it; go early.", where: e.location, link: e.registration_url ?? e.url ?? undefined });
  }
  if (p.family.diabetes && p.sensor !== "none") out.push({ when: "Every day", what: "A walk after lunch", why: "With your family history and a sensor on, a ten minute walk after the biggest meal is the single steadiest habit.", where: PLACES.find((r) => r.campus === p.campus && r.kind === "green")?.name });
  return out.slice(0, 8);
}
