// The student's twin as a body. Spec: docs/SOURCE_OF_TRUTH.md 2.6.
// A front-facing silhouette; each of the eight Wellness Inventory dimensions is anchored to a body region and its fill
// says how the latest check-in sits against the student's own usual. Grey = about your usual, scarlet = below (deeper
// the further below, capped at twice the band), pink = above, outline only = no check-in yet. Nothing predicted.
import type { Dimension, TwinRow } from "@/api/types";

const NAME: Record<Dimension, string> = { physical: "Physical", emotional: "Emotional", intellectual: "Intellectual", financial: "Financial",
  social: "Social", spiritual: "Spiritual", occupational: "Occupational", environmental: "Environmental" };

// Drawing space: 130 wide, 340 tall, body centred on x = 65.
const W = 130, H = 340;
type Anchor = { dim: Dimension; side: "left" | "right"; x: number; y: number };
// Where each dimension lives on the body, and which side its label sits on. Ordered top to bottom per side.
const ANCHORS: Anchor[] = [
  { dim: "intellectual", side: "left", x: 46.6, y: 17.6 },   // top of the head
  { dim: "emotional", side: "right", x: 89.7, y: 44 },      // the face
  { dim: "social", side: "left", x: 19, y: 92 },            // shoulders and arms, reaching out
  { dim: "spiritual", side: "right", x: 81, y: 112 },       // centre of the chest, the breath
  { dim: "financial", side: "left", x: 41, y: 170 },        // hip pocket
  { dim: "occupational", side: "right", x: 126, y: 201 },   // the hands
  { dim: "physical", side: "left", x: 38, y: 250 },         // torso and legs
  { dim: "environmental", side: "right", x: 110, y: 324.5 }, // the ground under the feet
];

type Tone = { fill: string; opacity: number; stroke: string; dash?: string };
function tone(r?: TwinRow): Tone {
  if (!r) return { fill: "#fff", opacity: 1, stroke: "var(--color-soft)", dash: "3 3" };
  if (r.word === "about your usual") return { fill: "var(--color-rule)", opacity: 1, stroke: "var(--color-ink)" };
  if (r.word === "above your usual") return { fill: "var(--color-acid)", opacity: 1, stroke: "var(--color-ink)" };
  const depth = Math.min(1, Math.abs(r.deviation) / (2 * Math.max(0.1, r.band)));
  return { fill: "var(--color-scarlet)", opacity: 0.3 + 0.45 * depth, stroke: "var(--color-ink)" };
}
const paint = (t: Tone) => ({ fill: t.fill, fillOpacity: t.opacity, stroke: t.stroke, strokeWidth: 1.4, strokeDasharray: t.dash, strokeLinejoin: "round" as const });

function words(r?: TwinRow) {
  if (!r) return "no check-in yet";
  return `now ${r.latest.toFixed(1)}, usually ${r.usual.toFixed(1)}, ${r.word}`;
}

function Label({ a, r }: { a: Anchor; r?: TwinRow }) {
  const left = a.side === "left";
  return (
    <div className={`absolute flex w-full -translate-y-1/2 items-center gap-1 ${left ? "right-0 flex-row-reverse text-right" : "left-0"}`} style={{ top: `${(a.y / H) * 100}%` }}>
      <span aria-hidden className="h-px w-2 shrink-0 bg-ink" />
      <span className="min-w-0 leading-[1.25]">
        <span className="block text-[12px] font-bold md:text-[13px]">{NAME[a.dim]}</span>
        {r ? (
          <span className="num block text-[11px] text-soft">
            <span className="block whitespace-nowrap md:inline">now <span className="font-bold text-ink">{r.latest.toFixed(1)}</span></span>
            <span className="hidden md:inline"> · </span>
            <span className="block whitespace-nowrap md:inline">usually <span className="font-bold text-ink">{r.usual.toFixed(1)}</span></span>
          </span>
        ) : <span className="block whitespace-nowrap text-[11px] text-soft">no check-in yet</span>}
      </span>
    </div>
  );
}

export function TwinBody({ rows }: { rows: TwinRow[] }) {
  const by = Object.fromEntries(rows.map((r) => [r.dimension, r])) as Partial<Record<Dimension, TwinRow>>;
  const t = (d: Dimension) => paint(tone(by[d]));
  const label = ANCHORS.map((a) => `${NAME[a.dim]} ${words(by[a.dim])}`).join("; ");
  // Torso and legs as one outline: shoulders, a slight taper to the hips, two legs with rounded feet.
  const body = "M47 74 H83 Q95 74 95 86 L92 186 V300 Q92 312 80 312 Q68 312 68 300 V204 Q65 196 62 204 V300 Q62 312 50 312 Q38 312 38 300 V186 L35 86 Q35 74 47 74 Z";

  return (
    <figure className="mx-auto w-full max-w-[520px]">
      <div role="img" aria-label={`Your twin: ${label}`} className="-mx-3 grid grid-cols-[1fr_96px_1fr] items-stretch gap-0 pb-4 pt-5 md:mx-0 md:grid-cols-[1fr_128px_1fr]">
        <div className="relative">{ANCHORS.filter((a) => a.side === "left").map((a) => <Label key={a.dim} a={a} r={by[a.dim]} />)}</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full overflow-visible" aria-hidden>
          <defs>
            <clipPath id="twin-crown"><rect x={0} y={0} width={W} height={32} /></clipPath>
          </defs>
          {/* ground: environmental */}
          <rect x={20} y={322} width={90} height={5} rx={2.5} {...t("environmental")} />
          {/* torso and legs: physical */}
          <path d={body} {...t("physical")} />
          {/* arms: social */}
          <rect x={-8} y={-8} width={16} height={118} rx={8} transform="translate(26 82) rotate(6)" {...t("social")} />
          <rect x={-8} y={-8} width={16} height={118} rx={8} transform="translate(104 82) rotate(-6)" {...t("social")} />
          {/* hands: occupational */}
          <circle cx={13.3} cy={201} r={10} {...t("occupational")} />
          <circle cx={116.7} cy={201} r={10} {...t("occupational")} />
          {/* chest: spiritual */}
          <circle cx={65} cy={112} r={16} {...t("spiritual")} />
          {/* hip pocket: financial */}
          <rect x={41} y={158} width={18} height={24} rx={5} {...t("financial")} />
          {/* neck, no dimension */}
          <rect x={57} y={58} width={16} height={18} rx={4} fill="#fff" stroke="var(--color-ink)" strokeWidth={1.4} />
          {/* head: face is emotional, crown is intellectual */}
          <circle cx={65} cy={36} r={26} {...t("emotional")} />
          <circle cx={65} cy={36} r={26} clipPath="url(#twin-crown)" {...t("intellectual")} />
          <line x1={39.3} y1={32} x2={90.7} y2={32} stroke="#fff" strokeWidth={1.5} />
          {/* leader lines and anchor dots */}
          {ANCHORS.map((a) => (
            <g key={a.dim}>
              <line x1={a.x} y1={a.y} x2={a.side === "left" ? 0 : W} y2={a.y} stroke="var(--color-ink)" strokeWidth={1} />
              <circle cx={a.x} cy={a.y} r={2.6} fill="var(--color-ink)" stroke="#fff" strokeWidth={1.2} />
            </g>
          ))}
        </svg>
        <div className="relative">{ANCHORS.filter((a) => a.side === "right").map((a) => <Label key={a.dim} a={a} r={by[a.dim]} />)}</div>
      </div>
      <figcaption className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-soft">
        <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-sm border border-ink" style={{ background: "var(--color-scarlet)", opacity: 0.7 }} />below your usual</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-sm border border-ink bg-acid" />above</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-sm border border-ink bg-rule" />about your usual</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-sm border border-dashed border-soft bg-white" />no check-in yet</span>
      </figcaption>
    </figure>
  );
}
