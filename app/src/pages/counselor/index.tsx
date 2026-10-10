// Surface: counselor — owner: nitu. Edit ONLY inside src/pages/counselor/. Spec: docs/SOURCE_OF_TRUTH.md §3
// Clinician view: clinical terms allowed here only. Never raw glucose, never grades.
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/api/client";
import type { Aggregate, CounselorStudent, CounselorStudentDetail } from "@/api/types";
import type { PageRoute } from "@/App";
import { Card, Eyebrow, Title } from "@/components/ui";

export const route: PageRoute = { path: "/counselor", label: "Counselor", order: 6, owner: "nitu" };

function Trend({ title, data, keys }: { title: string; data: Record<string, number | string>[]; keys: string[] }) {
  return (
    <Card>
      <Eyebrow>{title}</Eyebrow>
      <div className="h-36">
        <ResponsiveContainer>
          <LineChart data={data}><CartesianGrid stroke="var(--color-mist)" vertical={false} />
            <XAxis dataKey="x" tick={{ fontSize: 10 }} /><YAxis width={28} tick={{ fontSize: 10 }} /><Tooltip />
            {keys.map((k, i) => <Line key={k} dataKey={k} stroke={i ? "var(--color-band)" : "var(--color-line)"} strokeWidth={2.5} dot isAnimationActive={false} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default function Counselor() {
  const [students, setStudents] = useState<CounselorStudent[]>([]);
  const [sel, setSel] = useState<string>();
  const [d, setD] = useState<CounselorStudentDetail>();
  const [agg, setAgg] = useState<Aggregate>();
  const [sent, setSent] = useState(false);
  useEffect(() => { api.counselorStudents().then((s) => { setStudents(s); setSel(s[0]?.student_id); }); api.counselorAggregate().then(setAgg); }, []);
  useEffect(() => { setSent(false); if (sel) api.counselorStudent(sel).then(setD).catch(() => setD(undefined)); }, [sel]);

  const weeks = [...new Set(agg?.cells.map((c) => c.week))];
  const dims = [...new Set(agg?.cells.map((c) => c.dimension))];
  const inv = d?.inventory.map((r, i) => ({ x: String(r.week).slice(5), ...r, sleep: d.sleep_regularity[i], act: d.activity_min[i], cv: d.glucose_stability_cv[i] })) ?? [];

  return (
    <section className="grid gap-4 md:grid-cols-[260px_1fr]">
      <div className="space-y-3">
        <Title>Caseload</Title>
        <p className="text-xs opacity-60">Only students who opted in appear here.</p>
        {students.map((s) => (
          <button key={s.student_id} onClick={() => setSel(s.student_id)}
            className={`w-full rounded-2xl border p-3 text-left ${sel === s.student_id ? "border-line" : "border-mist"}`}>
            <p className="display">{s.student_id}</p>
            <p className="font-mono text-[11px] opacity-60">shared: {s.scopes.join(", ")}</p>
          </button>))}
      </div>

      <div className="space-y-4">
        {d ? (<>
          <Card className="border-line">
            <Eyebrow>Visit prep · since last check-in</Eyebrow>
            <p className="mt-1">Sleep regularity {d.sleep_regularity[0]} → {d.sleep_regularity.at(-1)}, activity {d.activity_min[0]} → {d.activity_min.at(-1)} min/wk,
              glucose variability up. {d.flags[0]?.note}</p>
            {d.flags.map((f) => <p key={f.note} className="mt-2 text-sm"><span className="rounded-full bg-win px-2 py-0.5 font-mono text-[11px]">needs a look</span> {f.window}: {f.note}</p>)}
            <button onClick={() => setSent(true)} className="mt-3 btn btn-primary text-sm">
              {sent ? "Reconnect message sent" : "Send reconnect message"}</button>
            {sent && <p className="mt-1 text-xs opacity-60">"Checking in — want to grab 20 minutes this week?" · logged</p>}
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Trend title="Wellness inventory by dimension" data={inv} keys={["emotional", "physical", "social"]} />
            <Trend title="Sleep regularity" data={inv} keys={["sleep"]} />
            <Trend title="Activity (min/week)" data={inv} keys={["act"]} />
            <Trend title="Glucose variability (CV)" data={inv} keys={["cv"]} />
          </div>
          <Card><Eyebrow>Scales entered in clinic</Eyebrow>
            {d.scales.map((s) => <p key={s.date} className="font-mono text-sm">{s.name} · {s.date} · {s.score}</p>)}</Card>
        </>) : <p className="opacity-60">Pick a student.</p>}

        {agg && (
          <Card>
            <Eyebrow>Campus aggregate · k ≥ {agg.k_min} per cell</Eyebrow>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm"><thead><tr><th className="text-left font-normal opacity-60">Dimension</th>{weeks.map((w) => <th key={w} className="font-mono text-[11px] font-normal">{w.slice(5)}</th>)}</tr></thead>
                <tbody>{dims.map((dm) => (<tr key={dm}><td className="py-1 capitalize">{dm}</td>
                  {weeks.map((w) => { const c = agg.cells.find((x) => x.dimension === dm && x.week === w);
                    return <td key={w} className="p-1 text-center"><span className="block rounded-md py-1 font-mono text-xs text-ink"
                      style={{ background: `color-mix(in srgb, var(--color-band) ${((c?.mean ?? 1) - 1) * 25}%, var(--color-mist))` }}>{c?.mean.toFixed(1)}</span></td>; })}
                </tr>))}</tbody></table>
            </div>
          </Card>)}
      </div>
    </section>
  );
}
