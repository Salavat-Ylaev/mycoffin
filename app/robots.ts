import type { MetadataRoute } from "next";
import { SITE_URL, abs } from "@/lib/seo";

/**
 * robots.txt генерується Next.js на /robots.txt.
 *
 * Адмінку і API закриваємо: там немає нічого для видачі, а сторінка
 * логіну в індексі виглядає погано. Решту сайту відкриваємо повністю.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: abs("/sitemap.xml"),
    host: SITE_URL,
  };
}
