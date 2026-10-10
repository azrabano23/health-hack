// Surface: home (landing) — owner: nitu. Edit ONLY inside src/pages/home/.
// Design: one bold element — a real (synthetic) day of glucose with the day written onto it.
// Everything else is quiet: left-aligned type, plain lists, the app's own Today messages.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { Aggregate, Attribution, Optimize, Timeline } from "@/api/types";
import type { PageRoute } from "@/App";
import { EVENT_ICON, Icon, Wordmark } from "@/components/ui";
import { DayLine } from "./DayLine";

export const route: PageRoute = { path: "/", label: "Home", order: 0, owner: "nitu", bare: true };

const LABEL: Record<string, string> = { sleep: "Last night's sleep", rhr_shift: "Resting heart rate", unexplained: "Not sure yet", exercise: "Movement" };
const STEPS = [
  ["It learns you in a week", "Seven days of meals, sleep and heart rate from your watch. A glucose sensor sharpens the picture, but you don't need one."],
  ["It explains what didn't fit", "When your body reacts more than usual, Yugma shows what lined up with it: short sleep, a higher resting heart rate, less movement. When it isn't sure, it says so."],
  ["It offers one small thing", "The same meal at a different hour, vegetables first, or a ten-minute walk afterwards. One change, sized to the next two hours."],
];
const RULES = [
  ["What went right comes first", "Every screen opens with a win. No scores, no traffic-light colours, no talk of risk."],
  ["Every number has a source", "Tap a number to see the study or the model it came from."],
  ["Sharing starts switched off", "You decide who sees what, and you can change it any time. Grades stay private to you."],
  ["It says when it doesn't know", "The shaded ribbon is the model's own uncertainty. Wide means it is still learning you."],
];

export default function Home() {
  const [day, setDay] = useState<Timeline>();
  const [a, setA] = useState<Attribution>();
  const [o, setO] = useState<Optimize>();
  const [agg, setAgg] = useState<Aggregate>();
  useEffect(() => { api.timeline("cgm-07").then(setDay); api.attribute().then(setA); api.optimize().then(setO); api.counselorAggregate().then(setAgg); }, []);
  const weeks = [...new Set(agg?.cells.map((c) => c.week))];
  const dims = [...new Set(agg?.cells.map((c) => c.dimension))];

  return (
    <div className="bg-white">
      <header className="border-b-[1.5px] border-rule">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
          <Wordmark />
          <nav className="hidden gap-7 text-[15px] text-soft md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#counselors" className="hover:text-ink">For counselors</a>
            <a href="#rules" className="hover:text-ink">Our rules</a>
          </nav>
          <Link className="btn btn-primary !px-4 !py-2.5 !text-[15px]" to="/today">Open the app</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 md:px-8 md:pt-16">
        <div className="grid items-end gap-8 lg:grid-cols-[1.25fr_1fr]">
          <h1 className="display h-hero">Your body, explained.<br />Not graded.</h1>
          <div>
            <p className="text-[19px] leading-relaxed text-soft">
              Yugma learns how your body responds to food, sleep and stress in about a week. Then it tells you what went right, what lined up with the moments that didn't, and one small thing to try today.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn btn-primary" to="/today">Open the student app</Link>
              <Link className="btn btn-ghost" to="/counselor">See the counselor view</Link>
            </div>
          </div>
        </div>
        <div className="mt-12">{day ? <DayLine t={day} /> : <div className="h-[336px]" />}</div>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1fr_420px] md:px-8">
          <div className="md:pt-6">
            <h2 className="display h-sec max-w-[16ch]">What Maya sees the next morning</h2>
            <p className="measure mt-5 text-[19px] leading-relaxed text-soft">
              Yugma doesn't score her day. It starts with what went well, explains the part that didn't fit, and suggests one thing she can do before her next class.
            </p>
            <p className="measure mt-4 text-[19px] leading-relaxed text-soft">No list of tips. No warnings. The words are chosen so a hard week still reads as information, not a grade.</p>
          </div>
          <div className="rounded-[20px] border-[1.5px] border-rule bg-white p-6" aria-label="Example of the Today screen">
            <p className="text-soft">Good morning, Maya</p>
            <p className="display mt-2 text-[28px]">Your walk after lunch kept your peak 28 points lower.</p>
            {a && (
              <div className="mt-6 border-t-[1.5px] border-rule pt-5">
                <p className="font-bold">Why one meal reacted more</p>
                <p className="mt-1 text-[15px] text-soft">{a.plain_english}</p>
                <ul className="mt-4 space-y-3">
                  {a.components.map((c) => (
                    <li key={c.event_type} className="text-[15px]">
                      <span className="flex items-center justify-between"><span className="flex items-center gap-1.5"><Icon name={EVENT_ICON[c.event_type] ?? "question"} size={16} />{LABEL[c.event_type] ?? c.event_type}</span><span className="num text-soft">{Math.round(c.share * 100)}%</span></span>
                      <span className="mt-1.5 block h-2 rounded-full bg-acid-soft"><span className="block h-2 rounded-full bg-ink" style={{ width: `${c.share * 100}%` }} /></span>
                    </li>))}
                </ul>
              </div>)}
            {o?.options[0] && (
              <div className="mt-6 border-t-[1.5px] border-rule pt-5">
                <p className="font-bold">One small thing for today</p>
                <p className="mt-1 text-[17px]">{o.options[0].plain_english}</p>
              </div>)}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <h2 className="display h-sec">How it works</h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {STEPS.map(([h, d], i) => (
            <li key={h} className="border-t-[3px] border-ink pt-5">
              <span className="display block text-[56px] leading-none text-scarlet" style={{ fontVariationSettings: '"opsz" 96, "wdth" 75' }}>{i + 1}</span>
              <h3 className="display mt-4 text-[24px]">{h}</h3>
              <p className="mt-2 leading-relaxed text-soft">{d}</p>
            </li>))}
        </ol>
      </section>

      <section id="counselors" className="stage">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <h2 className="display h-sec max-w-[20ch]">If a student chooses to share</h2>
          <p className="measure mt-5 text-[19px] leading-relaxed text-white/75">Nobody else sees a student's data unless they switch sharing on. When they do, the people who support them see trends, never raw glucose, meals or grades.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-[20px] bg-white p-6 text-ink">
              <p className="font-bold">A CAPS counselor, before a visit</p>
              <p className="display mt-3 text-[24px]">Sleep regularity down, activity down, glucose steadiness slipping over three weeks.</p>
              <p className="mt-3 text-[15px] text-soft">Shared by the student. Shown with the reason it was flagged, so the counselor decides whether to reach out.</p>
              <Link to="/counselor" className="btn btn-ink mt-6">Open the counselor view</Link>
            </div>
            <div className="rounded-[20px] bg-white p-6 text-ink">
              <p className="font-bold">ScarletWell, across campus</p>
              <p className="mt-1 text-[15px] text-soft">Average wellness score by week. At least {agg?.k_min ?? 5} students behind every cell.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-[15px]">
                  <thead><tr><th className="sr-only">Dimension</th>{weeks.map((w) => <th key={w} className="pb-2 text-[13px] font-normal text-soft">{w.slice(5)}</th>)}</tr></thead>
                  <tbody>{dims.map((d) => (<tr key={d}><td className="py-1 pr-3 capitalize">{d}</td>
                    {weeks.map((w) => { const c = agg?.cells.find((x) => x.dimension === d && x.week === w);
                      return <td key={w} className="p-0.5"><span className="num block rounded-md py-1.5 text-center text-[14px]" style={{ background: `color-mix(in srgb, #8f95e6 ${((c?.mean ?? 1) - 1) * 22}%, #f5f5f8)` }}>{c?.mean.toFixed(1)}</span></td>; })}</tr>))}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="rules" className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <h2 className="display h-sec">Four rules we keep</h2>
        <p className="mt-4 text-[19px] text-soft">Yugma is a wellness tool, not a diagnosis.</p>
        <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {RULES.map(([h, d]) => (
            <div key={h} className="border-t-[1.5px] border-rule pt-5">
              <dt className="display text-[22px]">{h}</dt>
              <dd className="mt-2 leading-relaxed text-soft">{d}</dd>
            </div>))}
        </dl>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-8 px-5 py-16 md:px-8">
          <div>
            <h2 className="display h-sec max-w-[18ch]">For students on every Rutgers campus</h2>
            <p className="mt-3 text-[19px] text-soft">New Brunswick, Newark and Camden. Works with a watch alone.</p>
          </div>
          <Link className="btn btn-primary" to="/today">Open the student app</Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 md:px-8">
        <Wordmark />
        <p className="max-w-[62ch] text-[14px] text-soft">A wellness tool, not a medical device. This demo runs on public and synthetic data only. A hackathon prototype, not an official Rutgers service.</p>
      </footer>
    </div>
  );
}
