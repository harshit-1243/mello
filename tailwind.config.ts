import type { Config } from "tailwindcss";

/**
 * mello.ai design tokens.
 * Cool/warm neutrals + ONE green accent (never blue/purple).
 * Mirrored as CSS variables in globals.css for hand-written CSS (glows, gradients).
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Theme-driven tokens (channel vars in globals.css → flip per [data-theme]).
        // Light values are identical to the originals, so the marketing site is
        // visually unchanged; only the dashboard subtree re-themes.
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)", // primary text
          muted: "rgb(var(--c-ink-muted) / <alpha-value>)", // secondary text
        },
        paper: {
          DEFAULT: "rgb(var(--c-paper) / <alpha-value>)", // page background
          raised: "rgb(var(--c-paper-raised) / <alpha-value>)", // cards/surfaces
          hover: "rgb(var(--c-paper-hover) / <alpha-value>)", // hover surface
        },
        line: "rgb(var(--c-line) / <alpha-value>)", // borders / dividers
        // Stage stays always-dark (marketing dark sections + the live rail).
        stage: {
          DEFAULT: "#0D100C",
          raised: "#161A14",
        },
        "on-stage": "#ECEFE8",
        green: {
          DEFAULT: "rgb(var(--c-green) / <alpha-value>)", // brand / CTA / "available"
          press: "rgb(var(--c-green-press) / <alpha-value>)",
        },
        signal: "rgb(var(--c-signal) / <alpha-value>)", // live/answered pulses
        amber: "rgb(var(--c-amber) / <alpha-value>)", // secondary accent (resolved / play / money)
        "on-green": "rgb(var(--c-on-green) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: [
          "var(--font-geist-sans)",
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        eyebrow: ["0.8125rem", { lineHeight: "1", letterSpacing: "0.2em" }],
        "display-sm": [
          "clamp(2.15rem, 1.1rem + 4.4vw, 3.9rem)",
          { lineHeight: "1.02", letterSpacing: "-0.035em" },
        ],
        display: [
          "clamp(2.6rem, 0.8rem + 6.6vw, 5.25rem)",
          { lineHeight: "0.99", letterSpacing: "-0.04em" },
        ],
        "display-lg": [
          "clamp(3rem, 0.3rem + 9.2vw, 6.75rem)",
          { lineHeight: "0.96", letterSpacing: "-0.045em" },
        ],
        "display-xl": [
          "clamp(3.4rem, -1rem + 14vw, 10rem)",
          { lineHeight: "0.9", letterSpacing: "-0.05em" },
        ],
      },
      maxWidth: {
        content: "1240px",
        prose: "68ch",
      },
      borderRadius: {
        "4xl": "20px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(24,26,21,0.04), 0 6px 18px -10px rgba(24,26,21,0.12)",
        lift: "0 2px 6px rgba(24,26,21,0.05), 0 26px 50px -22px rgba(24,26,21,0.22)",
        "soft-stage":
          "0 1px 2px rgba(0,0,0,0.4), 0 24px 60px -28px rgba(0,0,0,0.7)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      keyframes: {
        "signal-pulse": {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "70%, 100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "wave-idle": {
          "0%": { transform: "scaleY(0.4)" },
          "100%": { transform: "scaleY(1)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "45%": { opacity: "0.25" },
          "55%": { opacity: "0.9" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        "signal-pulse": "signal-pulse 2.4s cubic-bezier(0.16,1,0.3,1) infinite",
        flicker: "flicker 1.6s ease-in-out infinite",
        marquee: "marquee var(--mq-duration, 30s) linear infinite",
        "float-slow": "float-slow 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
