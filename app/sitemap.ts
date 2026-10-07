import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";
import { CATEGORIES } from "@/lib/categories";

/**
 * sitemap.xml генерується Next.js на /sitemap.xml.
 *
 * Головна плюс сторінка на кожен вид тварини. Нові розділи додаються
 * в lib/categories.ts — карта сайту оновиться сама.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: abs("/"),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    ...CATEGORIES.map((c) => ({
      url: abs(`/${c.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
