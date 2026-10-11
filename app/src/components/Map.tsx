// One map for the landing page, Nearby and Feedback. Google Maps when a key is present, Leaflet with OpenStreetMap otherwise,
// so fixtures mode and CI need no key. The key comes from VITE_GOOGLE_MAPS_API_KEY at build time or, failing that, from a
// key the person pasted on the page (kept in this browser only; a browser key restricted to referrers is meant to be public).
import "leaflet/dist/leaflet.css";
import { APIProvider, AdvancedMarker, Map as GMap, Pin } from "@vis.gl/react-google-maps";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

export interface MapMarker { id: string; name: string; lat: number | null; lng: number | null; selected?: boolean; sub?: string; tone?: "ink" | "scarlet" }
export interface MapProps { markers: MapMarker[]; center: [number, number]; zoom?: number; onSelect?: (id: string) => void; className?: string }

const KEY_LS = "gmaps_key";
export function mapKey(): string | undefined {
  const env = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (env) return env;
  try { return localStorage.getItem(KEY_LS) || undefined; } catch { return undefined; }
}
export function setMapKey(k: string) { try { k.trim() ? localStorage.setItem(KEY_LS, k.trim()) : localStorage.removeItem(KEY_LS); } catch { /* ignore */ } }
export const keyFromEnv = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
const KEY = mapKey();
export const MAP_PROVIDER = KEY ? "google" : "leaflet";

const COLOR = { ink: "#1c1c1e", scarlet: "#cc0033", selected: "#f6d3dc" };

export function Map({ markers, center, zoom = 14, onSelect, className = "h-72" }: MapProps) {
  const pts = markers.filter((m): m is MapMarker & { lat: number; lng: number } => m.lat != null && m.lng != null);
  if (KEY) {
    return (
      <div className={`overflow-hidden rounded-md border border-rule ${className}`}>
        <APIProvider apiKey={KEY}>
          <GMap defaultCenter={{ lat: center[0], lng: center[1] }} defaultZoom={zoom} mapId="DEMO_MAP_ID" gestureHandling="greedy"
            disableDefaultUI clickableIcons={false} style={{ width: "100%", height: "100%" }}>
            {pts.map((m) => (
              <AdvancedMarker key={m.id} position={{ lat: m.lat, lng: m.lng }} title={m.name} onClick={() => onSelect?.(m.id)}>
                <Pin background={m.selected ? COLOR.selected : COLOR[m.tone ?? "ink"]} borderColor={COLOR[m.tone ?? "ink"]} glyphColor={m.selected ? COLOR[m.tone ?? "ink"] : "#ffffff"} scale={m.selected ? 1.3 : m.tone === "scarlet" ? 1 : 0.85} />
              </AdvancedMarker>))}
          </GMap>
        </APIProvider>
      </div>
    );
  }
  return (
    <div className={`overflow-hidden rounded-md border border-rule ${className}`}>
      <MapContainer key={`${center[0]},${center[1]},${zoom}`} center={center} zoom={zoom} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        {pts.map((m) => (
          <CircleMarker key={m.id} center={[m.lat, m.lng]} radius={m.selected ? 12 : m.tone === "scarlet" ? 8 : 6}
            pathOptions={{ color: COLOR[m.tone ?? "ink"], fillColor: m.selected ? COLOR.selected : COLOR[m.tone ?? "ink"], fillOpacity: 0.9, weight: 2 }}
            eventHandlers={{ click: () => onSelect?.(m.id) }}>
            <Popup><strong>{m.name}</strong>{m.sub ? <><br />{m.sub}</> : null}</Popup>
          </CircleMarker>))}
      </MapContainer>
    </div>
  );
}
