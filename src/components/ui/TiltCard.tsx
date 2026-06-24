"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";

/**
 * TiltCard — a Motion wrapper that tilts toward the cursor in 3D and lifts on
 * hover, with its own scroll-in entrance (so it doesn't fight GSAP transforms).
 * The parent needs CSS perspective for the 3D to read. Reduced-motion → a plain
 * fade-up, no tilt.
 */
export function TiltCard({
  children,
  className,
  index = 0,
  max = 9,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  max?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 150, damping: 18, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 150, damping: 18, mass: 0.5 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max]);

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

  const entrance = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  };

  if (reduce) {
    return (
      <motion.div className={className} {...entrance}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ y: -6 }}
      {...entrance}
    >
      {children}
    </motion.div>
  );
}
