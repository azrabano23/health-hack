// Surface: nearby — owner: azra. Edit ONLY inside src/pages/nearby/. Spec: docs/SOURCE_OF_TRUTH.md §2.3 Nearby
import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Resource } from "@/api/types";
import type { PageRoute } from "@/App";
import { MAP_PROVIDER, Map } from "@/components/Map";
import { MapKeyControl } from "@/components/MapKey";
import { PageHead } from "@/components/ui";
import events from "../../../../data/wellness_events.json";
type Ev = { id: string; title: string; campus: string; lat?: number | null; lng?: number | null; location?: string };
const EVENTS = (events as { events: Ev[] }).events;

export const route: PageRoute = { path: "/nearby", label: "Nearby", order: 4, owner: "azra", student: true };

const CAMPUS = { nb: { name: "New Brunswick", c: [40.5008, -74.4474] }, nwk: { name: "Newark", c: [40.7424, -74.1738] }, cam: { name: "Camden", c: [39.9487, -75.1253] } } as const;
const DIMS = ["all", "physical", "emotional", "intellectual", "financial", "social", "spiritual", "occupational", "environmental"];

export default function Nearby() {
  const [campus, setCampus] = useState<keyof typeof CAMPUS>("nb");
  const [dim, setDim] = useState("all");
  const [items, setItems] = useState<Resource[]>([]);
  const [sel, setSel] = useState<string>();
  useEffect(() => { api.resources({ campus, ...(dim !== "all" ? { dimension: dim } : {}) }).then((r) => setItems(r.items)); }, [campus, dim]);
  const shown = items.filter((i) => i.campus === campus && (dim === "all" || i.dimensions.includes(dim)));
  return (
    <section>
      <PageHead kicker={`Rutgers–${CAMPUS[campus].name}, ${shown.length} places`} title="Nearby" sub="Real campus places, ranked by how well they fit first and distance second." />
      <div className="mt-4 flex rounded-[12px] border-[1.5px] border-rule bg-white p-1">
        {(Object.keys(CAMPUS) as (keyof typeof CAMPUS)[]).map((k) => (
          <button key={k} onClick={() => setCampus(k)} className={`flex-1 cursor-pointer rounded-[8px] px-3 py-2 text-[15px] ${campus === k ? "bg-ink font-bold text-white" : "text-soft hover:text-ink"}`}>{CAMPUS[k].name}</button>))}
      </div>
      <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {DIMS.map((d) => <button key={d} aria-pressed={dim === d} onClick={() => setDim(d)} className="chip shrink-0 capitalize">{d}</button>)}
      </div>
      <Map key={campus} center={CAMPUS[campus].c as [number, number]} zoom={14} onSelect={setSel} className="card mt-4 h-72 overflow-hidden [&_.leaflet-tile-pane]:saturate-[.4]"
        markers={[...shown.map((r) => ({ id: r.id, name: r.name, lat: r.lat, lng: r.lng, sub: r.address ?? undefined, selected: r.id === sel })),
                  ...EVENTS.filter((e) => e.campus === campus && e.lat != null).map((e) => ({ id: e.id, name: e.title, lat: e.lat ?? null, lng: e.lng ?? null, sub: e.location, tone: "scarlet" as const }))]} />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-soft">
        <span>{MAP_PROVIDER === "google" ? "Google Maps" : "OpenStreetMap"} · black = places, red = events this month · ranked by fit first, distance second</span>
        <MapKeyControl />
      </div>
      {shown.length === 0 && <p className="mt-4 text-[15px] text-soft">No places listed here yet.</p>}
      <ul className="mt-6 divide-y-[1.5px] divide-rule border-y-[1.5px] border-rule">
        {shown.map((r) => (
          <li key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer py-4 ${r.id === sel ? "bg-white/60" : ""}`}>
            <p className="display text-[19px]">{r.name}</p>
            <p className="mt-1 text-[15px] leading-relaxed text-soft">{r.why}</p>
            <p className="mt-2 flex flex-wrap gap-x-4 text-[14px] text-soft">
              <span className="num">{r.online ? "online" : `${r.distance_km} km away`}</span>
              {r.phone && <a href={`tel:${r.phone}`} className="underline underline-offset-2 hover:text-ink">{r.phone}</a>}
            </p>
          </li>))}
      </ul>
    </section>
  );
}
