"use client";

import { useRef } from "react";
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
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as React.ElementType;

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let io: IntersectionObserver | null = null;
    const ctx = gsap.context(() => {
      const targets =
        stagger != null ? Array.from(el.children) : (el as Element);
      if (stagger != null) gsap.set(el, { opacity: 1 });
      gsap.set(targets, { opacity: 0, y });

      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            gsap.to(targets, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "expo.out",
              delay,
              stagger: stagger ?? 0,
              overwrite: true,
            });
            io?.disconnect();
          }
        },
        { rootMargin: "0px 0px -10% 0px" },
      );
      io.observe(el);
    }, ref);

    return () => {
      io?.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <Tag ref={ref as React.Ref<HTMLElement>} data-reveal className={cn(className)}>
      {children}
    </Tag>
  );
}
