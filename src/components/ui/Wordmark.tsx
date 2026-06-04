"use client";

import { cn } from "@/lib/cn";
import { scrollToId } from "@/lib/smooth-scroll";

function WaveGlyph({ className }: { className?: string }) {
  // Four rounded bars — a compact voice-waveform mark.
  const heights = ["42%", "100%", "64%", "84%"];
  return (
    <span
      className={cn("inline-flex h-5 items-end gap-[3px]", className)}
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <i
          key={i}
          className="block w-[3px] rounded-full bg-current"
          style={{ height: h }}
        />
      ))}
    </span>
  );
}

export function Wordmark({
  onStage = false,
  className,
}: {
  onStage?: boolean;
  className?: string;
}) {
  return (
    <a
      href="#top"
      aria-label="mello — home"
      onClick={(e) => {
        e.preventDefault();
        scrollToId("#top");
      }}
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <WaveGlyph className={onStage ? "text-signal" : "text-green"} />
      <span
        className={cn(
          "font-display text-[1.4rem] font-semibold lowercase tracking-tight",
          onStage ? "text-on-stage" : "text-ink",
        )}
      >
        mello
      </span>
    </a>
  );
}
