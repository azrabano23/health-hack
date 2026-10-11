// Paste a Google Maps browser key once; it stays in this browser and the maps switch from OpenStreetMap to Google.
// Hidden when the build already carries a key. A browser key should be restricted to the site's referrers in Google Cloud.
import { useState } from "react";
import { keyFromEnv, mapKey, setMapKey } from "@/components/Map";

export function MapKeyControl() {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(mapKey() ?? "");
  if (keyFromEnv) return null;
  if (!open) return <button onClick={() => setOpen(true)} className="text-[12px] text-soft underline underline-offset-2">{mapKey() ? "Google Maps key set · change" : "Use Google Maps"}</button>;
  return (
    <form className="mt-1 flex gap-2" onSubmit={(e) => { e.preventDefault(); setMapKey(v); location.reload(); }}>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Google Maps browser key" className="min-w-0 flex-1 rounded-[8px] border-[1.5px] border-rule bg-white px-2 py-1 text-[13px]" aria-label="Google Maps key" />
      <button className="btn btn-ghost !px-3 !py-1 !text-[13px]" type="submit">Use</button>
      <button className="text-[12px] text-soft underline" type="button" onClick={() => setOpen(false)}>Cancel</button>
    </form>
  );
}
