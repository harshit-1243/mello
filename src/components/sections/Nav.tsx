"use client";

import { useEffect, useState } from "react";
import { LogoOrb } from "@/components/ui/LogoOrb";
import { Button } from "@/components/ui/Button";
import { Menu, X, ArrowUpRight } from "@/components/ui/icons";
import { NAV_LINKS, SITE } from "@/lib/site";
import { scrollToId } from "@/lib/smooth-scroll";
import { cn } from "@/lib/cn";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [onDark, setOnDark] = useState(true); // first section is the dark hero
  const [open, setOpen] = useState(false);

  // Track scroll position AND whether a dark "stage" section sits under the bar,
  // so nav content stays legible over both paper and stage sections.
  useEffect(() => {
    const darks = Array.from(
      document.querySelectorAll<HTMLElement>('[data-nav="dark"]'),
    );
    const probeY = 30;
    let raf = 0;
    const update = () => {
      setScrolled(window.scrollY > 12);
      let dark = false;
      for (const el of darks) {
        const r = el.getBoundingClientRect();
        if (r.top <= probeY && r.bottom > probeY) {
          dark = true;
          break;
        }
      }
      setOnDark(dark);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    scrollToId(href);
  };

  const solid = open || (!onDark && scrolled);
  const light = onDark && !open; // light content over a dark stage

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ease-out-expo",
        solid
          ? "border-b border-line/80 bg-paper/80 shadow-[0_1px_0_rgba(24,26,21,0.04)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-5 sm:h-[68px] sm:px-8">
        <LogoOrb size={40} onStage={light} />

        <div className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => {
                e.preventDefault();
                go(l.href);
              }}
              className={cn(
                "rounded-full px-3.5 py-2 text-[0.95rem] transition-colors duration-200",
                light
                  ? "text-on-stage/70 hover:text-on-stage"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <Button href={SITE.CALENDLY_URL} external size="md">
            Book a Demo
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className={cn(
            "-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors md:hidden",
            light ? "text-on-stage" : "text-ink",
          )}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile sheet */}
      <div
        className={cn(
          "overflow-hidden border-line/70 transition-[max-height,opacity] duration-300 ease-out-expo md:hidden",
          open ? "max-h-[22rem] border-t opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="mx-auto flex max-w-content flex-col gap-1 px-5 pb-6 pt-3">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => {
                e.preventDefault();
                go(l.href);
              }}
              className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg text-ink transition-colors hover:bg-ink/[0.04]"
            >
              {l.label}
              <ArrowUpRight className="h-4 w-4 text-ink-muted" />
            </a>
          ))}
          <Button
            href={SITE.CALENDLY_URL}
            external
            size="lg"
            className="mt-2 w-full"
          >
            Book a Demo
          </Button>
        </div>
      </div>
    </header>
  );
}
