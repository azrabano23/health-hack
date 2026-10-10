// The signature element: ink line on a yellow credible-interval ribbon. Shared by every surface.
// Owner: Nitu. Others: use it, don't edit it.
import { Area, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { Point } from "@/api/types";

export function Band({ points, observed, height = 170, animate = true, dark = false }:
  { points: Point[]; observed?: Point[]; height?: number; animate?: boolean; dark?: boolean }) {
  const data = points.map((p, i) => ({
    t: p.t_min, g: p.g, band: p.lo != null && p.hi != null ? [p.lo, p.hi] : undefined, obs: observed?.[i]?.g,
  }));
  const line = dark ? "#ffffff" : "var(--color-ink)";
  return (
    <div role="img" aria-label="Glucose line with its uncertainty band" style={{ height }} className={animate ? "draw" : ""}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <XAxis dataKey="t" tickFormatter={(t) => (t % 30 === 0 ? `${t}m` : "")} tickLine={false} axisLine={false}
            tick={{ fontSize: 10, fill: dark ? "#9aa3a8" : "var(--color-teal)", fontFamily: "var(--font-mono)" }} />
          <YAxis domain={["dataMin - 12", "dataMax + 12"]} hide />
          <Area dataKey="band" stroke="none" fill="var(--color-acid)" fillOpacity={dark ? 0.85 : 0.75} isAnimationActive={false} />
          <Line dataKey="g" stroke={line} strokeWidth={2.5} dot={false} strokeLinecap="round" isAnimationActive={false} />
          {observed && <Line dataKey="obs" stroke="var(--color-teal)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
