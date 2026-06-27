"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Spotlight — wraps a card so a soft violet glow follows the cursor across it
 * on hover. Pure CSS glow (see .spotlight-card), JS only feeds cursor position.
 */
export function Spotlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div ref={ref} onMouseMove={onMove} className={cn("spotlight-card", className)}>
      {children}
    </div>
  );
}
