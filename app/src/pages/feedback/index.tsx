// Surface: feedback. First pass by the team; Arnav polishes. Spec: docs/SOURCE_OF_TRUTH.md 2.3 and 2.4.
// Strongest dimension first, then one step, one place, one event this week, and off-campus links per lower dimension.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { Dimension, Feedback, FeedbackCard, Resource, WellnessEvent } from "@/api/types";
import type { PageRoute } from "@/App";
import { Card, Eyebrow, Source, Title } from "@/components/ui";

export const route: PageRoute = { path: "/feedback", label: "Feedback", order: 3.5, owner: "team", student: true };

// Copied from engine/recommend/weights.yaml so the "how we rank" sheet can show them. Keep in sync by hand.
const WEIGHTS = [
  ["serves this dimension", "+1.0"], ["a place you can walk into", "+0.35"], ["the right kind of place for it", "up to +0.5"],
  ["same campus", "+0.4"], ["open now", "+0.3"], ["free with student ID", "+0.2"], ["an event inside 7 days", "+0.6"],
  ["each kilometre away", "-0.25"],
];

const BAND_WORD: Record<FeedbackCard["band"], string> = { strong: "carrying you", steady: "steady", stretched: "stretched" };

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

function Place({ r, onWhy }: { r: Resource; onWhy: () => void }) {
  return (
    <div className="rounded border border-rule bg-canvas p-3">
      <p className="display text-lg leading-tight">{r.name}</p>
      <p className="mt-1 text-sm text-soft">{r.why}</p>
      <p className="mt-1 font-mono text-xs text-soft">{r.online ? "online" : `${r.distance_km} km`}{r.phone ? ` · ${r.phone}` : ""}{r.address ? ` · ${r.address}` : ""}</p>
      <div className="mt-2 flex gap-3 text-sm">
        {r.lat != null && <Link to="/nearby" className="underline">Open map</Link>}
        <button onClick={onWhy} className="underline">Why this one</button>
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
  useEffect(() => {
    const scores = latestScores();
    setSample(!scores);
    api.feedback(scores ? { scores, campus: "nb" } : { scores: {} }).then(setFb);
  }, []);
  if (!fb) return <p className="py-12 text-sm opacity-60">Reading your check-in…</p>;
  return (
    <section className="space-y-4">
      <Title>Your check-in</Title>
      <p className="text-lg">{fb.opening}</p>
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
            </div>
          )}
          {c.event && <div className="mt-3"><EventRow e={c.event} /></div>}
          {c.resource && (
            <div className="mt-3">
              <Eyebrow>One place</Eyebrow>
              <Place r={c.resource} onWhy={() => setWhy(c.resource!)} />
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
