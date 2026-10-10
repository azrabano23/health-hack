import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-mist bg-paper p-4 ${className}`}>{children}</div>;
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-60">{children}</p>;
}
export function Title({ children }: { children: ReactNode }) {
  return <h1 className="font-display text-3xl font-extrabold">{children}</h1>;
}
export function Toggle({ on, onChange, label, detail }: { on: boolean; onChange: (v: boolean) => void; label: string; detail: string }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className="flex w-full items-start gap-4 rounded-2xl border border-mist p-4 text-left focus-visible:outline-2 focus-visible:outline-line">
      <span className={`mt-1 h-6 w-11 shrink-0 rounded-full p-0.5 transition ${on ? "bg-line" : "bg-mist"}`}>
        <span className={`block h-5 w-5 rounded-full bg-paper transition ${on ? "translate-x-5" : ""}`} />
      </span>
      <span><span className="block font-display text-lg font-semibold">{label}</span>
        <span className="block text-sm opacity-70">{detail}</span></span>
    </button>
  );
}
export const Source = ({ text }: { text: string }) => <span className="font-mono text-[10px] opacity-50">source: {text}</span>;
