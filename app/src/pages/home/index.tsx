// Surface: home (landing) — owner: nitu. Edit ONLY inside src/pages/home/.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { Attribution, Prediction } from "@/api/types";
import type { PageRoute } from "@/App";
import { Band } from "@/components/Band";
import { Logo } from "@/components/ui";

export const route: PageRoute = { path: "/", label: "Home", order: 0, owner: "nitu", bare: true };

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[44px] border border-mist bg-surface p-3 shadow-card">
      <div className="space-y-3 rounded-[34px] bg-paper p-4">{children}</div>
    </div>
  );
}

const STEPS = [
  { k: "Learns you", t: "Seven days of meals, sleep and heart rate are enough for Yugma to model how your body handles food.", d: "Five personal parameters, a population prior, and a band that tells you how sure it is." },
  { k: "Explains the spike", t: "When a reading doesn't match the meal, Yugma shows what lined up with it.", d: "Sleep, resting heart rate, movement. If it can't say why, it says so." },
  { k: "Hands you one thing", t: "Same meal, a different hour, a ten-minute walk after. One small change sized to right now.", d: "Based on how you responded before, not national averages." },
];
const ROLES = [
  { who: "Students", line: "A Band, a win, one small thing. Works with a watch alone; a sensor makes it sharper.", to: "/today", cta: "Open the student app" },
  { who: "Counselors", line: "What happened between visits, in ten seconds. Only for students who choose to share.", to: "/counselor", cta: "See the counselor view" },
  { who: "ScarletWell", line: "Which dimension is low, where and when, with at least five students behind every cell.", to: "/counselor", cta: "See the campus view" },
];

export default function Home() {
  const [p, setP] = useState<Prediction>();
  const [a, setA] = useState<Attribution>();
  useEffect(() => { api.predict().then(setP); api.attribute().then(setA); }, []);
  return (
    <div>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <span className="flex items-center gap-2"><Logo size={30} /><span className="display text-2xl">Yugma</span></span>
        <nav className="flex items-center gap-2 text-sm">
          <Link className="btn btn-ghost hidden sm:inline-flex" to="/counselor">Counselor view</Link>
          <Link className="btn btn-primary" to="/today">Open the app</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-[1.1fr_.9fr] md:px-8 md:pt-20">
        <div className="rise">
          <p className="eyebrow">Rutgers Health Hack · Wellness, reimagined</p>
          <h1 className="display h-hero mt-5">Your body, explained.<br /><span className="text-soft">Not graded.</span></h1>
          <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-soft">
            Yugma learns how you respond to food in a week, shows what else moved your glucose, and gives you the one small thing that works for you. Your counselor only sees it if you choose.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn btn-primary" to="/today">Open the app</Link>
            <a className="btn btn-ghost" href="#how">How it works</a>
          </div>
        </div>
        <Phone>
          <div className="rounded-2xl bg-win p-4">
            <p className="eyebrow !text-ink/60">Nice work</p>
            <p className="display mt-1 text-xl">Your walk after lunch kept your peak lower.</p>
          </div>
          <div className="rounded-2xl bg-surface p-3">
            <p className="eyebrow">Your next meal</p>
            {p ? <Band points={p.trajectory} height={130} /> : <div className="h-[130px]" />}
          </div>
          <div className="rounded-2xl bg-surface p-3">
            <p className="eyebrow">Why</p>
            <p className="mt-1 text-sm">{a?.plain_english ?? "…"}</p>
          </div>
        </Phone>
      </section>

      <section id="how" className="border-t border-mist bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <h2 className="display h-sec max-w-[22ch]">One model of you, doing three jobs.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <article key={s.k} className="rounded-3xl border border-mist bg-paper p-6">
                <p className="eyebrow">{s.k}</p>
                <h3 className="display mt-4 text-2xl">{s.t}</h3>
                <p className="mt-4 text-sm leading-relaxed text-soft">{s.d}</p>
              </article>))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <h2 className="display h-sec max-w-[24ch]">Honest about what it knows.</h2>
        <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
          <div className="rounded-3xl border border-mist bg-surface p-6 shadow-card">
            {p && <Band points={p.trajectory} height={220} />}
            <p className="mt-2 text-sm text-soft">The ribbon is the model's own doubt. Narrow means it knows you. Wide means it's still learning, and says so.</p>
          </div>
          <ul className="space-y-6">
            {[["Strengths, not fear", "Every screen leads with what went right. No scores, no traffic lights."],
              ["Sources on every number", "Hover any value and see where it came from."],
              ["Your data, your rules", "Sharing starts off. Grades are only what you type, and stay private."]].map(([h, t]) => (
              <li key={h}><h3 className="display text-2xl">{h}</h3><p className="mt-1 text-soft">{t}</p></li>))}
          </ul>
        </div>
      </section>

      <section className="border-t border-mist bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <h2 className="display h-sec">Built for the people around the student.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {ROLES.map((r) => (
              <Link key={r.who} to={r.to} className="group rounded-3xl border border-mist bg-paper p-6 transition hover:-translate-y-0.5 hover:shadow-card">
                <h3 className="display text-2xl">{r.who}</h3>
                <p className="mt-3 text-sm leading-relaxed text-soft">{r.line}</p>
                <p className="mt-6 text-sm font-medium">{r.cta} →</p>
              </Link>))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-10 text-xs text-soft md:px-8">
        Yugma is a wellness tool, not a medical device. This demo runs on public and synthetic data only.
      </footer>
    </div>
  );
}
