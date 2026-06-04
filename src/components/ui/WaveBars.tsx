import { cn } from "@/lib/cn";

/**
 * The voice-waveform motif. Bars are laid out with a center-weighted
 * envelope; per-bar shimmer is pure CSS. Overall amplitude is controlled
 * by the `--amp` CSS variable on the container (driven by GSAP in the hero,
 * left at rest elsewhere).
 */
export function WaveBars({
  count = 56,
  className,
  style,
}: {
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  // NOTE: values are rounded to fixed strings so the server and client render
  // byte-identical markup (Math.sin can differ in the last ULP across runtimes,
  // which would otherwise trigger a hydration mismatch).
  const bars = Array.from({ length: count }, (_, i) => {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const env = Math.sin(t * Math.PI); // 0 at edges → 1 at center
    const h = (10 + Math.pow(env, 0.82) * 86).toFixed(2); // percent height
    const d = (((i * 37) % 11) * 0.07).toFixed(2); // pseudo-random delay
    const dur = (0.85 + ((i * 53) % 7) * 0.12).toFixed(2);
    return { h, d, dur, key: i };
  });

  return (
    <div className={cn("wave", className)} style={style} aria-hidden="true">
      {bars.map((b) => (
        <span
          key={b.key}
          className="wave-bar"
          style={
            {
              "--h": `${b.h}%`,
              "--d": `${b.d}s`,
              "--dur": `${b.dur}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
