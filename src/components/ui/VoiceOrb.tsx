"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";

/**
 * VoiceOrb — a cursor-reactive "AI listening" orb (Motion).
 * 3D-tilts toward the pointer, with a moving specular highlight, a slowly
 * rotating conic ring, a breathing core, and sonar ripples — the voice motif
 * in the orchid/lavender palette. Falls back to a calm static orb under
 * prefers-reduced-motion. Pure CSS + Motion, no external asset.
 */
export function VoiceOrb({ size = 300 }: { size?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0); // -0.5 .. 0.5 (pointer within the orb)
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 120, damping: 18, mass: 0.6 });

  const rotateY = useTransform(sx, [-0.5, 0.5], [22, -22]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-22, 22]);
  const glowX = useTransform(sx, [-0.5, 0.5], ["28%", "72%"]);
  const glowY = useTransform(sy, [-0.5, 0.5], ["28%", "72%"]);

  function onMove(e: React.MouseEvent) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <div
      ref={ref}
      onMouseMove={reduce ? undefined : onMove}
      onMouseLeave={reduce ? undefined : onLeave}
      className="orb-stage"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* sonar ripples — sound rings */}
      {!reduce && (
        <>
          <span className="orb-ripple" style={{ animationDelay: "0s" }} />
          <span className="orb-ripple" style={{ animationDelay: "1.1s" }} />
          <span className="orb-ripple" style={{ animationDelay: "2.2s" }} />
        </>
      )}

      <motion.div
        className="orb-tilt"
        style={reduce ? undefined : { rotateX, rotateY }}
        whileHover={reduce ? undefined : { scale: 1.05 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* rotating conic energy ring */}
        <div className="orb-ring" />
        {/* glowing core */}
        <div className="orb-core" />
        {/* moving specular highlight that tracks the cursor */}
        <motion.div
          className="orb-spec"
          style={reduce ? { left: "40%", top: "32%" } : { left: glowX, top: glowY }}
        />
      </motion.div>
    </div>
  );
}
