import { NextResponse, type NextRequest } from "next/server";

/**
 * Прибираємо з пошуку технічний домен Vercel.
 *
 * Той самий сайт відповідає і на spokiy.store, і на mycoffin.vercel.app.
 * Для Google це дві копії одного сайту. Технічну адресу відправляємо
 * на основну постійним редіректом (308).
 *
 * ВАЖЛИВО: apex і www тут НЕ чіпаємо. Перенаправлення між spokiy.store
 * і www.spokiy.store робить сам Vercel у налаштуваннях домену. Якщо
 * дублювати це ще й тут, два редіректи починають гонити запит по колу
 * і сайт лягає з ERR_TOO_MANY_REDIRECTS. Один редірект має бути в одному
 * місці — у Vercel.
 *
 * Працює тільки на проді: preview-деплої і localhost не чіпаємо.
 */

const CANONICAL_HOST = (process.env.NEXT_PUBLIC_SITE_URL || "https://spokiy.store")
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "")
  .toLowerCase();

export function middleware(req: NextRequest) {
  if (process.env.VERCEL_ENV !== "production") return NextResponse.next();

  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  if (!host) return NextResponse.next();

  // чіпаємо тільки технічну адресу Vercel
  if (!host.endsWith(".vercel.app")) return NextResponse.next();

  // якщо канонічний хост чомусь теж на vercel.app — нікуди не йдемо,
  // інакше отримаємо редірект сам на себе
  if (host === CANONICAL_HOST || CANONICAL_HOST.endsWith(".vercel.app")) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.host = CANONICAL_HOST;
  url.protocol = "https";
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
