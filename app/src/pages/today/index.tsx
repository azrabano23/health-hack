// Surface: today — owner: azra. Edit ONLY inside src/pages/today/. Spec: docs/SOURCE_OF_TRUTH.md §2.3 Home/Today
import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Prediction } from "@/api/types";
import type { PageRoute } from "@/App";
import { Band } from "@/components/Band";

export const route: PageRoute = { path: "/today", label: "Today", order: 1, owner: "azra", student: true };

export default function Today() {
  const [p, setP] = useState<Prediction>();
  useEffect(() => { api.predict().then(setP); }, []);
  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-win/90 text-ink p-4 font-display text-lg">Nice work: your walk kept your peak lower.</div>
      {p ? <Band points={p.trajectory} /> : <p>Loading…</p>}
      <p className="text-xs font-mono opacity-60">model {p?.model} · TODO(azra): Why bars, One thing</p>
    </section>
  );
}
