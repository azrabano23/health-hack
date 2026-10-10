// Surface: eat — owner: azra. Edit ONLY inside src/pages/eat/. Spec: docs/SOURCE_OF_TRUTH.md §2.3 Eat
import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { NextMeal } from "@/api/types";
import type { PageRoute } from "@/App";
import { Card, Eyebrow, Title } from "@/components/ui";

export const route: PageRoute = { path: "/eat", label: "Eat", order: 2, owner: "azra", student: true };

export default function Eat() {
  const [m, setM] = useState<NextMeal>();
  useEffect(() => { api.nextMeal().then(setM); }, []);
  const byPeak = m ? [...m.ranked].sort((a, b) => (a.expected_peak ?? 0) - (b.expected_peak ?? 0)) : [];
  const word = (i: number) => (i === 0 ? "steadier for you" : i === byPeak.length - 1 ? "spikier for you" : "in the middle");
  return (
    <section className="space-y-4">
      <Title>Today at the dining hall</Title>
      {m && (
        <Card className="border-line">
          <Eyebrow>Most useful to learn from</Eyebrow>
          <p className="display text-xl">{m.pick.label}</p>
          <p className="text-sm opacity-70">{m.pick.why}</p>
        </Card>
      )}
      <ul className="space-y-3">
        {byPeak.map((it, i) => (
          <li key={it.id}>
            <Card className="flex items-center justify-between">
              <div>
                <p className="display text-lg">{it.label}</p>
                <p className="text-sm opacity-70">{word(i)}</p>
              </div>
              {it.carbon_tag && <span className="rounded-full border border-mist px-3 py-1 font-mono text-xs">{it.carbon_tag} carbon</span>}
            </Card>
          </li>
        ))}
      </ul>
      <p className="text-xs opacity-60">Placement, not pressure: best matches come first. You choose.</p>
    </section>
  );
}
