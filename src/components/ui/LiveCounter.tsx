"use client";

import { useEffect, useState } from "react";
import { SlidingNumber } from "@/components/ui/SlidingNumber";

/**
 * A number that visibly ticks upward while you watch — for the "bookings
 * recovered" stat. Increments by 1 at a randomised few-second cadence so it
 * reads as a live, growing total rather than a fixed figure. Respects
 * prefers-reduced-motion (holds steady for those users).
 *
 * Note: this is a presentational animated total, not wired to live data.
 * Tune `start` / the cadence to taste; can be anchored to real Supabase
 * booking counts later if you want it to be exact.
 */
export function LiveCounter({
  start,
  minMs = 2800,
  maxMs = 5200,
  className,
}: {
  start: number;
  minMs?: number;
  maxMs?: number;
  className?: string;
}) {
  const [n, setN] = useState(start);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = minMs + Math.random() * (maxMs - minMs);
      timer = setTimeout(() => {
        setN((v) => v + 1);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [minMs, maxMs]);

  return <SlidingNumber value={n} className={className} />;
}
