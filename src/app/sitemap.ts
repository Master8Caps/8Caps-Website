import type { MetadataRoute } from "next";
import { getAllSiteSlugs } from "@/lib/data/sites";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const slugs = await getAllSiteSlugs();

  const staticRoutes = ["", "/products", "/about", "/contact"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  const siteRoutes = slugs.map((slug) => ({
    url: `${base}/products/${slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...siteRoutes];
}
