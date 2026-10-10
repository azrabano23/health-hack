// Surface: devices. Bring your own sleep and steps. Stays on this phone; never sent to the engine or the aggregate.
import { useState } from "react";
import { Link } from "react-router-dom";
import type { PageRoute } from "@/App";
import { Card, Eyebrow, Source, Title } from "@/components/ui";
import { loadWearable, mean, parseWearableCsv, saveWearable, syntheticWearable, type WearableStore } from "@/data/wearable";

export const route: PageRoute = { path: "/devices", label: "Devices", order: 4.7, owner: "team" };

export default function Devices() {
  const [store, setStore] = useState<WearableStore | null>(loadWearable);
  const [msg, setMsg] = useState<string>();

  function importText(text: string, source: string) {
    const { rows, warnings } = parseWearableCsv(text);
    if (!rows.length) { setMsg(warnings.join(" ")); return; }
    const s: WearableStore = { rows, source, synthetic: false, imported: new Date().toISOString().slice(0, 10) };
    saveWearable(s); setStore(s); setMsg(`${rows.length} days imported${warnings.length ? ". " + warnings.join(" ") : "."}`);
  }
  function onFile(f: File | undefined) { if (f) f.text().then((t) => importText(t, f.name)); }

  const sleep = store ? mean(store.rows.map((r) => r.sleep_h).filter((v): v is number => v != null)) : null;
  const steps = store ? mean(store.rows.map((r) => r.steps).filter((v): v is number => v != null)) : null;

  return (
    <section className="space-y-4">
      <Title>Your watch, your phone</Title>
      <p className="text-sm text-soft">Bring sleep and steps from a Fitbit, Apple Health, Oura or Garmin export. It stays in this browser and only annotates your own trend. Staff never see it.</p>

      {store ? (
        <Card>
          <Eyebrow>{store.synthetic ? "Synthetic sample" : "Imported"} · {store.source}</Eyebrow>
          <p className="mt-1 text-sm">{store.rows.length} days, {store.rows[0]?.date} to {store.rows[store.rows.length - 1]?.date}.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div><p className="font-mono text-2xl">{sleep != null ? sleep.toFixed(1) : "–"}</p><p className="text-xs text-soft">hours of sleep a night, average</p></div>
            <div><p className="font-mono text-2xl">{steps != null ? Math.round(steps).toLocaleString() : "–"}</p><p className="text-xs text-soft">steps a day, average</p></div>
          </div>
          <div className="mt-3 flex gap-3 text-sm">
            <Link to="/trend" className="underline">See it on your trend</Link>
            <button onClick={() => { saveWearable(null); setStore(null); setMsg("Removed from this phone."); }} className="underline">Remove</button>
          </div>
        </Card>
      ) : (
        <Card>
          <Eyebrow>Nothing imported yet</Eyebrow>
          <p className="mt-1 text-sm">Pick a CSV export, or load the synthetic sample to see how it looks.</p>
        </Card>
      )}

      <Card>
        <Eyebrow>Import a CSV</Eyebrow>
        <p className="mt-1 text-xs text-soft">Needs a date column plus a sleep column (hours or minutes) and/or a steps column. Fitbit: Settings, Data Export, choose Sleep and Activities, CSV. Apple Health: export, then convert with any Health-to-CSV app.</p>
        <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="mt-3 block w-full text-sm" aria-label="CSV file" />
        <button onClick={() => { const s = syntheticWearable(); saveWearable(s); setStore(s); setMsg("Synthetic sample loaded."); }} className="btn btn-ghost mt-3">Load the synthetic sample</button>
        {msg && <p className="mt-2 text-xs text-soft">{msg}</p>}
      </Card>

      <Source text="on-device only; no wearable value is sent to the engine or the campus aggregate" />
    </section>
  );
}
