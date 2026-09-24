import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/app-url";
import { GUIDES } from "@/lib/guides";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appBaseUrl();
  const paths = ["/", "/register", "/login", "/guides", ...GUIDES.map((guide) => `/guides/${guide.slug}`)];
  return paths.map((path) => ({
    url: path === "/" ? `${base}/` : `${base}${path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
