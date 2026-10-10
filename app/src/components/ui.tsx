import type { ReactNode } from "react";

export function Logo({ size = 26, dark = false }: { size?: number; dark?: boolean }) {
  // Yugma = "pair": two lines that almost coincide, one with the yellow ribbon.
  const c = dark ? "#fff" : "var(--color-ink)";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M2 23c5 0 5-13 10-13s5 16 10 16 5-9 8-9" stroke="var(--color-acid)" strokeWidth="5" strokeLinecap="round" />
      <path d="M2 20c5 0 5-13 10-13s5 16 10 16 5-9 8-9" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-md border border-rule bg-surface p-5 shadow-[0_1px_2px_rgb(28_32_36/.04),0_10px_30px_-18px_rgb(28_32_36/.25)] ${className}`}>{children}</div>;
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}
export function Index({ n, of, label }: { n: number; of?: number; label?: string }) {
  const p = (x: number) => String(x).padStart(2, "0");
  return <p className="mono-label"><span className="opacity-60">{p(n)}{of ? ` / ${p(of)}` : ""}</span>{label ? ` ${label}` : ""}</p>;
}
export function Title({ children }: { children: ReactNode }) {
  return <h1 className="display h-sec">{children}</h1>;
}
export function Toggle({ on, onChange, label, detail }: { on: boolean; onChange: (v: boolean) => void; label: string; detail: string }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className="flex w-full cursor-pointer items-start gap-4 rounded-md border border-rule bg-surface p-5 text-left">
      <span className={`mt-1 h-6 w-11 shrink-0 rounded-full border p-0.5 transition ${on ? "border-ink bg-acid" : "border-rule bg-canvas"}`}>
        <span className={`block h-4.5 w-4.5 rounded-full bg-ink transition ${on ? "translate-x-5" : ""}`} style={{ height: 18, width: 18 }} />
      </span>
      <span><span className="display block text-xl">{label}</span>
        <span className="mt-1 block text-sm text-soft">{detail}</span></span>
    </button>
  );
}
export const Source = ({ text }: { text: string }) => <span className="mono-label block pt-2 !text-[10px] !normal-case !tracking-normal opacity-70">source: {text}</span>;
