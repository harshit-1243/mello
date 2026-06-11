"use client";

import { useEffect, useState } from "react";

/**
 * Dark/light toggle for the dashboard. Sets `data-theme` on the dashboard root
 * (#dash-root) only — never <html> — so the marketing site stays light. Default
 * is dark; the choice is remembered in localStorage and applied before paint by
 * the inline script in the dashboard layout (so there's no flash).
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Sync to whatever the no-flash script already applied.
  useEffect(() => {
    const root = document.getElementById("dash-root");
    const current = (root?.getAttribute("data-theme") as "dark" | "light") || "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.getElementById("dash-root")?.setAttribute("data-theme", next);
    try {
      localStorage.setItem("mello-theme", next);
    } catch {
      /* private mode — ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className="grid h-9 w-9 place-items-center rounded-[10px] border border-line text-ink-muted transition-colors hover:bg-paper-hover hover:text-ink"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}
