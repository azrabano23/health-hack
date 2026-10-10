// Surface: eat — owner: azra. Edit ONLY inside src/pages/eat/. Spec: docs/SOURCE_OF_TRUTH.md §2.3 Eat
import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { NextMeal } from "@/api/types";
import type { PageRoute } from "@/App";
import { Icon, PageHead } from "@/components/ui";

export const route: PageRoute = { path: "/eat", label: "Eat", order: 2, owner: "azra" };   // parked with the glucose plan; not on the phone tab bar

export default function Eat() {
  const [m, setM] = useState<NextMeal>();
  useEffect(() => { api.nextMeal().then(setM); }, []);
  const byPeak = m ? [...m.ranked].sort((a, b) => (a.expected_peak ?? 0) - (b.expected_peak ?? 0)) : [];
  const word = (i: number) => (i === 0 ? "steadier for you" : i === byPeak.length - 1 ? "spikier for you" : "in the middle");
  // Steadiness shown by a ribbon's width, never by colour.
  const Ribbon = ({ i }: { i: number }) => {
    const w = byPeak.length > 1 ? 4 + (i / (byPeak.length - 1)) * 14 : 8;
    return <svg width="56" height="28" viewBox="0 0 56 28" aria-hidden><path d={`M2 14 C 16 ${14 - w}, 30 ${14 - w}, 54 14`} stroke="var(--color-acid)" strokeWidth={w} fill="none" strokeLinecap="round" /><path d={`M2 14 C 16 ${14 - w / 1.6}, 30 ${14 - w / 1.6}, 54 14`} stroke="var(--color-ink)" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>;
  };
  return (
    <section>
      <PageHead kicker="Busch Dining Hall, lunch" title="What's on today" sub="Ranked for how your body tends to respond, steadiest first. You choose." />
      {m && (
        <div className="mt-6 rounded-[20px] border-[1.5px] border-ink bg-white p-5">
          <p className="text-[15px] text-soft">Worth trying today</p>
          <p className="display mt-1 text-[24px]">{m.pick.label}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-soft">{m.pick.why}</p>
        </div>
      )}
      <ol className="mt-8 divide-y-[1.5px] divide-rule border-y-[1.5px] border-rule">
        {byPeak.map((it, i) => (
          <li key={it.id} className="flex items-center gap-4 py-4">
            <div className="min-w-0 flex-1">
              <p className="display text-[19px]">{it.label}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[15px] text-soft">{word(i)}
                {it.carbon_tag && <span className="inline-flex items-center gap-1"><Icon name="leaf" size={14} />{it.carbon_tag} carbon</span>}</p>
            </div>
            <Ribbon i={i} />
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[14px] text-soft">A thinner ribbon means a steadier response for you.</p>
    </section>
  );
}
