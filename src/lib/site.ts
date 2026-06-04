/**
 * Central site configuration.
 * TODO: replace the placeholder constants below before going live.
 */
export const SITE = {
  name: "mello",
  domain: "mello.ai",
  tagline: "The AI receptionist for sports facilities.",

  // TODO: replace with your real Calendly scheduling link.
  CALENDLY_URL: "https://calendly.com/connect2harshit123/30min",

  // TODO: replace with your real inbox.
  CONTACT_EMAIL: "hello@mello.ai",

  location: "Mumbai, India",
  builtIn: "Built in Mumbai.",
  year: 2026,

  // TODO: add real profiles (or remove).
  social: {
    linkedin: "https://www.linkedin.com/company/mello-ai",
    twitter: "https://x.com/mello_ai",
    instagram: "https://www.instagram.com/mello.ai",
  },
} as const;

export const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
] as const;
