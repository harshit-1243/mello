"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Test Mello — talk to the REAL agent (brain + tools + booking engine) by chat
 * or mic, with her voice played back. Runs through /api/test/* → the voice
 * agent server, so every turn persists to Supabase (call_logs + transcripts +
 * tool_calls) and a confirmed booking fires the WhatsApp confirmation.
 *
 * Requires the agent server running: `cd agent/server && npm run dev`.
 */

interface Msg {
  role: "mello" | "you";
  text: string;
}

const PERSONAS = [
  { label: "Harshit (member)", phone: "+918369851507" },
  { label: "Manan (member · Group 1)", phone: "+919653679703" },
  { label: "Bitu (member · both groups)", phone: "+918976019902" },
  { label: "New caller (non-member)", phone: "+919000000001" },
];

export default function TestPage() {
  const [persona, setPersona] = useState(PERSONAS[0].phone);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const sessionId = useRef<string>("");
  const recognitionRef = useRef<unknown>(null);
  const voiceOnRef = useRef(true);
  voiceOnRef.current = voiceOn;

  function playAudio(base64: string | null) {
    if (!base64) return;
    try {
      void new Audio(`data:audio/wav;base64,${base64}`).play();
    } catch {
      /* autoplay may be blocked until first interaction — ignore */
    }
  }

  async function call(action: "start" | "message" | "speak", payload: Record<string, unknown>) {
    const res = await fetch(`/api/test/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  /** Fetch + play Mello's voice for already-shown text, in the background. */
  function speak(text: string) {
    if (!voiceOnRef.current || !text) return;
    void call("speak", { text }).then((d) => playAudio(d.audio));
  }

  async function start() {
    setBusy(true);
    setError(null);
    setMessages([]);
    sessionId.current = `dash-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // withAudio:false → text comes back without waiting on TTS; voice loads after.
    const data = await call("start", { sessionId: sessionId.current, callerPhone: persona, withAudio: false });
    setBusy(false);
    if (data.error) return setError(humanError(data));
    setStarted(true);
    setMessages([{ role: "mello", text: data.reply }]);
    speak(data.reply);
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "you", text: t }]);
    setBusy(true);
    const data = await call("message", { sessionId: sessionId.current, text: t, withAudio: false });
    setBusy(false);
    if (data.error) return setError(humanError(data));
    setMessages((m) => [...m, { role: "mello", text: data.reply }]);
    speak(data.reply);
  }

  function toggleMic() {
    const SR =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR) {
      setError("This browser doesn't support voice input. Use Chrome, or just type.");
      return;
    }
    if (listening) {
      (recognitionRef.current as { stop: () => void } | null)?.stop();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new (SR as any)();
    rec.lang = "en-IN"; // handles English + Hinglish reasonably
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.onresult = (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
      const heard = e.results[0][0].transcript;
      setInput(heard);
      void send(heard);
    };
    recognitionRef.current = rec;
    rec.start();
  }

  return (
    <>
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-semibold tracking-tightest text-ink">Test Mello</h1>
          <p className="mt-1.5 text-[14px] text-ink-muted">
            Talk to the real agent by chat or mic. Every turn is saved to your database — it&rsquo;ll appear under{" "}
            <span className="font-semibold text-ink">Calls</span>, and a confirmed booking sends the WhatsApp message.
          </p>
        </div>
      </header>

      <div className="mx-auto flex h-[clamp(440px,68vh,720px)] max-w-[760px] flex-col overflow-hidden rounded-2xl border border-line bg-paper-raised">
        {/* control bar */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <label className="text-[12.5px] font-semibold text-ink-muted">Calling as</label>
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            disabled={started}
            className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[13px] font-medium text-ink disabled:opacity-60"
          >
            {PERSONAS.map((p) => (
              <option key={p.phone} value={p.phone}>
                {p.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setVoiceOn((v) => !v)}
            title={voiceOn ? "Voice on — click to mute" : "Muted — click for voice"}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold transition-colors",
              voiceOn ? "border-line text-ink hover:bg-ink/[0.04]" : "border-line text-ink-muted",
            )}
          >
            {voiceOn ? "🔊 Voice" : "🔇 Muted"}
          </button>
          <div className="ml-auto">
            {!started ? (
              <button
                onClick={start}
                disabled={busy}
                className="rounded-lg bg-green px-3.5 py-2 text-[13px] font-semibold text-on-green transition-colors hover:bg-green-press disabled:opacity-60"
              >
                {busy ? "Connecting…" : "Start call"}
              </button>
            ) : (
              <button
                onClick={() => {
                  setStarted(false);
                  setMessages([]);
                }}
                className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-muted hover:text-ink"
              >
                End & reset
              </button>
            )}
          </div>
        </div>

        {/* transcript */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
          {messages.length === 0 && !error && (
            <p className="m-auto max-w-[340px] text-center text-[13.5px] text-ink-muted">
              Pick who&rsquo;s calling and hit <span className="font-semibold text-ink">Start call</span>. Try:{" "}
              <em>&ldquo;kal 8 baje badminton book karna hai&rdquo;</em>
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "you" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed",
                  m.role === "mello"
                    ? "rounded-bl-sm bg-green/[0.1] text-ink"
                    : "rounded-br-sm border border-line bg-paper text-ink",
                )}
              >
                <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  {m.role === "mello" ? "Mello" : "You"}
                </div>
                {m.text}
              </div>
            </div>
          ))}
          {busy && <div className="text-[12.5px] text-ink-muted">Mello is thinking…</div>}
          {error && (
            <div className="rounded-lg border border-danger/40 bg-danger/[0.06] px-3.5 py-2.5 text-[13px] text-danger">
              {error}
            </div>
          )}
        </div>

        {/* input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2 border-t border-line px-3 py-3"
        >
          <button
            type="button"
            onClick={toggleMic}
            disabled={!started || busy}
            title="Speak"
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors disabled:opacity-40",
              listening ? "border-green bg-green/15 text-green" : "border-line text-ink-muted hover:text-ink",
            )}
          >
            <MicIcon />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!started || busy}
            placeholder={started ? "Type a message…" : "Start the call first"}
            className="flex-1 rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-green disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!started || busy || !input.trim()}
            className="rounded-xl bg-green px-4 py-2.5 text-[14px] font-semibold text-on-green transition-colors hover:bg-green-press disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>

      <p className="mx-auto mt-3 max-w-[760px] text-center text-[12px] text-ink-muted">
        {listening ? "🎙 Listening… speak now" : "Mic uses your browser's speech-to-text. Needs the agent server running on :8080."}
      </p>
    </>
  );
}

function humanError(data: { error?: string; detail?: string }): string {
  if (data.error === "agent_unreachable") return data.detail || "Can't reach the voice agent server.";
  if (data.error === "no_session") return "Session expired — hit Start call again.";
  return data.detail || `Something went wrong (${data.error}).`;
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v4" />
    </svg>
  );
}
