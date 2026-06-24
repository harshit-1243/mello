"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Orb3D = dynamic(() => import("./Orb3D").then((m) => m.Orb3D), {
  ssr: false,
  loading: () => <div className="orb-loading" aria-hidden />,
});

type Line = { who: string; text: string; start: number; end: number };

/**
 * HeroCall — a real WebGL Voice Orb (Orb3D) that PLAYS the call. Tap the orb to
 * hear it (Sarvam voice); a Web Audio analyser feeds amplitude into the 3D orb
 * (distortion + glow + scale) and the transcript runs as synced captions. No
 * play button — the orb is the control.
 */
export function HeroCall({ size = 500 }: { size?: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ampRef = useRef<number>(0);
  const ctxRef = useRef<{ ctx: AudioContext; analyser: AnalyserNode } | null>(null);

  const [lines, setLines] = useState<Line[]>([]);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    fetch("/audio/hero-call.json")
      .then((r) => r.json())
      .then((d) => setLines(d.lines ?? []))
      .catch(() => {});
  }, []);

  // While playing, feed the live audio amplitude into the 3D orb.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const loop = () => {
      const node = ctxRef.current;
      if (node) {
        const data = new Uint8Array(node.analyser.frequencyBinCount);
        node.analyser.getByteFrequencyData(data);
        let s = 0;
        for (const v of data) s += v;
        ampRef.current = Math.min(1, s / data.length / 100);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  async function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      return;
    }
    if (!ctxRef.current) {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const src = ctx.createMediaElementSource(a);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        ctxRef.current = { ctx, analyser };
      } catch {
        /* analyser unavailable — audio still plays */
      }
    }
    await ctxRef.current?.ctx.resume();
    a.play().catch(() => {});
  }

  const caption = active >= 0 ? lines[active] : null;
  const dim = `min(${size}px, 82vw)`;

  return (
    <div className="flex flex-col items-center">
      <div
        className="orb-stage orb-stage--3d cursor-pointer select-none"
        style={{ width: dim, height: dim }}
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-label={playing ? "Pause the call" : "Play a live Mello call"}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle())}
      >
        <Orb3D ampRef={ampRef} />
      </div>

      {/* caption while playing · subtle hint otherwise */}
      <div className="mt-6 flex h-14 max-w-lg items-start justify-center px-4 text-center">
        {caption ? (
          <p className="text-[1.05rem] leading-snug text-on-stage/90">
            <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.18em] text-signal">
              {caption.who}
            </span>
            {caption.text}
          </p>
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-stage/45">
            {started ? "Tap to replay the call" : "Tap to hear Mello answer a live call"}
          </span>
        )}
      </div>

      <audio
        ref={audioRef}
        src="/audio/hero-call.wav"
        preload="auto"
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setActive(lines.findIndex((l) => t >= l.start && t < l.end));
        }}
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
        }}
        onPause={() => {
          setPlaying(false);
          ampRef.current = 0;
        }}
        onEnded={() => {
          setPlaying(false);
          setActive(-1);
          ampRef.current = 0;
        }}
      />
    </div>
  );
}
