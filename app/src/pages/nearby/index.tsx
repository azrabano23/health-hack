// Surface: nearby — owner: azra. Edit ONLY inside src/pages/nearby/. Spec: docs/SOURCE_OF_TRUTH.md §2.3 Nearby
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { api } from "@/api/client";
import type { Resource } from "@/api/types";
import type { PageRoute } from "@/App";
import { PageHead } from "@/components/ui";

export const route: PageRoute = { path: "/nearby", label: "Nearby", order: 4, owner: "azra", student: true };

const CAMPUS = { nb: { name: "New Brunswick", c: [40.5008, -74.4474] }, nwk: { name: "Newark", c: [40.7424, -74.1738] }, cam: { name: "Camden", c: [39.9487, -75.1253] } } as const;
const DIMS = ["all", "physical", "emotional", "intellectual", "financial", "social", "spiritual", "occupational", "environmental"];

export default function Nearby() {
  const [campus, setCampus] = useState<keyof typeof CAMPUS>("nb");
  const [dim, setDim] = useState("all");
  const [items, setItems] = useState<Resource[]>([]);
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
      <div className="card mt-4 h-72 overflow-hidden [&_.leaflet-tile-pane]:saturate-[.4]">
        <MapContainer key={campus} center={CAMPUS[campus].c as [number, number]} zoom={14} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          {shown.map((r) => (
            <CircleMarker key={r.id} center={[r.lat, r.lng]} radius={9} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#201d3d", fillOpacity: 1 }}>
              <Popup><strong>{r.name}</strong><br />{r.address}</Popup>
            </CircleMarker>))}
        </MapContainer>
      </div>
      {shown.length === 0 && <p className="mt-4 text-[15px] text-soft">No places listed here yet. Newark and Camden lists are still being built.</p>}
      <ul className="mt-6 divide-y-[1.5px] divide-rule border-y-[1.5px] border-rule">
        {shown.map((r) => (
          <li key={r.id} className="py-4">
            <p className="display text-[19px]">{r.name}</p>
            <p className="mt-1 text-[15px] leading-relaxed text-soft">{r.why}</p>
            <p className="mt-2 flex flex-wrap gap-x-4 text-[14px] text-soft">
              <span className="num">{r.distance_km} km away</span>
              {r.phone && <a href={`tel:${r.phone}`} className="underline underline-offset-2 hover:text-ink">{r.phone}</a>}
            </p>
          </li>))}
      </ul>
    </section>
  );
}
