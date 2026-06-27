"use client";

import { createElement, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import { cn } from "@/lib/cn";

type RevealProps = {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
  /** vertical offset to rise from */
  y?: number;
  delay?: number;
  /** if set, animates the element's direct children with this stagger (s) */
  stagger?: number;
  /** play on mount instead of waiting to scroll into view (for the hero) */
  immediate?: boolean;
};

/**
 * Entrance reveal driven by IntersectionObserver (immune to the pinned hero's
 * scroll-position math). FOUC-free: `.anim [data-reveal]` pre-hides before JS.
 */
export function Reveal({
  as = "div",
  className,
  children,
  y = 22,
  delay = 0,
  stagger,
  immediate = false,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as React.ElementType;

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const targets: gsap.TweenTarget =
      stagger != null ? Array.from(el.children) : el;
    if (stagger != null) gsap.set(el, { opacity: 1 });
    gsap.set(targets, { opacity: 0, y });

    let tween: gsap.core.Tween | null = null;
    let io: IntersectionObserver | null = null;
    let raf = 0;

    const play = () => {
      tween = gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "expo.out",
        delay,
        stagger: stagger ?? 0,
        overwrite: true,
      });
    };

    // Hero & above-the-fold content: play on mount so it always choreographs
    // (IntersectionObserver can miss tall content that starts below the fold).
    // Double-rAF defers past React StrictMode's mount→cleanup→mount in dev.
    if (immediate) {
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(play);
      });
    } else {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            play();
            io?.disconnect();
          }
        },
        { rootMargin: "0px 0px -10% 0px" },
      );
      io.observe(el);
    }

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      tween?.kill();
    };
  }, []);

  // createElement (not <Tag>) sidesteps React 19's strict polymorphic
  // ElementType JSX typing, which resolves children to `never`.
  return createElement(
    Tag,
    { ref: ref as React.Ref<HTMLElement>, "data-reveal": "", className: cn(className) },
    children,
  );
}
