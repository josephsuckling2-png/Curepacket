import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = appBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/cases", "/billing", "/settings", "/admin", "/api"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
