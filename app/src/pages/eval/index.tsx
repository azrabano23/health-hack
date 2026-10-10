// Surface: eval — owner: nitu. Edit ONLY inside src/pages/eval/. Spec: docs/SOURCE_OF_TRUTH.md §4 / WORK_SPLIT A7
import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { EvalPayload } from "@/api/types";
import type { PageRoute } from "@/App";
import { Band } from "@/components/Band";
import { Card, Eyebrow, Title } from "@/components/ui";

export const route: PageRoute = { path: "/eval", label: "Predicted vs observed", order: 7, owner: "nitu" };

export default function Eval() {
  const [e, setE] = useState<EvalPayload & { note?: string }>();
  const [i, setI] = useState(0);
  useEffect(() => { api.eval().then(setE); }, []);
  if (!e) return <p>Loading…</p>;
  const p = e.participants[i];
  const models = Object.keys(e.summary);
  const metricKeys = [...new Set(models.flatMap((m) => Object.keys(e.summary[m])))];
  return (
    <section className="space-y-4">
      <Title>Predicted vs observed, Day 8</Title>
      {e.note && <p className="rounded-2xl border border-acid bg-acid-soft px-4 py-3 text-sm">{e.note}</p>}
      <div className="flex gap-2 overflow-x-auto">
        {e.participants.map((x, k) => (
          <button key={x.id} onClick={() => setI(k)} aria-pressed={k === i} className="chip shrink-0">{x.id}, {x.group}</button>))}
      </div>
      <Card>
        <Eyebrow>Held-out meal: solid line is predicted, ribbon is the 90% interval, dashed line is observed</Eyebrow>
        <Band points={p.day8.predicted} observed={p.day8.observed} height={240} />
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <Eyebrow>This meal</Eyebrow>
          <table className="mt-2 w-full text-sm"><thead><tr className="text-left opacity-60"><th>Metric</th><th>Observed</th><th>Predicted (90%)</th></tr></thead>
            <tbody>{Object.entries(p.day8.metrics).map(([k, m]) => (
              <tr key={k} className="border-t border-mist num"><td className="py-1">{k}</td><td>{m.obs}</td><td>{m.pred.value} ({m.pred.lo}–{m.pred.hi})</td></tr>))}</tbody></table>
        </Card>
        <Card>
          <Eyebrow>RMSE in mg/dL across all participants (lower is better)</Eyebrow>
          <table className="mt-2 w-full text-sm"><thead><tr className="text-left opacity-60"><th>Metric</th>{models.map((m) => <th key={m}>{m}</th>)}</tr></thead>
            <tbody>{metricKeys.map((k) => (<tr key={k} className="border-t border-mist num"><td className="py-1">{k.replace("rmse_", "")}</td>
              {models.map((m) => <td key={m}>{e.summary[m][k] ?? "–"}</td>)}</tr>))}</tbody></table>
        </Card>
      </div>
      <Card>
        <Eyebrow>Parameter recovery on synthetic people (R²)</Eyebrow>
        <ul className="mt-2 space-y-2">
          {e.recovery.params.map((n, k) => (<li key={n} className="flex items-center gap-3 text-sm">
            <span className="w-14 num">{n}</span>
            <span className="h-2 flex-1 rounded-full bg-rule"><span className="block h-2 rounded-full bg-ink/80" style={{ width: `${Math.max(0, e.recovery.r2[k]) * 100}%` }} /></span>
            <span className="num">{e.recovery.r2[k]}</span></li>))}
        </ul>
      </Card>
    </section>
  );
}
