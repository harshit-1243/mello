import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * robots.txt — served at https://melloai.in/robots.txt (Next.js metadata route).
 * Allow crawling of the public marketing site; keep the gated app (dashboard, login)
 * and API out of the index. Points crawlers at the sitemap.
 */
const base = `https://${SITE.domain}`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/login", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
