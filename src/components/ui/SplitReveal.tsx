"use client";

import { Fragment, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";

type Props = {
  text: string;
  as?: React.ElementType;
  className?: string;
  stagger?: number;
  delay?: number;
  duration?: number;
};

/**
 * Word-by-word mask reveal — each word rises out of an overflow-hidden clip.
 * Triggered by IntersectionObserver so it always fires regardless of the
 * pinned hero's scroll math. Full text is exposed to screen readers via
 * aria-label; the per-word spans are aria-hidden.
 */
export function SplitReveal({
  text,
  as = "h2",
  className,
  stagger = 0.05,
  delay = 0,
  duration = 0.9,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as React.ElementType;

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let io: IntersectionObserver | null = null;
    const ctx = gsap.context(() => {
      const inners = el.querySelectorAll("[data-word-inner]");
      gsap.set(inners, { yPercent: 118 });

      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            gsap.to(inners, {
              yPercent: 0,
              duration,
              ease: "expo.out",
              stagger,
              delay,
              overwrite: true,
            });
            io?.disconnect();
          }
        },
        { rootMargin: "0px 0px -8% 0px" },
      );
      io.observe(el);
    }, ref);

    return () => {
      io?.disconnect();
      ctx.revert();
    };
  }, []);

  const words = text.split(" ");

  return (
    <Tag ref={ref as React.Ref<HTMLElement>} className={className} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span
            aria-hidden="true"
            className="inline-block overflow-hidden pb-[0.14em] align-bottom -mb-[0.14em]"
          >
            <span data-word-inner className="inline-block will-change-transform">
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
