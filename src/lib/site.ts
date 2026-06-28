/**
 * Central site configuration.
 * TODO: replace the placeholder constants below before going live.
 */
export const SITE = {
  name: "mello",
  domain: "melloai.in",
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
    instagram: "https://www.instagram.com/mellooo.ai/",
  },
} as const;

export const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how" },
  { label: "Outbound", href: "#outbound" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;
