"use client";

import { usePathname } from "next/navigation";
import { motion, useScroll, useSpring } from "motion/react";

/**
 * ScrollProgress — a thin violet bar pinned to the top that fills as you scroll
 * the page. Spring-smoothed so it glides rather than jumps. Marketing only —
 * the dashboard keeps its own chrome.
 */
export function ScrollProgress() {
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <motion.div
      aria-hidden
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-green"
    />
  );
}
