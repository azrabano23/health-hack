// Surface: chat. Talk to ScarletWell; add a meal photo. Retrieval plus the model when the engine has credentials;
// template replies otherwise, and the screen says which. Nothing typed here leaves the laptop except to our engine.
import { useEffect, useRef, useState } from "react";
import { api } from "@/api/client";
import type { ChatReply, FoodReply } from "@/api/types";
import type { PageRoute } from "@/App";
import { PageHead, Source } from "@/components/ui";

export const route: PageRoute = { path: "/chat", label: "Chat", order: 3.7, owner: "team", student: true };

type Turn = { role: "user" | "assistant"; content: string; meta?: string; photo?: string };
const OPENERS = ["I can't afford groceries this month", "I haven't slept and I feel sick", "I feel alone since I moved here", "No idea what to do after graduation"];

export default function Chat() {
  const [turns, setTurns] = useState<Turn[]>([{ role: "assistant", content: "Hey. What is going on today? You can also send a photo of a meal and I will say something kind and useful about it." }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [campus, setCampus] = useState<"nb" | "nwk" | "cam">("nb");
  const [llm, setLlm] = useState<{ available: boolean; model: string | null } | null>(null);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [voice, setVoice] = useState<{ available: boolean } | null>(null);
  const [talk, setTalk] = useState(false);   // read replies aloud
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { api.voiceStatus().then(setVoice); }, []);
  useEffect(() => { api.llmStatus().then(setLlm); }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [turns]);

  async function send(msg: string) {
    if (!msg.trim() || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: msg }];
    setTurns(next); setText(""); setBusy(true);
    const r: ChatReply = await api.chat({ messages: next.filter((t) => !t.photo).map(({ role, content }) => ({ role, content })), campus, lang });
    setTurns([...next, { role: "assistant", content: r.reply, meta: `${r.method} · ${r.context.dimension}` }]);
    setBusy(false);
    if (talk) api.speak(r.reply, r.lang ?? "en");
  }
  async function mic() {
    if (rec) { rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream), chunks: Blob[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRec(null);
        const said = await api.listen(new Blob(chunks, { type: mr.mimeType }), lang);
        if (said) { setTalk(true); send(said); }
      };
      mr.start(); setRec(mr);
    } catch { /* mic blocked: typing still works */ }
  }
  async function photo(f: File | undefined) {
    if (!f || busy) return;
    setBusy(true);
    const b64 = await new Promise<string>((res) => { const rd = new FileReader(); rd.onload = () => res(String(rd.result).split(",")[1]); rd.readAsDataURL(f); });
    const url = URL.createObjectURL(f);
    const next: Turn[] = [...turns, { role: "user", content: "(meal photo)", photo: url }];
    setTurns(next);
    const r: FoodReply = await api.foodPhoto({ image_b64: b64, media_type: f.type || "image/jpeg" });
    setTurns([...next, { role: "assistant", content: [r.description, r.strength, r.one_small_thing].filter(Boolean).join(" "), meta: r.method }]);
    setBusy(false);
  }

  return (
    <section className="flex min-h-[70vh] flex-col">
      <PageHead kicker={llm?.available ? `ScarletWell · ${llm.model}` : "ScarletWell · template replies (no model configured)"} title="Chat" sub="A friend who knows the campus. Places and events come from our registry, never invented." />
      <div className="mt-3 flex gap-2">
        {(["en", "es"] as const).map((k) => <button key={k} onClick={() => setLang(k)} className={`rounded-[8px] border-[1.5px] px-3 py-1 text-[13px] ${lang === k ? "border-ink bg-ink text-white" : "border-rule"}`}>{k === "en" ? "English" : "Español"}</button>)}
        <button onClick={() => { setTalk(!talk); if (talk) speechSynthesis?.cancel(); }} className={`rounded-[8px] border-[1.5px] px-3 py-1 text-[13px] ${talk ? "border-ink bg-ink text-white" : "border-rule"}`} aria-pressed={talk}>Read aloud</button>
        {(["nb", "nwk", "cam"] as const).map((k) => <button key={k} onClick={() => setCampus(k)} className={`rounded-[8px] border-[1.5px] px-3 py-1 text-[13px] ${campus === k ? "border-ink bg-ink text-white" : "border-rule"}`}>{{ nb: "New Brunswick", nwk: "Newark", cam: "Camden" }[k]}</button>)}
      </div>
      <ol className="mt-4 flex-1 space-y-3">
        {turns.map((t, i) => (
          <li key={i} className={`max-w-[88%] rounded-[16px] px-4 py-3 text-[15px] leading-relaxed ${t.role === "user" ? "ml-auto bg-ink text-white" : "bg-white border-[1.5px] border-rule"}`}>
            {t.photo && <img src={t.photo} alt="meal" className="mb-2 max-h-48 rounded-[10px]" />}
            <p>{t.content}</p>
            {t.role === "assistant" && <button onClick={() => api.speak(t.content, lang)} className="mt-1 text-[12px] underline" aria-label="Listen to this reply">Listen</button>}
            {t.meta && <p className="mt-1 text-[11px] opacity-60">{t.meta}</p>}
          </li>))}
        {busy && <li className="text-[13px] text-soft">thinking…</li>}
        <div ref={bottom} />
      </ol>
      {turns.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2">{OPENERS.map((o) => <button key={o} onClick={() => send(o)} className="rounded-full border-[1.5px] border-rule px-3 py-1 text-[13px] hover:border-ink">{o}</button>)}</div>
      )}
      <form className="sticky bottom-20 mt-4 flex gap-2 md:bottom-4" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-[10px] border-[1.5px] border-rule bg-white" title="Add a meal photo">
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => photo(e.target.files?.[0])} aria-label="Meal photo" />
          <span aria-hidden>📷</span>
        </label>
        {voice?.available && <button type="button" onClick={mic} disabled={busy} className={`grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border-[1.5px] ${rec ? "border-ink bg-ink text-white" : "border-rule bg-white"}`} aria-label={rec ? "Stop and send" : "Talk to ScarletWell"} aria-pressed={!!rec}><span aria-hidden>{rec ? "■" : "🎤"}</span></button>}
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Say what is going on" className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-rule bg-white px-3 py-2 text-[15px]" aria-label="Message" />
        <button className="btn btn-primary" type="submit" disabled={busy}>Send</button>
      </form>
      <Source text="places, events and links from data/; model replies pass the forbidden-word check in engine/recommend/llm.py; CAPS 848-932-7884 and 988 any hour" />
    </section>
  );
}
