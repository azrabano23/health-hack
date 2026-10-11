// Staff view: need (5 - mean) per place for one dimension and week. Azure Maps heat layer when VITE_AZURE_MAPS_KEY is set,
// otherwise free Leaflet + OpenStreetMap circles (no key), the same pattern as components/Map.tsx.
// Places are campus centroids, or New Brunswick areas from the student's self-reported home area; never GPS, never a building.
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import type { AggregateCell, Areas, Dimension } from "@/api/types";

const KEY = import.meta.env.VITE_AZURE_MAPS_KEY as string | undefined;
export const AZURE_MAPS = Boolean(KEY);

export interface NeedPoint { id: string; name: string; lat: number; lng: number; mean: number; n: number }
export interface Pin { id: string; name: string; lat: number; lng: number; sub?: string }

const CAMPUS = { nb: { name: "New Brunswick", lat: 40.5008, lng: -74.4474 }, nwk: { name: "Newark", lat: 40.7424, lng: -74.1738 }, cam: { name: "Camden", lat: 39.9487, lng: -75.1253 } } as const;
export const VIEW = {
  campuses: { center: [40.36, -74.7] as [number, number], zoom: 8, radius: 6000 },
  nb: { center: [40.504, -74.447] as [number, number], zoom: 12, radius: 350 },
};

// n-weighted mean across levels, per campus. Cells are already k >= 5 from the engine.
export function campusNeed(cells: AggregateCell[], dimension: Dimension, week: number): NeedPoint[] {
  const acc: Record<string, { sum: number; n: number }> = {};
  for (const c of cells) {
    if (c.dimension !== dimension || c.week !== week) continue;
    const a = (acc[c.campus] ??= { sum: 0, n: 0 });
    a.sum += c.mean * c.n; a.n += c.n;
  }
  return (Object.keys(acc) as (keyof typeof CAMPUS)[]).map((k) => ({ id: k, ...CAMPUS[k], mean: acc[k].sum / acc[k].n, n: acc[k].n }));
}

export function areaNeed(a: Areas, dimension: Dimension, week: number): NeedPoint[] {
  return a.cells.filter((c) => c.dimension === dimension && c.week === week).flatMap((c) => {
    const ar = a.areas.find((x) => x.id === c.area);
    return ar ? [{ id: ar.id, name: ar.label, lat: ar.lat, lng: ar.lng, mean: c.mean, n: c.n }] : [];
  });
}

const tone = (mean: number) => Math.min(1, Math.max(0, (5 - mean - 0.8) / 2.4));   // same scale as the week grid: 4.2 and above is the lightest step

// pins: public places that match the dimension (data/rutgers_resources.json); drawn on the free map only
export function AzureHeatmap({ points, view, label, pins = [] }: { points: NeedPoint[]; view: keyof typeof VIEW; label: string; pins?: Pin[] }) {
  const el = useRef<HTMLDivElement>(null);
  const src = useRef<import("azure-maps-control").source.DataSource | null>(null);
  const atlasRef = useRef<typeof import("azure-maps-control") | null>(null);
  const v = VIEW[view];

  const shapes = (atlas: typeof import("azure-maps-control")) => points.map((p) =>
    new atlas.data.Feature(new atlas.data.Point([p.lng, p.lat]), { need: 5 - p.mean, label: `${p.name} ${p.mean.toFixed(2)} · n ${p.n}` }));

  useEffect(() => {
    if (!KEY || !el.current) return;
    let map: import("azure-maps-control").Map | undefined;
    let gone = false;
    Promise.all([import("azure-maps-control"), import("azure-maps-control/dist/atlas.min.css")]).then(([atlas]) => {
      if (gone || !el.current) return;
      atlasRef.current = atlas;
      map = new atlas.Map(el.current, { center: [v.center[1], v.center[0]], zoom: v.zoom - 0.6, style: "grayscale_light", authOptions: { authType: atlas.AuthenticationType.subscriptionKey, subscriptionKey: KEY } });
      map.events.add("ready", () => {
        const ds = new atlas.source.DataSource();
        map!.sources.add(ds);
        // one hue (teal), darker = more stretched, same scale idea as the week grid; no red/orange/green
        map!.layers.add(new atlas.layer.HeatMapLayer(ds, undefined, {
          weight: ["/", ["get", "need"], 4], radius: 70, intensity: 1, opacity: 0.85,
          color: ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,0,0)", 0.2, "hsl(192,22%,85%)", 0.6, "hsl(192,22%,60%)", 1, "hsl(192,22%,38%)"],
        }));
        map!.layers.add(new atlas.layer.SymbolLayer(ds, undefined, { iconOptions: { image: "none" }, textOptions: { textField: ["get", "label"], offset: [0, 2.2], size: 12 } }));
        ds.setShapes(shapes(atlas));
        src.current = ds;
      });
    });
    return () => { gone = true; src.current = null; map?.dispose(); };
  }, [view]);   // eslint-disable-line react-hooks/exhaustive-deps

  // new dip picked: swap the points, keep the map
  useEffect(() => { if (src.current && atlasRef.current) src.current.setShapes(shapes(atlasRef.current)); }, [points]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!KEY) {
    return (
      <div className="h-96 overflow-hidden rounded-md border border-rule" role="img" aria-label={label}>
        <MapContainer key={view} center={v.center} zoom={v.zoom} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          {points.map((p) => {
            const t = tone(p.mean);
            return (
              <Circle key={p.id} center={[p.lat, p.lng]} radius={v.radius * (1 + t * 1.7)}
                pathOptions={{ color: "hsl(192 22% 38%)", weight: 1, fillColor: `hsl(192 22% ${85 - t * 47}%)`, fillOpacity: 0.5 }}>
                <Tooltip permanent direction={p.lng < v.center[1] - 0.005 ? "left" : p.lng > v.center[1] + 0.005 ? "right" : "bottom"}>{p.name} {p.mean.toFixed(2)} · n {p.n}</Tooltip>
              </Circle>);
          })}
          {pins.map((p) => (
            <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={4} pathOptions={{ color: "#fff", weight: 1, fillColor: "#1c2024", fillOpacity: 0.9 }}>
              <Tooltip>{p.name}{p.sub ? ` · ${p.sub}` : ""}</Tooltip>
            </CircleMarker>))}
        </MapContainer>
      </div>);
  }
  return <div key={view} ref={el} className="h-96 overflow-hidden rounded-md border border-rule" role="img" aria-label={label} />;
}
