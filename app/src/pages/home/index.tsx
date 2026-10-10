// Surface: home (landing). Owner: nitu; rewritten Saturday evening around the check-in, the nudge and the chat.
// One bold element: a student's day written as a timeline. Everything else is quiet, left-aligned type.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { AggregateWeekly, Feedback, Nudge } from "@/api/types";
import type { PageRoute } from "@/App";
import { Wordmark } from "@/components/ui";

export const route: PageRoute = { path: "/", label: "Home", order: 0, owner: "nitu", bare: true };

const DAY = [
  ["07:30", "Watch", "5.3 hours of sleep", "Short night. The afternoon gets one quiet break; tonight is an hour earlier."],
  ["09:50", "Canvas", "Intro to Computer Science, Hill Center", "Classes and due dates land on the day, so nudges fit the gaps."],
  ["11:40", "Sensor", "Glucose sliding", "A snack now will steady it. You are a 1 minute walk from the Busch Student Center."],
  ["15:30", "Check-in", "Physical 2.4, emotional 3.2, social 4.3", "Social is carrying you. One small thing for physical, and the nearest open place for it."],
  ["18:00", "Wellness Calendar", "Zumba at College Ave Gym, free", "Matches the dimension you marked lowest today. It repeats weekly."],
  ["22:30", "ScarletWell", "Phone down by 11", "Short night behind you, a deadline tonight. That is the whole plan."],
];
const STEPS = [
  ["Tell it what you want it to know", "Medications, family history in your own words, a sensor you wear, your cycle, your watch, your Canvas calendar. All optional, all on your phone."],
  ["Check in on what is on your mind", "The Wellness Inventory ScarletWell already uses, 54 validated items, but any section, any time. Strongest dimension first, then one small thing and one real place."],
  ["Get the right nudge at the right spot", "A reading from your own device or a stretched week pairs with the nearest open place that fits, ranked by fit before distance. Never a prediction; the device reports."],
];
const RULES = [
  ["What is going right comes first", "Every screen opens with a strength. No scores framed as grades, no traffic-light colours, no talk of risk."],
  ["Every number has a source", "Tap any number to see the study, the registrar page or the rule it came from."],
  ["Nothing leaves your phone unless you say so", "Profile, calendar, meals and watch data stay in the browser. Staff only ever see cells of five or more students."],
  ["The device reports, we do not predict", "A sensor reading can trigger a nudge. We show the reading; there is no glucose model. Our physicians drew that line."],
];

export default function Home() {
  const [fb, setFb] = useState<Feedback>();
  const [nudge, setNudge] = useState<Nudge>();
  const [agg, setAgg] = useState<AggregateWeekly>();
  useEffect(() => { api.feedback({ scores: {} }).then(setFb); api.nudge({ signal: { type: "glucose_low" } }).then(setNudge); api.aggregateWeekly({ campus: "cam", level: "undergrad" }).then(setAgg); }, []);
  const weeks = [...new Set(agg?.cells.map((c) => c.week))].slice(5, 11);
  const dims = ["financial", "emotional", "physical", "social"];
  const low = fb?.cards.find((c) => c.band !== "strong");

  return (
    <div className="bg-white">
      <header className="border-b-[1.5px] border-rule">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
          <Wordmark />
          <nav className="hidden gap-7 text-[15px] text-soft md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#staff" className="hover:text-ink">For ScarletWell</a>
            <a href="#rules" className="hover:text-ink">Our rules</a>
          </nav>
          <Link className="btn btn-primary !px-4 !py-2.5 !text-[15px]" to="/profile">Open the app</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 md:px-8 md:pt-16">
        <div className="grid items-end gap-8 lg:grid-cols-[1.25fr_1fr]">
          <h1 className="display h-hero">Your day,<br />in <span className="text-scarlet">ScarletWell's</span> words.</h1>
          <div>
            <p className="text-[19px] leading-relaxed text-soft">
              The Wellness Inventory you already know, any section at a time. A friend's reply, one small thing, and the nearest real place for it, ranked by fit before distance. Nudges from your own devices. Nothing leaves your phone unless you say so.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn btn-primary" to="/profile">Start with About you</Link>
              <Link className="btn btn-ghost" to="/staff">See the ScarletWell view</Link>
            </div>
          </div>
        </div>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-[20px] border-[1.5px] border-rule bg-rule md:grid-cols-3">
          {DAY.map(([t, from, what, why]) => (
            <li key={t} className="bg-white p-5">
              <p className="readout">{t} · {from}</p>
              <p className="display mt-1 text-[21px] leading-tight">{what}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-soft">{why}</p>
            </li>))}
        </ol>
        <p className="mt-3 text-[13px] text-soft">One made-up student's Tuesday. Every line is the real engine answering her data. Open the app and tap "Walk through Maya's Tuesday".</p>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1fr_420px] md:px-8">
          <div className="md:pt-6">
            <h2 className="display h-sec max-w-[16ch]">What a check-in gives back</h2>
            <p className="measure mt-5 text-[19px] leading-relaxed text-soft">Not a score. The strongest dimension first, then for each stretched one: a friend's sentence, one small thing, the nearest open place that fits, this week's event, and off-campus help from University Hospital's directory.</p>
            <p className="measure mt-4 text-[19px] leading-relaxed text-soft">The closest place is not always the best one. We rank by fit and only then by distance, and the app shows you the weights.</p>
          </div>
          <div className="rounded-[20px] border-[1.5px] border-rule bg-white p-6" aria-label="Example feedback">
            <p className="text-soft">{fb?.opening ?? "Thanks for checking in on 3 of 8 dimensions."}</p>
            {low && (<>
              <p className="display mt-3 text-[26px] leading-tight">{low.message}</p>
              <div className="mt-5 border-t-[1.5px] border-rule pt-4">
                <p className="font-bold">One small thing</p>
                <p className="mt-1 text-[17px]">{low.next_step}</p>
              </div>
              {low.resource && (
                <div className="mt-4 border-t-[1.5px] border-rule pt-4">
                  <p className="font-bold">One place</p>
                  <p className="mt-1 text-[17px]">{low.resource.name}</p>
                  <p className="text-[14px] text-soft">{low.resource.why}</p>
                </div>)}
              {nudge && (
                <div className="mt-4 rounded-[12px] bg-blush p-4">
                  <p className="text-[13px] font-bold text-scarlet">A nudge, when your sensor says so</p>
                  <p className="mt-1 text-[15px]">{nudge.message}</p>
                </div>)}
            </>)}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <h2 className="display h-sec">How it works</h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {STEPS.map(([h, d], i) => (
            <li key={h} className="border-t-[3px] border-scarlet pt-5">
              <span className="display block text-[56px] leading-none text-scarlet" style={{ fontVariationSettings: '"opsz" 96, "wdth" 75' }}>{i + 1}</span>
              <h3 className="display mt-4 text-[24px]">{h}</h3>
              <p className="mt-2 leading-relaxed text-soft">{d}</p>
            </li>))}
        </ol>
      </section>

      <section id="staff" className="stage">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <h2 className="display h-sec max-w-[20ch]">What ScarletWell sees</h2>
          <p className="measure mt-5 text-[19px] leading-relaxed text-white/75">Never a student. Dimension by week by campus, with at least five students behind every cell, the academic calendar drawn over it, and the dips tied to the stressor that overlaps them: term bill week, the W deadline, finals. Then the resources that match and a plan.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-[20px] bg-white p-6 text-ink">
              <p className="font-bold">A program lead, Monday morning</p>
              <p className="display mt-3 text-[24px]">Financial dipped at Camden in the week the term bill came due. Two matching resources on that campus. Plan: move the Basic Needs pop-up into that week.</p>
              <p className="mt-3 text-[15px] text-soft">Synthetic check-ins today. The shapes are built for ScarletWell's de-identified export.</p>
              <Link to="/staff" className="btn btn-primary mt-6">Open the ScarletWell view</Link>
            </div>
            <div className="rounded-[20px] bg-white p-6 text-ink">
              <p className="font-bold">Camden undergraduates, weeks 6 to 11</p>
              <p className="mt-1 text-[15px] text-soft">Weekly mean on the 1 to 5 line. Lighter is flourishing, darker is stretched. Synthetic.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-[15px]">
                  <thead><tr><th className="sr-only">Dimension</th>{weeks.map((w) => <th key={w} className="pb-2 text-[13px] font-normal text-soft">wk {w}</th>)}</tr></thead>
                  <tbody>{dims.map((d) => (<tr key={d}><td className="py-1 pr-3 capitalize">{d}</td>
                    {weeks.map((w) => { const c = agg?.cells.find((x) => x.dimension === d && x.week === w);
                      const t = c ? Math.min(1, Math.max(0, (5 - c.mean - 0.8) / 2.4)) : 0;
                      return <td key={w} className="p-0.5"><span className="num block rounded-md py-1.5 text-center text-[14px]" style={{ background: `hsl(345 70% ${96 - t * 50}%)`, color: t > 0.55 ? "#fff" : "#1c1c1e" }}>{c?.mean.toFixed(1)}</span></td>; })}</tr>))}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="rules" className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <h2 className="display h-sec">Four rules we keep</h2>
        <p className="mt-4 text-[19px] text-soft">A wellness tool, not a diagnosis.</p>
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
            <p className="mt-3 text-[19px] text-soft">New Brunswick, Newark and Camden. 125 real places, 26 real events, the registrar's calendar, University Hospital's directory. Works with nothing connected at all.</p>
          </div>
          <Link className="btn btn-primary" to="/profile">Start with About you</Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 md:px-8">
        <Wordmark />
        <p className="max-w-[62ch] text-[14px] text-soft">A wellness tool, not a medical device. Wellness Inventory items: Swarbrick et al., Psychiatric Services 2025, used with the author's knowledge for this demo. Synthetic check-in data only. A hackathon prototype, not an official Rutgers service.</p>
      </footer>
    </div>
  );
}
