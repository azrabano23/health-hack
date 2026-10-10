// Surface: today — owner: azra. Edit ONLY inside src/pages/today/. Spec: docs/SOURCE_OF_TRUTH.md §2.3 Home/Today
import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Attribution, Optimize, Prediction } from "@/api/types";
import type { PageRoute } from "@/App";
import { Band } from "@/components/Band";
import { Card, Eyebrow, Source } from "@/components/ui";

export const route: PageRoute = { path: "/today", label: "Today", order: 1, owner: "azra", student: true };

const LABEL: Record<string, string> = { sleep: "Last night's sleep", rhr_shift: "Resting heart rate", unexplained: "Not sure yet", exercise: "Movement" };

export default function Today() {
  const [p, setP] = useState<Prediction>();
  const [a, setA] = useState<Attribution>();
  const [o, setO] = useState<Optimize>();
  const [open, setOpen] = useState<string>();
  useEffect(() => { api.predict().then(setP); api.attribute().then(setA); api.optimize().then(setO); }, []);
  const best = o?.options[0];
  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-win p-5 text-ink">
        <Eyebrow>Nice work</Eyebrow>
        <p className="font-display text-2xl font-extrabold leading-tight">Your walk after lunch kept your peak 28 points lower.</p>
      </div>

      <Card>
        <Eyebrow>Your next meal, as your body tends to handle it</Eyebrow>
        {p ? <Band points={p.trajectory} /> : <p className="py-12 text-sm opacity-60">Loading your Band…</p>}
        {p?.uncertainty.status !== "ok" && p && (
          <p className="text-sm opacity-70">I don't know you well enough yet here: {p.uncertainty.reasons.join(", ")}.</p>
        )}
        {p && <Source text={`${p.model} · personal share ${Math.round(p.person_specific_share * 100)}%`} />}
      </Card>

      {a && (
        <Card>
          <Eyebrow>Why that one reacted the way it did</Eyebrow>
          <p className="mt-1 text-lg">{a.plain_english}</p>
          <ul className="mt-3 space-y-2">
            {a.components.map((c) => (
              <li key={c.event_type}>
                <button className="w-full text-left" onClick={() => setOpen(open === c.event_type ? undefined : c.event_type)}>
                  <div className="flex justify-between text-sm"><span>{LABEL[c.event_type] ?? c.event_type}</span>
                    <span className="font-mono">{Math.round(c.share * 100)}%</span></div>
                  <div className="mt-1 h-2 rounded-full bg-mist"><div className="h-2 rounded-full bg-band" style={{ width: `${c.share * 100}%` }} /></div>
                </button>
                {open === c.event_type && (
                  <p className="mt-1 text-sm opacity-70">About {Math.abs(c.contribution_mgdl)} points of the difference lined up with this.{" "}
                    {c.prior_source && <Source text={c.prior_source} />}</p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {best && (
        <Card className="border-line">
          <Eyebrow>One small thing</Eyebrow>
          <p className="mt-1 font-display text-xl font-semibold">{best.plain_english}</p>
          <p className="mt-2 text-sm opacity-70">Based on how your body responded before, not national averages.</p>
          {o?.evidence[0] && <Source text={o.evidence[0].source} />}
        </Card>
      )}
    </section>
  );
}
