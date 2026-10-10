// Surface: home (landing) — owner: nitu. Edit ONLY inside src/pages/home/.
// Structure follows january.ai (centered hero on a soft yellow wash, dark grid "stage" with tabs,
// hairline rows with mono indices). Content, product mockups and the Band are Yugma's own.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { Aggregate, Attribution, Optimize, Prediction } from "@/api/types";
import type { PageRoute } from "@/App";
import { Band } from "@/components/Band";
import { Logo } from "@/components/ui";

export const route: PageRoute = { path: "/", label: "Home", order: 0, owner: "nitu", bare: true };

const Arrow = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M2 8h11M9 4l4 4-4 4" /></svg>;
const Check = () => <span className="grid h-4 w-4 place-items-center border border-ink bg-acid"><svg width="10" height="10" viewBox="0 0 10 10" stroke="#1c2024" strokeWidth="1.8" fill="none"><path d="M1.5 5.2l2.4 2.3 4.6-5" /></svg></span>;

const NET: [number, number][] = [[4, 14], [11, 30], [18, 12], [8, 52], [17, 70], [96, 12], [89, 28], [82, 10], [93, 50], [84, 68]];

const TABS = [
  { k: "Learn", h: "Learns how your body handles food", p: "Seven days of meals, sleep and heart rate give Yugma a model of you: how hard carbs hit, how fast you recover, when in the day you're most sensitive.", cta: "See your model" },
  { k: "Explain", h: "Explains the spikes that weren't food", p: "When a reading doesn't match the meal, Yugma shows what lined up with it: sleep, resting heart rate, movement. When it can't say why, it says so.", cta: "See a Why card" },
  { k: "Suggest", h: "Hands you one small thing", p: "Same meal, a different hour, a ten-minute walk after. One change, sized to right now, based on how you responded before.", cta: "Open Today" },
  { k: "Counselor", h: "Shows what happened between visits", p: "Only for students who opt in. Trends in check-ins, sleep, activity and glucose steadiness, with a reason to reconnect or not.", cta: "Open the counselor view" },
  { k: "Campus", h: "Shows ScarletWell where the need is", p: "Dimension by campus by week, with at least five students behind every cell. Allocation and scheduling, not surveillance.", cta: "See the aggregate" },
];
const STANDARD = [
  ["Strengths-first", "Every screen leads with what went right. No scores, no traffic lights, no words like \"bad\" or \"risk\"."],
  ["Sourced", "Every number carries where it came from. Hover it and see the study or the model."],
  ["Opt-in", "Sharing starts off. Grades are only what you type in, and stay private to you."],
  ["Honest about doubt", "The ribbon is the model's own uncertainty. Wide means still learning, and Yugma says so."],
];
const ROLES = [
  { who: "Students", line: "A Band, a win, one small thing. Works with a watch alone; a sensor makes it sharper.", to: "/today", cta: "Open the student app" },
  { who: "Counselors", line: "What happened between visits, in ten seconds. Only for students who choose to share.", to: "/counselor", cta: "Open the counselor view" },
  { who: "ScarletWell", line: "Which dimension is low, where and when, with at least five students behind every cell.", to: "/counselor", cta: "Open the campus view" },
];

const fmt = (v: number) => (Math.abs(v) < 1 ? v.toFixed(3) : v.toFixed(1));

function Mock({ tab, p, a, o, agg }: { tab: number; p?: Prediction; a?: Attribution; o?: Optimize; agg?: Aggregate }) {
  const box = "rounded-md border border-rule bg-surface p-5 text-ink";
  if (tab === 0) return (
    <div className={box}>
      <p className="mono-label">Your model · {p?.model}</p>
      {p && <Band points={p.trajectory} height={150} />}
      <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
        {p && [["Carb sensitivity", p.params.alpha], ["Recovery speed", p.params.k_dec], ["Time to peak (min)", p.params.tp]].map(([l, m]) => (
          <div key={String(l)} className="border-t border-rule pt-2"><dt className="mono-label !text-[10px]">{String(l)}</dt>
            <dd className="font-mono text-lg">{fmt((m as { value: number }).value)}</dd></div>))}
      </dl>
    </div>);
  if (tab === 1) return (
    <div className={box}>
      <p className="mono-label">Why that one reacted</p>
      <p className="display mt-2 text-xl">{a?.plain_english}</p>
      <ul className="mt-4 space-y-3">{a?.components.map((c) => (
        <li key={c.event_type}><div className="flex justify-between text-sm"><span className="capitalize">{c.event_type.replace("_", " ")}</span><span className="font-mono">{Math.round(c.share * 100)}%</span></div>
          <div className="mt-1 h-1.5 bg-rule"><div className="h-1.5 bg-acid" style={{ width: `${c.share * 100}%`, outline: "1px solid #1c2024" }} /></div></li>))}</ul>
    </div>);
  if (tab === 2) return (
    <div className={box}>
      <p className="mono-label">Same meal, different choices</p>
      <ul className="mt-3 divide-y divide-rule">{o?.options.slice(0, 3).map((x, i) => (
        <li key={i} className="flex items-start justify-between gap-4 py-3 text-sm"><span>{x.plain_english}</span>
          <span className="shrink-0 bg-acid px-2 py-0.5 font-mono text-xs">{x.delta_vs_asked}</span></li>))}</ul>
    </div>);
  if (tab === 3) return (
    <div className={box}>
      <p className="mono-label">Visit prep · opted-in student</p>
      <p className="display mt-2 text-xl">Sleep regularity down, activity down, glucose steadiness slipping over three weeks.</p>
      <div className="mt-4 flex items-center justify-between border-t border-rule pt-3 text-sm"><span className="mono-label">Needs a look · exam week</span><span className="btn btn-primary !py-1.5 !text-xs">Send reconnect</span></div>
    </div>);
  const weeks = [...new Set(agg?.cells.map((c) => c.week))];
  const dims = [...new Set(agg?.cells.map((c) => c.dimension))];
  return (
    <div className={box}>
      <p className="mono-label">Campus aggregate · k ≥ {agg?.k_min}</p>
      <table className="mt-3 w-full text-sm"><tbody>{dims.map((d) => (<tr key={d}><td className="py-1 capitalize">{d}</td>
        {weeks.map((w) => { const c = agg?.cells.find((x) => x.dimension === d && x.week === w);
          return <td key={w} className="p-0.5"><span className="block py-1 text-center font-mono text-xs" style={{ background: `rgb(255 255 17 / ${((c?.mean ?? 1) - 1) / 4 + 0.15})` }}>{c?.mean.toFixed(1)}</span></td>; })}</tr>))}</tbody></table>
    </div>);
}

export default function Home() {
  const [p, setP] = useState<Prediction>();
  const [a, setA] = useState<Attribution>();
  const [o, setO] = useState<Optimize>();
  const [agg, setAgg] = useState<Aggregate>();
  const [tab, setTab] = useState(0);
  useEffect(() => { api.predict().then(setP); api.attribute().then(setA); api.optimize().then(setO); api.counselorAggregate().then(setAgg); }, []);
  const t = TABS[tab];
  const link = ["/today", "/today", "/today", "/counselor", "/counselor"][tab];

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-rule bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-8">
          <span className="flex items-center gap-2"><Logo size={28} /><span className="display text-[22px]">Yugma</span></span>
          <nav className="hidden gap-7 text-[15px] text-soft md:flex">
            <a href="#how" className="hover:text-ink">How it works</a><a href="#standard" className="hover:text-ink">Our standard</a><a href="#who" className="hover:text-ink">Who it's for</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link className="hidden text-[15px] font-medium sm:block" to="/counselor">Counselor view</Link>
            <Link className="btn btn-primary" to="/today">Open the app <Arrow /></Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-rule">
        <div className="blob" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30" viewBox="0 0 100 90" preserveAspectRatio="none" aria-hidden>
          {NET.map(([x, y], i) => (i === 4 || i === 9 ? [] : [NET[i + 1]]).map(([x2, y2], j) => <line key={`${i}${j}`} x1={x} y1={y} x2={x2} y2={y2} stroke="#1c2024" strokeWidth="0.1" />))}
          {NET.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.5" fill="#1c2024" />)}
        </svg>
        <div className="relative mx-auto max-w-4xl px-5 pb-16 pt-20 text-center md:pt-28">
          <p className="mono-label rise">Rutgers Health Hack 2026 · Wellness, reimagined</p>
          <h1 className="display h-hero rise mt-6" style={{ animationDelay: ".05s" }}>Your body, explained. Not graded.</h1>
          <p className="rise mx-auto mt-6 max-w-[56ch] text-lg leading-relaxed text-ink/75" style={{ animationDelay: ".1s" }}>
            Yugma learns how you respond to food in a week, shows what else moved your glucose, and gives you the one small thing that works for you. Your counselor sees it only if you choose.
          </p>
          <div className="rise mt-9 flex flex-wrap justify-center gap-3" style={{ animationDelay: ".15s" }}>
            <Link className="btn btn-primary" to="/today">Open the app <Arrow /></Link>
            <Link className="btn btn-ghost" to="/counselor">See the counselor view</Link>
          </div>
          <ul className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-ink/80">
            {["Opt-in by default", "Sources on every number", "Works with a watch alone", "Public and synthetic data only"].map((x) => <li key={x} className="flex items-center gap-2"><Check />{x}</li>)}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <p className="mono-label">Live from the engine</p>
        <div className="mt-4 grid gap-px overflow-hidden rounded-md border border-rule bg-rule md:grid-cols-[1.4fr_1fr]">
          <div className="bg-surface p-6"><p className="mono-label">Your next meal</p>{p ? <Band points={p.trajectory} height={220} /> : <div className="h-[220px]" />}
            <p className="mt-2 text-sm text-soft">Ink is the prediction. Yellow is the model's 90% doubt.</p></div>
          <div className="space-y-px bg-rule">
            <div className="bg-acid p-6"><p className="mono-label !text-ink/70">Nice work</p><p className="display mt-2 text-2xl">Your walk after lunch kept your peak lower.</p></div>
            <div className="bg-surface p-6"><p className="mono-label">Why</p><p className="mt-2">{a?.plain_english}</p></div>
          </div>
        </div>
      </section>

      <section id="how" className="stage">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <h2 className="display h-sec max-w-[20ch]">One model of you. Five ways to see it.</h2>
          <div role="tablist" className="mt-12 grid grid-cols-2 border border-white/15 md:grid-cols-5">
            {TABS.map((x, i) => (
              <button key={x.k} role="tab" aria-selected={tab === i} onClick={() => setTab(i)}
                className={`cursor-pointer px-4 py-4 text-left text-sm transition ${tab === i ? "bg-acid text-ink" : "text-white/70 hover:bg-white/5"}`}>
                <span className="mono-label mr-2 !text-inherit opacity-60">{String(i + 1).padStart(2, "0")}</span>{x.k}
              </button>))}
          </div>
          <div className="mt-8 grid items-start gap-10 md:grid-cols-[1.25fr_1fr]">
            <Mock tab={tab} p={p} a={a} o={o} agg={agg} />
            <div>
              <p className="mono-label !text-acid">{String(tab + 1).padStart(2, "0")} / 05</p>
              <h3 className="display mt-3 text-3xl">{t.h}</h3>
              <p className="mt-4 leading-relaxed text-white/75">{t.p}</p>
              <Link to={link} className="btn btn-acid mt-8">{t.cta} <Arrow /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-24 text-center md:px-8">
        <p className="display text-[clamp(26px,3vw,38px)]">"No one wants to hear 'be like me.'"</p>
        <p className="mono-label mt-8">Team physician · Rutgers Health Hack mentor session</p>
      </section>

      <section id="standard" className="border-t border-rule bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <h2 className="display h-sec">Built to a student standard</h2>
          <p className="mt-3 max-w-[48ch] text-soft">Wellness, not diagnosis. Four rules we won't trade away for a nicer demo.</p>
          <ul className="mt-12 border-t border-rule">
            {STANDARD.map(([h, d], i) => (
              <li key={h} className="grid gap-2 border-b border-rule py-7 md:grid-cols-[260px_1fr]">
                <p className="mono-label"><span className="opacity-50">{String(i + 1).padStart(2, "0")}</span> {h}</p>
                <div><h3 className="display text-2xl">{h === "Strengths-first" ? "Leads with what went right" : h === "Sourced" ? "No number without a source" : h === "Opt-in" ? "Your data, your rules" : "Says when it doesn't know"}</h3>
                  <p className="mt-2 max-w-[60ch] text-soft">{d}</p></div>
              </li>))}
          </ul>
        </div>
      </section>

      <section id="who" className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <h2 className="display h-sec">Built across the people around the student</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-rule bg-rule md:grid-cols-3">
          {ROLES.map((r) => (
            <Link key={r.who} to={r.to} className="group bg-surface p-7 transition hover:bg-acid-soft/40">
              <h3 className="display text-2xl">{r.who}</h3>
              <p className="mt-3 text-sm leading-relaxed text-soft">{r.line}</p>
              <p className="mt-8 flex items-center gap-2 text-sm font-medium">{r.cta} <Arrow /></p>
            </Link>))}
        </div>
      </section>

      <section className="bg-acid">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-14 md:px-8">
          <h2 className="display h-sec max-w-[22ch]">See your own Band.</h2>
          <Link className="btn btn-primary" to="/today">Open the app <Arrow /></Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <p className="mono-label !text-soft">Yugma is a wellness tool, not a medical device. This demo runs on public and synthetic data only.</p>
      </footer>
    </div>
  );
}
