"use client";

import { cn } from "@/lib/cn";

/**
 * Mello logo mark — the real glass-orb image (public/logo/orb.png), circular-
 * cropped with a transparent background and a soft violet glow that gently
 * breathes (faster on hover). Works on dark or light backgrounds.
 */
export function LogoOrb({
  size = 40,
  onStage = false,
  className,
}: {
  size?: number;
  onStage?: boolean;
  className?: string;
}) {
  return (
    <a
      href="/"
      aria-label="mello — home"
      className={cn(
        "logo-orb-link block shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2",
        onStage ? "focus-visible:ring-offset-stage" : "focus-visible:ring-offset-paper",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span className="sr-only">mello</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo/orb.png" alt="" width={size} height={size} draggable={false} className="logo-orb-img" />
    </a>
  );
}
