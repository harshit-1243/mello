import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * sitemap.xml — served at https://melloai.in/sitemap.xml (Next.js metadata route).
 * Lists only the PUBLIC, indexable pages. The dashboard/login are gated on the live
 * domain (see proxy.ts), so they are intentionally excluded.
 * Submit this URL in Google Search Console → Sitemaps.
 */
const base = `https://${SITE.domain}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/security`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
