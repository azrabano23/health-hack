import type { ReactNode } from "react";

export function Logo({ size = 28 }: { size?: number }) {
  // Yugma = "pair": two lines that almost coincide.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M2 20c5 0 5-12 10-12s5 16 10 16 5-9 8-9" stroke="var(--color-line)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M2 23c5 0 5-12 10-12s5 16 10 16 5-9 8-9" stroke="var(--color-band)" strokeWidth="2.6" strokeLinecap="round" opacity=".9" />
    </svg>
  );
}
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-mist bg-surface p-5 shadow-card ${className}`}>{children}</div>;
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}
export function Title({ children }: { children: ReactNode }) {
  return <h1 className="display h-sec">{children}</h1>;
}
export function Toggle({ on, onChange, label, detail }: { on: boolean; onChange: (v: boolean) => void; label: string; detail: string }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className="flex w-full cursor-pointer items-start gap-4 rounded-3xl border border-mist bg-surface p-5 text-left shadow-card">
      <span className={`mt-1 h-7 w-12 shrink-0 rounded-full p-0.5 transition ${on ? "bg-line" : "bg-mist"}`}>
        <span className={`block h-6 w-6 rounded-full bg-surface shadow transition ${on ? "translate-x-5" : ""}`} />
      </span>
      <span><span className="display block text-xl">{label}</span>
        <span className="mt-1 block text-sm text-soft">{detail}</span></span>
    </button>
  );
}
export const Source = ({ text }: { text: string }) => <span className="block pt-2 text-[10px] text-soft">source: {text}</span>;
