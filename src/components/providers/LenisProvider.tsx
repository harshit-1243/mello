"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { setLenis } from "@/lib/smooth-scroll";

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The dashboard uses native scroll — smooth-scroll hijacking feels laggy
  // over data tables and long transcripts.
  const onDashboard = pathname?.startsWith("/dashboard") ?? false;

  useEffect(() => {
    if (onDashboard) return;
    // Reduced motion: native scroll, no smoothing. ScrollTrigger still works.
    if (prefersReducedMotion()) {
      ScrollTrigger.refresh();
      return;
    }

    // Dev-only: disable Lenis (keeps GSAP) for crisp headless screenshots.
    try {
      if (
        process.env.NODE_ENV !== "production" &&
        new URLSearchParams(window.location.search).get("lenis") === "off"
      ) {
        ScrollTrigger.refresh();
        return;
      }
    } catch {
      /* ignore */
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Native momentum on touch — pinned/scrub is disabled on mobile anyway.
      touchMultiplier: 1.6,
    });
    setLenis(lenis);

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Let layout settle, then make ScrollTrigger aware of final positions.
    const refresh = () => ScrollTrigger.refresh();
    const t = window.setTimeout(refresh, 300);

    return () => {
      window.clearTimeout(t);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      setLenis(null);
    };
  }, [onDashboard]);

  return <>{children}</>;
}
