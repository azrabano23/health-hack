// The signature element: the person's line with its 90% credible ribbon. Shared by every surface.
// Owner: Nitu. Others: use it, don't edit it (open an issue/ask).
import { Area, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { Point } from "@/api/types";

export function Band({ points, observed, height = 160 }: { points: Point[]; observed?: Point[]; height?: number }) {
  const data = points.map((p, i) => ({
    t: p.t_min, g: p.g, band: p.lo != null && p.hi != null ? [p.lo, p.hi] : undefined, obs: observed?.[i]?.g,
  }));
  return (
    <div role="img" aria-label="Predicted glucose with uncertainty band" style={{ height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="t" tickFormatter={(t) => `${t}m`} tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
          <YAxis domain={["dataMin - 10", "dataMax + 10"]} hide />
          <Area dataKey="band" stroke="none" fill="var(--color-band)" fillOpacity={0.35} isAnimationActive={false} />
          <Line dataKey="g" stroke="var(--color-line)" strokeWidth={2.5} dot={false} />
          {observed && <Line dataKey="obs" stroke="var(--color-ink)" strokeDasharray="4 3" dot={false} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
