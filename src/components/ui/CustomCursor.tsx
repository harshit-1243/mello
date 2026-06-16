"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/** Difference-blended dot + trailing ring. Desktop fine-pointer only. */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // The dashboard is a working tool — it keeps the native cursor.
  const onDashboard = pathname?.startsWith("/dashboard") ?? false;

  useEffect(() => {
    if (onDashboard) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("has-cursor");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 });

    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.36, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.36, ease: "power3" });

    let shown = false;
    const onMove = (e: MouseEvent) => {
      if (!shown) {
        shown = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };
    const interactive = "a,button,[data-cursor],input,textarea,label";
    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(interactive))
        ring.classList.add("is-hover");
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(interactive))
        ring.classList.remove("is-hover");
    };
    const onLeave = () => {
      shown = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, [onDashboard]);

  if (onDashboard) return null;

  return (
    <>
      <div ref={ringRef} className="cursor-el cursor-ring hidden md:block" aria-hidden />
      <div ref={dotRef} className="cursor-el cursor-dot hidden md:block" aria-hidden />
    </>
  );
}
