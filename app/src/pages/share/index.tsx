// Surface: share — owner: nitu. Edit ONLY inside src/pages/share/. Spec: docs/SOURCE_OF_TRUTH.md §2.3 Share (consent)
// Consent copy: draft, pending Neuro + Cyber review.
import { useState } from "react";
import type { PageRoute } from "@/App";
import { PageHead, Toggle } from "@/components/ui";

export const route: PageRoute = { path: "/share", label: "Share", order: 5, owner: "nitu", student: true };

const KEY = "share-consent";
type S = { counselor: boolean; aggregate: boolean; grades: boolean };
function load(): S {
  try { return { counselor: false, aggregate: false, grades: false, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; }
  catch { return { counselor: false, aggregate: false, grades: false }; }
}

export default function Share() {
  const [s, setS] = useState<S>(load);
  const set = (k: keyof S) => (v: boolean) => {
    const n = { ...s, [k]: v }; setS(n);
    try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* storage blocked: still works for this session */ }
  };
  return (
    <section>
      <PageHead kicker="Sharing" title="Your data, your rules" sub="Everything starts switched off. Change anything, any time." />
      <p className="mt-6 rounded-[12px] bg-acid-soft px-4 py-3 text-[15px]">{s.counselor ? "Your counselor can see your trends. Switch it off to stop." : "Nobody else can see your data right now."}</p>
      <div className="mt-4 space-y-3">
        <Toggle on={s.counselor} onChange={set("counselor")} label="Share with my counselor or clinician"
          detail="They will see: check-in trends, sleep and activity, and how steady your glucose has been. They will not see: raw glucose, meals, or grades." />
        <Toggle on={s.aggregate} onChange={set("aggregate")} label="Add to Rutgers' anonymous picture"
          detail="Your numbers are combined with at least 5 other students before anyone sees them. Nobody can pick you out." />
        <Toggle on={s.grades} onChange={set("grades")} label="Keep my grades next to my trends, just for me"
          detail="Only what you type in. Stays private to you. Never sent to your counselor or Rutgers." />
      </div>
    </section>
  );
}
