// Surface: counselor — owner: nitu. Edit ONLY inside src/pages/counselor/. Spec: docs/SOURCE_OF_TRUTH.md §3
// Clinician view: clinical terms allowed here only. Never raw glucose, never grades.
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/api/client";
import type { Aggregate, CounselorStudent, CounselorStudentDetail } from "@/api/types";
import type { PageRoute } from "@/App";
import { Card, Eyebrow, Title } from "@/components/ui";

export const route: PageRoute = { path: "/counselor", label: "Counselor", order: 93, owner: "nitu", hidden: true };   // glucose-era; the staff view replaces it

function Trend({ title, data, keys }: { title: string; data: Record<string, number | string>[]; keys: string[] }) {
  return (
    <Card>
      <Eyebrow>{title}</Eyebrow>
      <div className="h-36">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}><CartesianGrid stroke="var(--color-rule)" vertical={false} />
            <XAxis dataKey="x" tick={{ fontSize: 11, fill: "var(--color-soft)" }} axisLine={false} tickLine={false} /><YAxis width={34} tick={{ fontSize: 11, fill: "var(--color-soft)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-rule)", fontSize: 12 }} />
            {keys.map((k, i) => <Line key={k} dataKey={k} stroke={["var(--color-ink)", "#8f95e6", "#b9a3c9"][i] ?? "var(--color-ink)"} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />)}
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
        <p className="readout">CAPS counselor view</p>
        <Title>Caseload</Title>
        <p className="text-sm text-soft">Only students who opted in appear here.</p>
        {students.map((s) => (
          <button key={s.student_id} onClick={() => setSel(s.student_id)}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition ${sel === s.student_id ? "border-ink bg-white shadow-sm" : "border-rule bg-white/60 hover:bg-white"}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-acid text-sm font-semibold">{s.student_id.slice(-2)}</span>
            <span className="min-w-0"><span className="display block">{s.student_id}</span>
            <span className="block truncate text-xs text-soft">Shared: {s.scopes.join(", ")}</span></span>
          </button>))}
      </div>

      <div className="space-y-4">
        {d ? (<>
          <Card className="!border-ink/20">
            <Eyebrow>Visit prep since the last check-in</Eyebrow>
            <p className="mt-1">Sleep regularity {d.sleep_regularity[0]} → {d.sleep_regularity.at(-1)}, activity {d.activity_min[0]} → {d.activity_min.at(-1)} min/wk,
              glucose variability up. {d.flags[0]?.note}</p>
            {d.flags.map((f) => <p key={f.note} className="mt-2 text-sm"><span className="rounded-full bg-acid px-2.5 py-0.5 text-[11px] font-semibold">Needs a look</span> {f.window}: {f.note}</p>)}
            <button onClick={() => setSent(true)} className="btn btn-primary mt-4 !py-2.5 text-sm">
              {sent ? "Reconnect message sent" : "Send reconnect message"}</button>
            {sent && <p className="mt-1 text-xs text-soft">Sent and logged: "Checking in. Want to grab 20 minutes this week?"</p>}
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Trend title="Wellness inventory by dimension" data={inv} keys={["emotional", "physical", "social"]} />
            <Trend title="Sleep regularity" data={inv} keys={["sleep"]} />
            <Trend title="Activity (min/week)" data={inv} keys={["act"]} />
            <Trend title="Glucose variability (CV)" data={inv} keys={["cv"]} />
          </div>
          <Card><Eyebrow>Scales entered in clinic</Eyebrow>
            {d.scales.map((s) => <p key={s.date} className="num flex justify-between border-t border-rule py-2 text-sm first:border-0"><span>{s.name}, {s.date}</span><span className="font-bold">{s.score}</span></p>)}</Card>
        </>) : <p className="opacity-60">Pick a student.</p>}

        {agg && (
          <Card>
            <Eyebrow>Campus aggregate, at least {agg.k_min} students per cell</Eyebrow>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm"><thead><tr><th className="text-left font-normal opacity-60">Dimension</th>{weeks.map((w) => <th key={w} className="pb-1 text-[11px] font-medium text-soft">{w.slice(5)}</th>)}</tr></thead>
                <tbody>{dims.map((dm) => (<tr key={dm}><td className="py-1 capitalize">{dm}</td>
                  {weeks.map((w) => { const c = agg.cells.find((x) => x.dimension === dm && x.week === w);
                    return <td key={w} className="p-1 text-center"><span className="num block rounded-lg py-1.5 text-xs font-medium text-ink"
                      style={{ background: `color-mix(in srgb, var(--color-band) ${((c?.mean ?? 1) - 1) * 25}%, var(--color-mist))` }}>{c?.mean.toFixed(1)}</span></td>; })}
                </tr>))}</tbody></table>
            </div>
          </Card>)}
      </div>
    </section>
  );
}
