import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register plugins once, on the client only.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

/** Single source of truth for "should we animate at all?". */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  // Dev-only escape hatch used while screenshotting (a hidden preview window
  // can't composite active GSAP/pin layers). Never set in production.
  try {
    if (process.env.NODE_ENV !== "production") {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get("motion") === "off" ||
        window.localStorage.getItem("mello:static") === "1"
      ) {
        return true;
      }
    }
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
