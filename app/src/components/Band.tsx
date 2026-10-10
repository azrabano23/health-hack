// The signature element: the person's line with its 90% credible ribbon. Shared by every surface.
// Owner: Nitu. Others: use it, don't edit it.
import { Area, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { Point } from "@/api/types";

export function Band({ points, observed, height = 170, animate = true }: { points: Point[]; observed?: Point[]; height?: number; animate?: boolean }) {
  const data = points.map((p, i) => ({
    t: p.t_min, g: p.g, band: p.lo != null && p.hi != null ? [p.lo, p.hi] : undefined, obs: observed?.[i]?.g,
  }));
  return (
    <div role="img" aria-label="Glucose line with its uncertainty band" style={{ height }} className={animate ? "draw" : ""}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="bandfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-band)" stopOpacity={0.55} />
              <stop offset="100%" stopColor="var(--color-band)" stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" tickFormatter={(t) => (t % 30 === 0 ? `${t}m` : "")} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-soft)" }} />
          <YAxis domain={["dataMin - 12", "dataMax + 12"]} hide />
          <Area dataKey="band" stroke="none" fill="url(#bandfill)" isAnimationActive={false} />
          <Line dataKey="g" stroke="var(--color-line)" strokeWidth={3} dot={false} strokeLinecap="round" isAnimationActive={false} />
          {observed && <Line dataKey="obs" stroke="var(--color-ink)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
