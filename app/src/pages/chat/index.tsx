// Surface: chat. Talk to ScarletWell; add a meal photo. Retrieval plus the model when the engine has credentials;
// template replies otherwise, and the screen says which. Nothing typed here leaves the laptop except to our engine.
import { useEffect, useRef, useState } from "react";
import { api } from "@/api/client";
import type { ChatReply, FoodReply } from "@/api/types";
import type { PageRoute } from "@/App";
import { aboutForChat, loadProfile } from "@/data/profile";
import { PageHead, Source } from "@/components/ui";
import VoiceCall from "./VoiceCall";

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
  const [call, setCall] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { api.voiceStatus().then(setVoice); }, []);
  useEffect(() => { api.llmStatus().then(setLlm); }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [turns]);

  async function send(msg: string, inCall = false): Promise<string> {
    if (!msg.trim() || busy) return "";
    const next: Turn[] = [...turns, { role: "user", content: msg }];
    setTurns(next); setText(""); setBusy(true);
    const r: ChatReply = await api.chat({ messages: next.filter((t) => !t.photo).map(({ role, content }) => ({ role, content })), campus, lang, about: aboutForChat(loadProfile()) });
    setTurns([...next, { role: "assistant", content: r.reply, meta: `${r.method}${r.context.dimension ? ` · ${r.context.dimension}` : ""}` }]);
    setBusy(false);
    if (talk && !inCall) api.speak(r.reply, r.lang ?? "en");
    return r.reply;
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
      {call && <div className="sticky bottom-20 mt-4 md:bottom-4"><VoiceCall available={!!voice?.available} lang={lang} onTurn={(said) => send(said, true)} onEnd={() => setCall(false)} /></div>}
      {!call && <form className="sticky bottom-20 mt-4 flex gap-2 md:bottom-4" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-[10px] border-[1.5px] border-rule bg-white" title="Add a meal photo">
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => photo(e.target.files?.[0])} aria-label="Meal photo" />
          <span aria-hidden>📷</span>
        </label>
        <button type="button" onClick={() => setCall(true)} disabled={busy || call} className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-bold text-white disabled:opacity-50" aria-label="Talk to ScarletWell">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>Talk
        </button>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Say what is going on" className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-rule bg-white px-3 py-2 text-[15px]" aria-label="Message" />
        <button className="btn btn-primary" type="submit" disabled={busy}>Send</button>
      </form>}
      <Source text="places, events and links from data/; model replies pass the forbidden-word check in engine/recommend/llm.py; CAPS 848-932-7884 and 988 any hour" />
    </section>
  );
}
