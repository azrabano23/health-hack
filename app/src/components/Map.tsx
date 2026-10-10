// One map for Nearby and Feedback. Google Maps when VITE_GOOGLE_MAPS_API_KEY is set, Leaflet with OpenStreetMap otherwise,
// so fixtures mode and CI need no key. Same props either way. Markers without coordinates (online programs) are skipped.
import "leaflet/dist/leaflet.css";
import { APIProvider, AdvancedMarker, Map as GMap, Pin } from "@vis.gl/react-google-maps";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

export interface MapMarker { id: string; name: string; lat: number | null; lng: number | null; selected?: boolean; sub?: string }
export interface MapProps { markers: MapMarker[]; center: [number, number]; zoom?: number; onSelect?: (id: string) => void; className?: string }

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
export const MAP_PROVIDER = KEY ? "google" : "leaflet";

export function Map({ markers, center, zoom = 14, onSelect, className = "h-72" }: MapProps) {
  const pts = markers.filter((m): m is MapMarker & { lat: number; lng: number } => m.lat != null && m.lng != null);
  if (KEY) {
    return (
      <div className={`overflow-hidden rounded-md border border-rule ${className}`}>
        <APIProvider apiKey={KEY}>
          <GMap defaultCenter={{ lat: center[0], lng: center[1] }} defaultZoom={zoom} mapId="scarletwell-light" gestureHandling="greedy"
            disableDefaultUI clickableIcons={false} style={{ width: "100%", height: "100%" }}>
            {pts.map((m) => (
              <AdvancedMarker key={m.id} position={{ lat: m.lat, lng: m.lng }} title={m.name} onClick={() => onSelect?.(m.id)}>
                <Pin background={m.selected ? "#ffff11" : "#1c2024"} borderColor="#1c2024" glyphColor={m.selected ? "#1c2024" : "#ffff11"} scale={m.selected ? 1.3 : 0.9} />
              </AdvancedMarker>))}
          </GMap>
        </APIProvider>
      </div>
    );
  }
  return (
    <div className={`overflow-hidden rounded-md border border-rule ${className}`}>
      <MapContainer key={`${center[0]},${center[1]}`} center={center} zoom={zoom} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        {pts.map((m) => (
          <CircleMarker key={m.id} center={[m.lat, m.lng]} radius={m.selected ? 12 : 8}
            pathOptions={{ color: "#1c2024", fillColor: m.selected ? "#ffff11" : "#1c2024", fillOpacity: 0.9, weight: 2 }}
            eventHandlers={{ click: () => onSelect?.(m.id) }}>
            <Popup><strong>{m.name}</strong>{m.sub ? <><br />{m.sub}</> : null}</Popup>
          </CircleMarker>))}
      </MapContainer>
    </div>
  );
}
