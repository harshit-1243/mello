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
        ink: {
          DEFAULT: "#181A15", // primary text, dark UI on paper
          muted: "#5C5F54", // secondary text
        },
        paper: {
          DEFAULT: "#F5F3EE", // page background (warm bone)
          raised: "#FBFAF7", // cards/surfaces on paper
        },
        line: "#E5E2D9", // borders / dividers (light)
        stage: {
          DEFAULT: "#0D100C", // dark section bg (warm near-black)
          raised: "#161A14", // cards on dark
        },
        "on-stage": "#ECEFE8", // text on dark
        green: {
          DEFAULT: "#0E7C45", // primary brand / CTA / "available"
          press: "#0B6238", // pressed / hover-deep
        },
        signal: "#36DD83", // "live / answered / confirmed" pulses & glows
        "on-green": "#F4FFF8", // text on green
        danger: "#C5462F", // "missed call" — used once, sparingly
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
