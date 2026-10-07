import { NextResponse, type NextRequest } from "next/server";

/**
 * Один сайт — одна адреса.
 *
 * Зараз той самий сайт відповідає і на spokiy.store, і на www.spokiy.store,
 * і на mycoffin.vercel.app. Для Google це три копії одного сайту: він
 * ділить між ними вагу і сам вибирає, яку показувати. Тому все, що прийшло
 * не на канонічний домен, відправляємо на нього постійним редіректом (308).
 *
 * Канонічний хост береться з NEXT_PUBLIC_SITE_URL.
 *
 * Працює тільки на проді: preview-деплої і localhost не чіпаємо, інакше
 * неможливо буде перевірити зміни до релізу.
 */

const CANONICAL_HOST = (process.env.NEXT_PUBLIC_SITE_URL || "https://spokiy.store")
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");

export function middleware(req: NextRequest) {
  if (process.env.VERCEL_ENV !== "production") return NextResponse.next();

  const host = req.headers.get("host");
  if (!host || host === CANONICAL_HOST) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.host = CANONICAL_HOST;
  url.protocol = "https";
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export const config = {
  // статику і службові файли Next.js не проганяємо через редірект
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
