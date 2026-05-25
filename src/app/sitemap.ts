import type { MetadataRoute } from "next";
import { getAllSiteSlugs } from "@/lib/data/sites";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const productSlugs = await getAllSiteSlugs();

  const now = new Date();

  const staticPaths: string[] = [
    "/",
    "/services",
    "/work",
    "/products",
    "/about",
    "/contact",
    "/privacy",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
  }));

  const productEntries: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${baseUrl}/products/${slug}`,
    lastModified: now,
  }));

  return [...staticEntries, ...productEntries];
}
