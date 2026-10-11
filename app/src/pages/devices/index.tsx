// Surface: devices. Bring your own sleep and steps from whichever watch or ring you wear. The file stays on this phone;
// it annotates your own trend and fires the watch nudges (short night, barely moved, cooped up). Never sent to the
// engine or the aggregate. Export today; a direct sign-in to each brand needs a registered app and comes after the event.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { PageRoute } from "@/App";
import { Card, Eyebrow, Source, Title } from "@/components/ui";
import { loadWearable, mean, movementSummary, parseWearableCsv, saveWearable, syntheticWearable, type WearableStore } from "@/data/wearable";

export const route: PageRoute = { path: "/devices", label: "Devices", order: 4.7, owner: "team" };

type Provider = { id: string; name: string; gives: string; steps: string[]; note?: string; live?: "fitbit" | "oura" | "whoop" | "googlefit" };
const PROVIDERS: Provider[] = [
  { id: "apple", name: "Apple Watch", gives: "sleep, steps", steps: ["Health app, your picture top right, Export All Health Data (a zip of XML).", "Turn it into CSV with an export app such as Health Auto Export, picking Sleep and Step Count, daily.", "Choose that CSV below."] },
  { id: "oura", live: "oura", name: "Oura", gives: "sleep, steps, readiness (we read sleep and steps)", steps: ["Sign in at cloud.ouraring.com.", "Export Data, choose Sleep and Activity, CSV.", "Choose the file below."] },
  { id: "whoop", live: "whoop", name: "Whoop", gives: "sleep (strain and recovery are ignored)", steps: ["Whoop app, More, App Settings, Data Export.", "Whoop emails you a zip; the sleeps CSV has a date and hours of sleep.", "Choose that CSV below."] },
  { id: "fitbit", live: "fitbit", name: "Fitbit and Pixel Watch", gives: "sleep, steps", steps: ["fitbit.com, Settings, Data Export.", "Custom export: tick Sleep and Activities, CSV, up to 31 days at a time.", "Choose the file below (several files are fine, one after another)."] },
  { id: "garmin", name: "Garmin", gives: "sleep, steps", steps: ["connect.garmin.com, Reports, Health and Fitness.", "Open Steps, then Sleep, and use the export icon for CSV on each.", "Choose each file below."] },
  { id: "samsung", name: "Samsung Galaxy Watch", gives: "sleep, steps", steps: ["Samsung Health app, Settings, Download personal data.", "Pick the step count and sleep CSVs from the folder it writes.", "Choose them below."] },
  { id: "googlefit", live: "googlefit", name: "Google Fit", gives: "sleep, steps", steps: ["takeout.google.com, deselect all, tick Fit.", "In the download, Daily activity metrics.csv has a date, steps and sleep minutes.", "Choose that CSV below."] },
];

export default function Devices() {
  const [store, setStore] = useState<WearableStore | null>(loadWearable);
  const [msg, setMsg] = useState<string>();
  const [open, setOpen] = useState<string>();
  const [live, setLive] = useState<Record<string, { configured: boolean }> | null>(null);
  const [liveMsg, setLiveMsg] = useState<string>();
  useEffect(() => { api.wearablesStatus().then(setLive); }, []);
  useEffect(() => {
    // the maker's page sends the student back to the engine, which posts {wearable, sid} to this window
    const onMsg = async (e: MessageEvent) => {
      const d = e.data as { wearable?: { ok: boolean; why?: string }; sid?: string };
      if (!d?.wearable || !d.sid) return;
      if (!d.wearable.ok) { setLiveMsg(`Could not connect: ${d.wearable.why}`); return; }
      const r = await api.wearablesDaily(d.sid);
      if (!r.ok || !r.rows) { setLiveMsg(`Signed in, but the read failed: ${r.why}`); return; }
      const rows = r.rows.filter((x) => x.sleep_h != null || x.steps != null);
      const s: WearableStore = { rows, source: `${r.provider} (live sign-in)`, synthetic: false, imported: new Date().toISOString().slice(0, 10) };
      saveWearable(s); setStore(s); setLiveMsg(`${rows.length} days read live from ${r.provider}. Held on this phone; the engine forgets the sign-in on restart.`);
    };
    window.addEventListener("message", onMsg); return () => window.removeEventListener("message", onMsg);
  }, []);
  async function signIn(provider: NonNullable<Provider["live"]>) {
    const r = await api.wearablesStart(provider);
    if (!r.configured || !r.url) { setLiveMsg(r.why ?? "Not configured."); return; }
    setLiveMsg(`Opening ${provider}'s sign-in. Allow sleep and activity, then come back here.`);
    window.open(r.url, "scarletwell-wearable", "width=520,height=720");
  }

  function importText(text: string, source: string) {
    const { rows, warnings } = parseWearableCsv(text);
    if (!rows.length) { setMsg(warnings.join(" ") || "No usable rows in that file."); return; }
    const prev = store && !store.synthetic ? store.rows : [];
    const byDay = new Map(prev.map((r) => [r.date, r]));
    for (const r of rows) byDay.set(r.date, { ...byDay.get(r.date), ...r, sleep_h: r.sleep_h ?? byDay.get(r.date)?.sleep_h ?? null, steps: r.steps ?? byDay.get(r.date)?.steps ?? null });
    const merged = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
    const s: WearableStore = { rows: merged, source, synthetic: false, imported: new Date().toISOString().slice(0, 10) };
    saveWearable(s); setStore(s); setMsg(`${rows.length} days read from ${source}${prev.length ? `, ${merged.length} days in total` : ""}${warnings.length ? ". " + warnings.join(" ") : "."}`);
  }
  function onFile(f: File | undefined, source: string) { if (f) f.text().then((t) => importText(t, source)); }

  const sleep = store ? mean(store.rows.map((r) => r.sleep_h).filter((v): v is number => v != null)) : null;
  const steps = store ? mean(store.rows.map((r) => r.steps).filter((v): v is number => v != null)) : null;
  const move = store ? movementSummary(store.rows) : null;
  const last3 = store ? store.rows.slice(-3) : [];
  const cooped = last3.length === 3 && last3.every((r) => (r.steps ?? 99999) < 4000);

  return (
    <section className="space-y-4">
      <Title>Your devices</Title>
      <p className="text-[16px] leading-relaxed">Bring sleep and steps from the watch or ring you already wear. The file stays in this browser. It draws the sleep bars on your trend and fires the watch nudges: short night, barely moved, cooped up. Staff never see it.</p>

      {store ? (
        <Card className="border-ink">
          <Eyebrow>{store.synthetic ? store.source : `Connected by export · ${store.source}`}</Eyebrow>
          <p className="mt-1 text-[15px]">{store.rows.length} days, {store.rows[0]?.date} to {store.rows[store.rows.length - 1]?.date}.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div><p className="num text-[28px] font-bold">{sleep != null ? sleep.toFixed(1) : "–"}</p><p className="text-[13px] text-soft">hours of sleep a night, average</p></div>
            <div><p className="num text-[28px] font-bold">{steps != null ? Math.round(steps).toLocaleString() : "–"}</p><p className="text-[13px] text-soft">steps a day, average</p></div>
          </div>
          {move && <div className="mt-3 rounded border border-rule bg-canvas p-3"><Eyebrow>Movement this week</Eyebrow><p className="mt-1 text-[15px]">{move.sentence}</p></div>}
          <div className="mt-3 rounded border border-rule bg-canvas p-3">
            <Eyebrow>Watch nudges armed</Eyebrow>
            <p className="mt-1 text-[14px]">Short night under 6.5 hours, barely moved by mid afternoon, and cooped up (three days in a row under 4,000 steps in an exam week){cooped ? ". The last three days qualify, so Your day shows the cooped-up nudge now." : "."} Turn any off on <Link to="/profile" className="underline">About you</Link>.</p>
          </div>
          <div className="mt-3 flex gap-4 text-[15px]">
            <Link to="/trend" className="underline">See it on your twin</Link>
            <Link to="/day" className="underline">See your day</Link>
            <button onClick={() => { saveWearable(null); setStore(null); setMsg("Removed from this phone."); }} className="underline">Remove</button>
          </div>
        </Card>
      ) : (
        <Card>
          <Eyebrow>Nothing connected yet</Eyebrow>
          <p className="mt-1 text-[15px]">Pick your device below, or <button onClick={() => { const s = syntheticWearable(); saveWearable(s); setStore(s); setMsg("Synthetic sample loaded."); }} className="underline">load the synthetic sample</button> to see how it looks.</p>
        </Card>
      )}
      {(msg || liveMsg) && <p className="text-[13px] text-soft">{liveMsg ?? msg}</p>}

      <Eyebrow>Connect a device</Eyebrow>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {PROVIDERS.map((p) => {
          const on = open === p.id;
          return (
            <div key={p.id} className={`card p-4 ${on ? "border-ink md:col-span-2" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div><p className="display text-[18px] leading-tight">{p.name}</p><p className="mt-1 text-[13px] text-soft">{p.gives}</p></div>
                <button onClick={() => setOpen(on ? undefined : p.id)} className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-bold ${on ? "border-[1.5px] border-rule" : "bg-scarlet text-white"}`}>{on ? "Close" : "Connect"}</button>
              </div>
              {on && (
                <div className="mt-3">
                  {p.live && (
                    <div className="mb-3 rounded-[10px] border-[1.5px] border-rule bg-canvas p-3">
                      <p className="text-[14px] font-bold">Live: sign in with {p.name}</p>
                      <p className="mt-1 text-[13px] text-soft">{live?.[p.live]?.configured ? "The engine reads the last two weeks of sleep and steps through the maker's API with your own sign-in, holds the token in memory only, and this phone keeps the rows." : `Ready in code; the engine needs ${p.live.toUpperCase()}_CLIENT_ID, ${p.live.toUpperCase()}_CLIENT_SECRET and WEARABLE_REDIRECT from a registered ${p.name} developer app. Until then, export below.`}</p>
                      <button className="btn btn-primary mt-2 !px-4 !py-2 !text-[14px] disabled:opacity-40" disabled={!live?.[p.live]?.configured} onClick={() => signIn(p.live!)}>Sign in with {p.name}</button>
                    </div>)}
                  <p className="text-[14px] font-bold">Or export a file</p>
                  <ol className="list-decimal space-y-1 pl-5 text-[14px]">{p.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                  <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0], p.name)} className="mt-3 block w-full text-[14px]" aria-label={`${p.name} CSV file`} />
                  <p className="mt-2 text-[13px] text-soft">Needs a date column plus sleep (hours or minutes) and/or steps; column names are matched loosely.{p.live ? "" : ` ${p.name} has no web API for this; export is the only path.`}</p>
                </div>
              )}
            </div>);
        })}
        <div className="card p-4">
          <p className="display text-[18px] leading-tight">Any other CSV</p>
          <p className="mt-1 text-[13px] text-soft">date, sleep, steps</p>
          <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0], e.target.files?.[0]?.name ?? "CSV")} className="mt-3 block w-full text-[13px]" aria-label="CSV file" />
        </div>
      </div>

      <Card>
        <Eyebrow>Glucose sensors</Eyebrow>
        <p className="mt-1 text-[15px]">A Dexcom or Libre sensor is set on <Link to="/profile" className="underline">About you</Link>. A reading it reports can trigger one nudge and nothing else: we do not import glucose history, chart it, score it or predict it. That is the line our physicians drew.</p>
      </Card>

      <Source text="rows stay on this phone and never reach the aggregate; live reads pass through the engine with the student's own sign-in and are held in memory only (engine/recommend/wearables.py); export steps from each maker's own help pages, checked October 2026" />
    </section>
  );
}
