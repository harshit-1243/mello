"use client";

import { cn } from "@/lib/cn";

/**
 * Animated green orb logo mark — portrait MP4 (1080×1920), sphere at top,
 * "mello.ai" text at bottom.
 *
 * Technique:
 *  - object-fit:cover fills the container width; height overflows bottom
 *  - object-position centers on the sphere (upper portion of the portrait video)
 *  - radial-gradient mask fades the edges → white background disappears on
 *    any background colour (dark stage or light paper) without blend modes
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
  const radialMask =
    "radial-gradient(circle, black 52%, transparent 74%)";

  return (
    <a
      href="/"
      aria-label="mello — home"
      className={cn(
        "block shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span className="sr-only">mello</span>
      <div
        className="w-full h-full overflow-hidden rounded-full"
        style={{
          WebkitMaskImage: radialMask,
          maskImage: radialMask,
        }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            // Portrait video: sphere is in the upper ~40% of the frame.
            // 20% from top keeps sphere centered in the container and
            // pushes the text label below the visible area.
            objectPosition: "center 45%",
            transform: "scale(1.4)",
            transformOrigin: "center 45%",
          }}
        >
          <source src="/logo/orb.mp4" type="video/mp4" />
        </video>
      </div>
    </a>
  );
}


