import type Lenis from "lenis";

let lenisInstance: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenisInstance = instance;
}

/** Smoothly scroll to an in-page anchor (used by nav + CTAs). */
export function scrollToId(href: string) {
  if (typeof document === "undefined") return;
  const el = document.querySelector(href) as HTMLElement | null;
  if (!el) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (lenisInstance && !reduced) {
    lenisInstance.scrollTo(el, { offset: -72, duration: 1.1 });
  } else {
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }
}
