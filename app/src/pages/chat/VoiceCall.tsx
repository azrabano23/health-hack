// A hands-free voice call: the orb listens (mic level), thinks, then speaks the reply (audio level) and listens again.
// Speech to text and the reply voice go through our engine (ElevenLabs when it has a key, the browser voice otherwise).
import { useEffect, useRef, useState } from "react";
import { api } from "@/api/client";

type CallState = "idle" | "listening" | "thinking" | "speaking";
const LABEL: Record<CallState, string> = { idle: "Connecting", listening: "Listening", thinking: "Thinking", speaking: "Speaking" };
const SPEECH = 0.06, SILENCE_MS = 1100, BARGE_IN = 0.28;

export default function VoiceCall({ lang, onTurn, onEnd }: { lang: "en" | "es"; onTurn: (said: string) => Promise<string>; onEnd: () => void }) {
  const [state, setState] = useState<CallState>("idle");
  const [error, setError] = useState("");
  const orb = useRef<HTMLDivElement>(null);
  const st = useRef<CallState>("idle");
  const out = useRef<AnalyserNode | null>(null);   // reply audio level
  const live = useRef(true);
  const turn = useRef(onTurn); turn.current = onTurn;
  const set = (s: CallState) => { st.current = s; setState(s); };

  useEffect(() => {
    live.current = true;
    let stream: MediaStream | undefined, ctx: AudioContext | undefined, raf = 0;
    const level = (an: AnalyserNode) => {
      const b = new Uint8Array(an.fftSize); an.getByteTimeDomainData(b);
      let sum = 0; for (const v of b) sum += ((v - 128) / 128) ** 2;
      return Math.min(1, Math.sqrt(sum / b.length) * 4);
    };
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch { setError("Microphone is blocked. You can still type."); return; }
      ctx = new AudioContext();
      const mic = ctx.createAnalyser(); mic.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(mic);
      let mr: MediaRecorder | null = null, chunks: Blob[] = [], heard = false, lastVoice = 0, loud = 0, t0 = 0;

      const begin = () => {
        chunks = []; heard = false; lastVoice = performance.now();
        mr = new MediaRecorder(stream!);
        mr.ondataavailable = (e) => chunks.push(e.data);
        mr.onstop = async () => {
          if (!live.current) return;
          const keep = heard;
          const blob = new Blob(chunks, { type: mr?.mimeType });
          if (!keep) { begin(); return; }
          set("thinking");
          const said = await api.listen(blob, lang);
          if (!live.current) return;
          if (!said?.trim()) { set("listening"); begin(); return; }
          const reply = await turn.current(said);
          if (!live.current) return;
          set("speaking"); t0 = performance.now(); loud = 0;
          await api.speak(reply, lang, { wait: true, onAudio: (a) => {
            const src = ctx!.createMediaElementSource(a), an = ctx!.createAnalyser(); an.fftSize = 1024;
            src.connect(an); an.connect(ctx!.destination); out.current = an;
          } });
          out.current = null;
          if (!live.current) return;
          set("listening"); begin();
        };
        mr.start(); set("listening");
      };
      begin();

      const tick = (now: number) => {
        const s = st.current;
        let lvl = 0;
        if (s === "listening") {
          lvl = level(mic);
          if (lvl > SPEECH) { heard = true; lastVoice = now; }
          else if (heard && now - lastVoice > SILENCE_MS && mr?.state === "recording") mr.stop();
        } else if (s === "speaking") {
          lvl = out.current ? level(out.current) : 0.25 + 0.2 * Math.sin((now - t0) / 140);   // browser voice has no audio tap
          loud = level(mic) > BARGE_IN ? loud + 1 : 0;
          if (loud > 12) { api.hush(); loud = 0; }
        }
        orb.current?.style.setProperty("--lvl", lvl.toFixed(3));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();
    return () => { live.current = false; cancelAnimationFrame(raf); api.hush(); stream?.getTracks().forEach((t) => t.stop()); ctx?.close(); };
  }, [lang]);

  return (
    <div className="flex flex-col items-center rounded-[20px] border-[1.5px] border-rule bg-white px-4 py-6" role="dialog" aria-label="Voice call">
      <button type="button" onClick={() => api.hush()} className="rounded-full focus-visible:outline-2" aria-label="Interrupt">
        <div ref={orb} className="orb" data-state={state}><div className="orb-core" /></div>
      </button>
      <p className="mt-4 text-[17px] font-bold" aria-live="polite">{error || LABEL[state]}</p>
      <p className="mt-1 text-[13px] text-soft">{state === "speaking" ? "Talk or tap to interrupt" : "Just talk. I will answer when you pause."}</p>
      <button type="button" onClick={onEnd} className="btn btn-ink mt-4 px-5 py-2 text-[15px]">End call</button>
    </div>
  );
}
