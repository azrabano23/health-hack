// Surface: feedback. First pass by the team; Arnav polishes. Spec: docs/SOURCE_OF_TRUTH.md 2.3 and 2.4.
// Strongest dimension first, then one step, one place, one event this week, and off-campus links per lower dimension.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { Dimension, Feedback, FeedbackCard, Nudge, Resource, SignalType, WellnessEvent } from "@/api/types";
import type { PageRoute } from "@/App";
import { Card, Eyebrow, Source, Title } from "@/components/ui";
import { forEngine, loadTaps, recordTap } from "@/data/taps";
import { loadWearable, windowBefore } from "@/data/wearable";

export const route: PageRoute = { path: "/feedback", label: "Feedback", order: 3.5, owner: "team" };   // reached from Check-in and Your day

// Copied from engine/recommend/weights.yaml so the "how we rank" sheet can show them. Keep in sync by hand.
const WEIGHTS = [
  ["serves this dimension", "+1.0"], ["a place you can walk into", "+0.35"], ["the right kind of place for it", "up to +0.5"],
  ["same campus", "+0.4"], ["open now", "+0.3"], ["free with student ID", "+0.2"], ["an event inside 7 days", "+0.6"],
  ["each kilometre away", "-0.25"],
];

const BAND_WORD: Record<FeedbackCard["band"], string> = { strong: "carrying you", steady: "steady", stretched: "stretched" };

const MOOD_LINE: Record<string, string> = { great: "You said you are feeling great. Nice.", okay: "You said okay. Okay is a fine place to start.", low: "You said low. Thanks for checking in anyway; that takes something.", stressed: "You said stressed. One thing at a time below.", tired: "You said tired. Everything below can wait until after some rest." };
function latestMood(): string | null {
  try { const hist = JSON.parse(localStorage.getItem("checkin") ?? "{}")?.state?.history as { mood?: string }[] | undefined; return hist?.[hist.length - 1]?.mood ?? null; } catch { return null; }
}
/** Latest check-in from the check-in page's localStorage (zustand persist, key "checkin"), lower-cased. */
function latestScores(): Partial<Record<Dimension, number>> | null {
  try {
    const raw = localStorage.getItem("checkin");
    if (!raw) return null;
    const hist = JSON.parse(raw)?.state?.history as { date: string; scores: Record<string, number> }[] | undefined;
    const last = hist?.[hist.length - 1];
    if (!last) return null;
    const out: Partial<Record<Dimension, number>> = {};
    for (const [k, v] of Object.entries(last.scores)) if (typeof v === "number") out[k.toLowerCase() as Dimension] = v;
    return Object.keys(out).length ? out : null;
  } catch { return null; }
}

/** On-device only: if the student imported sleep data and slept short this week, the physical step talks about sleep. */
function withSleepContext(fb: Feedback): Feedback {
  const w = loadWearable();
  if (!w) return fb;
  const last = w.rows[w.rows.length - 1]?.date;
  const win = last ? windowBefore(w.rows, last) : null;
  const h = win?.sleep_h;
  if (h == null || h >= 6.5) return fb;
  return { ...fb, cards: fb.cards.map((c) => c.dimension === "physical" && c.band !== "strong"
    ? { ...c, next_step: `Your watch says about ${h.toFixed(1)} hours of sleep a night this week. Tonight, one hour earlier. The walk can wait.`, sleep_context: true }
    : c) };
}

function Dot({ score }: { score: number }) {
  const x = ((score - 1) / 4) * 100;
  return (
    <div className="mt-2" aria-label={`${score.toFixed(1)} on a 1 to 5 line`}>
      <div className="relative h-1.5 w-full rounded bg-rule">
        <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-acid" style={{ left: `${x}%` }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-teal"><span>stretched</span><span>flourishing</span></div>
    </div>
  );
}

/** "I went" and "Not for me" are the taps the twin learns from: only the kind of place and a yes or no leave the phone. */
function Went({ kind, dimension }: { kind?: string; dimension?: string }) {
  const [said, setSaid] = useState<"yes" | "no">();
  if (!kind) return null;
  if (said) return <span className="text-[13px] text-soft">{said === "yes" ? "Noted. Your ranking leans a little more this way." : "Noted. We will lean away from this kind for you."} <Link to="/trend" className="underline">See your twin</Link></span>;
  return (
    <span className="flex gap-2">
      <button onClick={() => { recordTap(kind, true, dimension); setSaid("yes"); }} className="rounded-full border-[1.5px] border-ink px-3 py-1 text-[13px] font-bold">I went</button>
      <button onClick={() => { recordTap(kind, false, dimension); setSaid("no"); }} className="rounded-full border-[1.5px] border-rule px-3 py-1 text-[13px] text-soft">Not for me</button>
    </span>
  );
}

function Place({ r, onWhy, dimension }: { r: Resource; onWhy: () => void; dimension?: string }) {
  return (
    <div className="rounded border border-rule bg-canvas p-3">
      <p className="display text-lg leading-tight">{r.name}</p>
      <p className="mt-1 text-sm text-soft">{r.why}</p>
      <p className="mt-1 font-mono text-xs text-soft">{r.online ? "online" : `${r.distance_km} km`}{r.phone ? ` · ${r.phone}` : ""}{r.address ? ` · ${r.address}` : ""}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        {r.lat != null && <Link to="/nearby" className="underline">Open map</Link>}
        <button onClick={onWhy} className="underline">Why this one</button>
        <Went kind={r.kind} dimension={dimension} />
      </div>
    </div>
  );
}

function EventRow({ e }: { e: WellnessEvent }) {
  const when = new Date(e.start).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return (
    <div className="rounded border border-rule bg-acid-soft/40 p-3">
      <Eyebrow>This week</Eyebrow>
      <p className="display text-lg leading-tight">{e.title}</p>
      <p className="mt-1 text-sm text-soft">{when} · {e.location}{e.recurring ? ` · ${e.recurring}` : ""}</p>
      <div className="mt-2 flex gap-3 text-sm">
        <a href={e.registration_url ?? e.url} target="_blank" rel="noreferrer" className="underline">{e.registration_url ? "Sign up" : "Details"}</a>
        {e.needs_confirmation && <span className="font-mono text-xs text-soft">time to confirm</span>}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const [fb, setFb] = useState<Feedback>();
  const [sample, setSample] = useState(false);
  const [why, setWhy] = useState<Resource | null>(null);
  const [nudge, setNudge] = useState<Nudge>();
  const [signal, setSignal] = useState<SignalType>();
  const [campus, setCampus] = useState<"nb" | "nwk" | "cam">("nwk");
  const ORIGIN = { nb: { lat: 40.5231, lng: -74.4578 }, nwk: { lat: 40.7405, lng: -74.1758 }, cam: { lat: 39.9478, lng: -75.124 } };
  function fire(t: SignalType) {
    setSignal(t);
    const value = t === "glucose_low" ? 68 : t === "glucose_high" ? 190 : t === "short_sleep" ? 4.5 : t === "low_steps" ? 900 : t === "cooped_up" || t === "deadline_crunch" ? 3 : undefined;
    const source = t.startsWith("glucose") ? "cgm" : t === "stretched_week" ? "checkin" : t === "deadline_crunch" ? "calendar" : "watch";
    api.nudge({ signal: { type: t, value, source }, campus, ...ORIGIN[campus] }).then(setNudge);
  }
  useEffect(() => {
    const scores = latestScores();
    setSample(!scores);
    const taps = forEngine(loadTaps());   // the kinds of place this student has said yes or no to; bounded effect on the ranking
    api.feedback(scores ? { scores, campus: "nb", ...(taps.length ? { taps } : {}) } : { scores: {} }).then((r) => setFb(withSleepContext(r)));
  }, []);
  if (!fb) return <p className="py-12 text-sm opacity-60">Reading your check-in…</p>;
  return (
    <section className="space-y-4">
      <Title>Your check-in</Title>
      {latestMood() && <p className="text-lg">{MOOD_LINE[latestMood()!]}</p>}
      <p className="text-lg">{fb.opening}</p>
      {fb.total && <p className="text-[14px] text-soft">Overall <span className="num font-bold text-ink">{fb.total.mean.toFixed(1)}</span> out of 5 across {fb.total.answered} of {fb.total.of} dimensions. A number to notice, not a grade.</p>}
      {sample && <p className="text-xs text-soft">Sample reply. <Link to="/checkin" className="underline">Take a check-in</Link> to see your own.</p>}

      {fb.cards.map((c) => (
        <Card key={c.dimension} className={c.band === "strong" ? "border-ink" : ""}>
          <div className="flex items-baseline justify-between">
            <Eyebrow>{c.dimension} · {BAND_WORD[c.band]}</Eyebrow>
            <span className="font-mono text-xs text-soft">{c.score.toFixed(1)} / 5</span>
          </div>
          <Dot score={c.score} />
          <p className="mt-3 text-base">{c.message}</p>
          {c.next_step && (
            <div className="mt-4">
              <Eyebrow>One small thing</Eyebrow>
              <p className="display text-xl leading-tight">{c.next_step}</p>
              {(c as FeedbackCard & { sleep_context?: boolean }).sleep_context && <Source text="your sleep data on this phone; not sent anywhere" />}
            </div>
          )}
          {c.event && <div className="mt-3"><EventRow e={c.event} /></div>}
          {c.resource && (
            <div className="mt-3">
              <Eyebrow>One place</Eyebrow>
              <Place r={c.resource} onWhy={() => setWhy(c.resource!)} dimension={c.dimension} />
              {!!c.alternatives?.length && (
                <p className="mt-2 text-xs text-soft">Also: {c.alternatives.map((a) => a.name).join(" · ")}</p>
              )}
            </div>
          )}
          {!!c.off_campus?.length && (
            <div className="mt-3">
              <Eyebrow>Off campus</Eyebrow>
              <ul className="mt-1 space-y-1 text-sm">
                {c.off_campus.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer" className="underline">{l.label}</a></li>)}
              </ul>
              <Source text={c.off_campus[0].source} />
            </div>
          )}
        </Card>
      ))}

      <Card className="border-ink">
        <Eyebrow>Right now, from your own devices</Eyebrow>
        <p className="mt-1 text-sm text-soft">If you connect a sensor or a watch, a reading can trigger one nudge: what is happening, one thing to do, and the nearest open place for it. Nothing is predicted; the reading is the device's. Try one:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["nb", "nwk", "cam"] as const).map((k) => <button key={k} onClick={() => { setCampus(k); setNudge(undefined); setSignal(undefined); }} className={`rounded border px-2 py-1 text-xs ${campus === k ? "border-ink bg-ink text-white" : "border-rule"}`}>{{ nb: "New Brunswick", nwk: "Newark", cam: "Camden" }[k]}</button>)}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {([["glucose_low", "sensor: glucose dropping"], ["glucose_high", "sensor: high after a meal"], ["short_sleep", "watch: short night"], ["low_steps", "watch: barely moved"], ["cooped_up", "watch: cooped up in exam week"], ["deadline_crunch", "calendar: three due dates in 48 hours"], ["stretched_week", "check-in: stretched week"]] as [SignalType, string][]).map(([t, l]) => (
            <button key={t} onClick={() => fire(t)} className={`rounded border px-3 py-1.5 text-xs ${signal === t ? "border-ink bg-acid" : "border-rule"}`}>{l}</button>))}
        </div>
        {nudge && (
          <div className="mt-3 space-y-3">
            <p className="display text-xl leading-tight">{nudge.message}</p>
            <ul className="list-disc pl-5 text-sm">{nudge.options.map((o) => <li key={o}>{o}</li>)}</ul>
            {nudge.place && (
              <div className="rounded border border-rule bg-canvas p-3">
                <p className="display text-lg leading-tight">{nudge.place.name}</p>
                <p className="mt-1 font-mono text-xs text-soft">{nudge.place.walk_min} min walk · {nudge.place.distance_km} km{nudge.place.open_now === true ? " · open now" : nudge.place.open_now === null ? " · hours not listed" : ""}{nudge.place.address ? ` · ${nudge.place.address}` : ""}</p>
                {!!nudge.alternatives.length && <p className="mt-1 text-xs text-soft">Also close: {nudge.alternatives.map((a) => `${a.name} (${a.walk_min} min)`).join(" · ")}</p>}
                <div className="mt-2"><Went kind={nudge.place.kind} /></div>
              </div>
            )}
            {nudge.event && <EventRow e={nudge.event} />}
            {nudge.safety && <p className="text-xs text-soft">{nudge.safety}</p>}
            <Source text={`${nudge.signal.source} reading${nudge.signal.value != null ? ` ${nudge.signal.value}` : ""} · ${nudge.why}`} />
          </div>
        )}
      </Card>

      <Card>
        <Eyebrow>When you want to talk to someone</Eyebrow>
        <p className="mt-1 text-sm text-soft">{fb.crisis.map((x) => `${x.name} ${x.phone}`).join(" · ")}. Any hour.</p>
      </Card>
      <Source text={`${fb.source} · Wellness Inventory items: Swarbrick et al., Psychiatric Services 2025`} />

      {why && (
        <div className="fixed inset-0 z-20 flex items-end bg-ink/40 md:items-center md:justify-center" onClick={() => setWhy(null)}>
          <div className="w-full rounded-t-md bg-surface p-5 md:max-w-md md:rounded-md" onClick={(e) => e.stopPropagation()}>
            <Eyebrow>Why {why.name}</Eyebrow>
            <p className="mt-2 text-sm">Fit comes first, distance second. The closest option is not always the best one, so we score fit and only then subtract for distance.</p>
            <p className="mt-2 text-sm">{why.why} Fit {why.fit_score}{why.score != null ? `, after distance ${why.score}` : ""}.</p>
            <ul className="mt-3 space-y-1 font-mono text-xs text-soft">
              {WEIGHTS.map(([k, v]) => <li key={k} className="flex justify-between"><span>{k}</span><span>{v}</span></li>)}
            </ul>
            <button onClick={() => setWhy(null)} className="btn btn-primary mt-4 w-full">Got it</button>
          </div>
        </div>
      )}
    </section>
  );
}
