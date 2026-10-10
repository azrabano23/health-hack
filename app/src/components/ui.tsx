import type { ReactNode } from "react";

export function Logo({ size = 28, dark = false }: { size?: number; dark?: boolean }) {
  // Yugma mark: a rise that settles into a steady line, on a scarlet tile.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill={dark ? "#fff" : "var(--color-scarlet)"} />
      <path d="M5 21c4 0 5-11 9-11s4 8 8 8 3-2 5-2" stroke={dark ? "var(--color-scarlet)" : "#fff"} strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}
// Product lockup: mark + name + "for Rutgers" in plain text (not the trademarked Block R).
export function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo dark={dark} />
      <span className="display text-[23px] leading-none" style={{ fontVariationSettings: '"opsz" 24' }}>Yugma</span>
      <span className={`text-[15px] leading-none ${dark ? "text-white/70" : "text-soft"}`}>for Rutgers</span>
    </span>
  );
}
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}
export function Title({ children }: { children: ReactNode }) {
  return <h1 className="display text-[36px]" style={{ fontVariationSettings: '"opsz" 48, "wdth" 90' }}>{children}</h1>;
}
// Page header for student surfaces: where you are, the title, optional one-line help.
export function PageHead({ kicker, title, sub }: { kicker?: ReactNode; title: ReactNode; sub?: ReactNode }) {
  return (
    <header className="pb-2">
      {kicker && <p className="readout mb-1">{kicker}</p>}
      <Title>{title}</Title>
      {sub && <p className="mt-2 text-soft">{sub}</p>}
    </header>
  );
}
export function Toggle({ on, onChange, label, detail }: { on: boolean; onChange: (v: boolean) => void; label: string; detail: string }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`flex w-full cursor-pointer items-start gap-4 rounded-2xl border-[1.5px] bg-white p-5 text-left ${on ? "border-ink" : "border-rule"}`}>
      <span className="flex-1"><span className="display block text-[21px]">{label}</span>
        <span className="mt-1.5 block text-[15px] leading-relaxed text-soft">{detail}</span></span>
      <span className={`mt-1 h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors ${on ? "bg-ink" : "bg-rule"}`}>
        <span className={`block rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} style={{ height: 24, width: 24 }} />
      </span>
    </button>
  );
}
export const Source = ({ text }: { text: string }) => <span className="block pt-2 text-[13px] text-soft">Source: {text}</span>;

// Small stroke icons, used inline where they name a body signal (never as decoration tiles).
const I: Record<string, ReactNode> = {
  sleep: <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />,
  move: <><circle cx="13" cy="4.5" r="1.8" /><path d="M9 21l2.5-6 2.5 2v4M7 11l3-3h4l2 4 3 1M11.5 15l1.5-5" /></>,
  meal: <><path d="M4 11h16a8 8 0 01-16 0z" /><path d="M9 7c0-1.5 1-2 1-3.5M13 7c0-1.5 1-2 1-3.5" /></>,
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .6-1.5 1.2-1.5 2.5M12 17h.01" /></>,
  leaf: <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14M5 19l7-7" />,
  pin: <path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11zM12 12a2 2 0 100-4 2 2 0 000 4z" />,
  book: <path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5zM4 20.5A2.5 2.5 0 016.5 18H20v3H6.5" />,
  stress: <><circle cx="12" cy="12" r="8" /><path d="M9 10h.01M15 10h.01M9 15.5c1.8-1 4.2-1 6 0" /></>,
};
export function Icon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {I[name] ?? I.question}
    </svg>
  );
}
export const EVENT_ICON: Record<string, string> = { sleep: "sleep", rhr_shift: "heart", exercise: "move", unexplained: "question", stress: "stress", exam: "book", late_meal: "meal" };
