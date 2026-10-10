// Surface: nearby — owner: azra. Edit ONLY inside src/pages/nearby/. Spec: docs/SOURCE_OF_TRUTH.md §2.3 Nearby
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { api } from "@/api/client";
import type { Resource } from "@/api/types";
import type { PageRoute } from "@/App";
import { Card, Title } from "@/components/ui";

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
    <section className="space-y-4">
      <Title>Nearby</Title>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CAMPUS) as (keyof typeof CAMPUS)[]).map((k) => (
          <button key={k} onClick={() => setCampus(k)} className={`rounded-full border px-4 py-2 text-sm ${campus === k ? "border-line bg-line text-paper" : "border-mist"}`}>{CAMPUS[k].name}</button>))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DIMS.map((d) => <button key={d} onClick={() => setDim(d)} className={`shrink-0 rounded-full border px-3 py-1 text-xs capitalize ${dim === d ? "border-ink bg-ink text-paper" : "border-mist"}`}>{d}</button>)}
      </div>
      <div className="h-72 overflow-hidden rounded-2xl border border-mist">
        <MapContainer key={campus} center={CAMPUS[campus].c as [number, number]} zoom={14} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          {shown.map((r) => (
            <CircleMarker key={r.id} center={[r.lat, r.lng]} radius={9} pathOptions={{ color: "#2f3fd0", fillColor: "#7c8cff", fillOpacity: 0.8 }}>
              <Popup><strong>{r.name}</strong><br />{r.address}</Popup>
            </CircleMarker>))}
        </MapContainer>
      </div>
      {shown.length === 0 && <p className="text-sm opacity-70">No places listed here yet. Newark and Camden lists are still being built.</p>}
      <ul className="space-y-3">
        {shown.map((r) => (
          <li key={r.id}><Card>
            <p className="font-display text-lg font-semibold">{r.name}</p>
            <p className="text-sm opacity-70">{r.why}</p>
            <p className="font-mono text-xs opacity-60">{r.distance_km} km · {r.phone}</p>
          </Card></li>))}
      </ul>
    </section>
  );
}
