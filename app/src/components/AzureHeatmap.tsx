// Staff view: need (5 - mean) per campus for one dimension and week. Azure Maps heat layer when VITE_AZURE_MAPS_KEY is set,
// otherwise free Leaflet + OpenStreetMap circles (no key), the same pattern as components/Map.tsx.
// Points are campus centroids only; the aggregate has no finer location, and inventing one would break k-anonymity.
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { Circle, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import type { AggregateCell, Dimension } from "@/api/types";

const KEY = import.meta.env.VITE_AZURE_MAPS_KEY as string | undefined;
export const AZURE_MAPS = Boolean(KEY);

const CENTROID = { nb: [-74.4474, 40.5008], nwk: [-74.1738, 40.7424], cam: [-75.1253, 39.9487] } as const;   // [lng, lat]
const NAME = { nb: "New Brunswick", nwk: "Newark", cam: "Camden" } as const;

// n-weighted mean across levels, per campus. Cells are already k >= 5 from the engine.
export function campusNeed(cells: AggregateCell[], dimension: Dimension, week: number) {
  const acc: Record<string, { sum: number; n: number }> = {};
  for (const c of cells) {
    if (c.dimension !== dimension || c.week !== week) continue;
    const a = (acc[c.campus] ??= { sum: 0, n: 0 });
    a.sum += c.mean * c.n; a.n += c.n;
  }
  return (Object.keys(acc) as (keyof typeof CENTROID)[]).map((k) => {
    const mean = acc[k].sum / acc[k].n;
    return { campus: k, mean, n: acc[k].n, need: 5 - mean };
  });
}

export function AzureHeatmap({ cells, dimension, week }: { cells: AggregateCell[]; dimension: Dimension; week: number }) {
  const el = useRef<HTMLDivElement>(null);
  const src = useRef<import("azure-maps-control").source.DataSource | null>(null);
  const atlasRef = useRef<typeof import("azure-maps-control") | null>(null);
  const pts = campusNeed(cells, dimension, week);

  const shapes = (atlas: typeof import("azure-maps-control")) => pts.map((p) =>
    new atlas.data.Feature(new atlas.data.Point([...CENTROID[p.campus]]), { need: p.need, label: `${NAME[p.campus]} ${p.mean.toFixed(2)} · n ${p.n}` }));

  useEffect(() => {
    if (!KEY || !el.current) return;
    let map: import("azure-maps-control").Map | undefined;
    let gone = false;
    Promise.all([import("azure-maps-control"), import("azure-maps-control/dist/atlas.min.css")]).then(([atlas]) => {
      if (gone || !el.current) return;
      atlasRef.current = atlas;
      map = new atlas.Map(el.current, { center: [-74.6, 40.35], zoom: 7.4, style: "grayscale_light", authOptions: { authType: atlas.AuthenticationType.subscriptionKey, subscriptionKey: KEY } });
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
  }, []);

  // new dip picked: swap the points, keep the map
  useEffect(() => { if (src.current && atlasRef.current) src.current.setShapes(shapes(atlasRef.current)); }, [cells, dimension, week]);   // eslint-disable-line react-hooks/exhaustive-deps

  const label = `Heat map of ${dimension} need in week ${week}: ${pts.map((p) => `${NAME[p.campus]} mean ${p.mean.toFixed(2)}`).join(", ")}`;
  if (!KEY) {
    return (
      <div className="h-72 overflow-hidden rounded-md border border-rule" role="img" aria-label={label}>
        <MapContainer center={[40.36, -74.7]} zoom={8} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          {pts.map((p) => {
            const t = Math.min(1, Math.max(0, (p.need - 0.8) / 2.4));   // same scale as the week grid: 4.2 and above is the lightest step
            return (
              <Circle key={p.campus} center={[CENTROID[p.campus][1], CENTROID[p.campus][0]]} radius={6000 + t * 10000}
                pathOptions={{ color: "hsl(192 22% 38%)", weight: 1, fillColor: `hsl(192 22% ${85 - t * 47}%)`, fillOpacity: 0.75 }}>
                <Tooltip permanent direction="bottom">{NAME[p.campus]} {p.mean.toFixed(2)} · n {p.n}</Tooltip>
              </Circle>);
          })}
        </MapContainer>
      </div>);
  }
  return <div ref={el} className="h-72 overflow-hidden rounded-md border border-rule" role="img" aria-label={label} />;
}
