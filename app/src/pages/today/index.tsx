// Surface: today — owner: azra. Edit ONLY inside src/pages/today/. Spec: docs/SOURCE_OF_TRUTH.md §2.3 Home/Today
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { Attribution, Optimize, Prediction } from "@/api/types";
import type { PageRoute } from "@/App";
import { Band } from "@/components/Band";
import { EVENT_ICON, Icon, Source } from "@/components/ui";

export const route: PageRoute = { path: "/today", label: "Today", order: 90, owner: "azra", hidden: true };   // parked with the glucose plan

const LABEL: Record<string, string> = { sleep: "Last night's sleep", rhr_shift: "Resting heart rate", unexplained: "Not sure yet", exercise: "Movement" };

export default function Today() {
  const [p, setP] = useState<Prediction>();
  const [a, setA] = useState<Attribution>();
  const [o, setO] = useState<Optimize>();
  const [open, setOpen] = useState<string>();
  useEffect(() => { api.predict().then(setP); api.attribute().then(setA); api.optimize().then(setO); }, []);
  const best = o?.options[0];
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <section>
      <p className="text-soft">{hello}, Maya</p>
      <h1 className="display mt-1 text-[34px]" style={{ fontVariationSettings: '"opsz" 48, "wdth" 90' }}>Your walk after lunch kept your peak 28 points lower.</h1>
      <p className="mt-3 flex items-center gap-1.5 text-[15px] text-soft"><Icon name="move" size={16} />Passion Puddle loop, 0.4 miles, 12 minutes</p>

      <div className="mt-8 rounded-[20px] border-[1.5px] border-rule bg-white p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="display text-[21px]">Your next meal</h2>
          {p && <span className="text-[14px] text-soft">Still learning you</span>}
        </div>
        <p className="mt-1 text-[15px] text-soft">The line is how your body is likely to respond. The shaded ribbon shows how sure Yugma is.</p>
        {p ? <div className="mt-3"><Band points={p.trajectory} /></div> : <div className="mt-3 h-[170px] rounded-xl bg-canvas" />}
        {p?.uncertainty.status !== "ok" && p && (
          <p className="text-[15px] text-soft">I don't know you well enough yet here: {p.uncertainty.reasons.join(", ")}.</p>
        )}
        {p && <Source text={`${p.model}, ${Math.round(p.person_specific_share * 100)}% personal`} />}
      </div>

      {a && (
        <div className="mt-8">
          <h2 className="display text-[21px]">Why one meal reacted more</h2>
          <p className="mt-1 text-soft">{a.plain_english}</p>
          <ul className="mt-4 divide-y-[1.5px] divide-rule border-y-[1.5px] border-rule">
            {a.components.map((c) => (
              <li key={c.event_type}>
                <button className="w-full cursor-pointer py-3 text-left" onClick={() => setOpen(open === c.event_type ? undefined : c.event_type)} aria-expanded={open === c.event_type}>
                  <span className="flex items-center justify-between"><span className="flex items-center gap-2"><Icon name={EVENT_ICON[c.event_type] ?? "question"} size={18} />{LABEL[c.event_type] ?? c.event_type}</span>
                    <span className="num text-soft">{Math.round(c.share * 100)}%</span></span>
                  <span className="mt-2 block h-2 rounded-full bg-acid-soft"><span className="block h-2 rounded-full bg-ink" style={{ width: `${c.share * 100}%` }} /></span>
                </button>
                {open === c.event_type && (
                  <p className="pb-3 text-[15px] text-soft">About {Math.abs(c.contribution_mgdl)} points of the difference lined up with this.
                    {c.prior_source && <Source text={c.prior_source} />}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {best && (
        <div className="mt-8 rounded-[20px] bg-ink p-6 text-white">
          <p className="text-white/70">One small thing for the next two hours</p>
          <p className="display mt-2 text-[24px]">{best.plain_english}</p>
          <p className="mt-2 text-[15px] text-white/70">Based on how your body responded before, not national averages.</p>
          <Link to="/nearby" className="btn btn-acid mt-5">Find a walk nearby</Link>
          {o?.evidence[0] && <span className="mt-3 block text-[13px] text-white/60">Source: {o.evidence[0].source}</span>}
        </div>
      )}
    </section>
  );
}
