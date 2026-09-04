import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { checkTelegram } from "@/lib/telegram";
import { checkMail } from "@/lib/mail";
import { getProducts, usingSupabase } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Діагностика сповіщень і бази. Відповідає лише «є / немає / помилка»,
 * самі ключі назовні не віддає.
 * GET /api/admin/health        — тільки перевірка
 * GET /api/admin/health?test=1 — ще й надсилає тестові повідомлення
 */
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const send = new URL(req.url).searchParams.get("test") === "1";
  const has = (name: string) => Boolean(process.env[name]);

  const [telegram, mail] = await Promise.all([checkTelegram(send), checkMail(send)]);

  let database: { configured: boolean; ok: boolean; error?: string; products?: number };
  try {
    const products = await getProducts();
    database = { configured: usingSupabase, ok: true, products: products.length };
    if (!usingSupabase) {
      database.error =
        "Supabase не підключено — товари беруться з файлу, зміни в адмінці не збережуться";
    }
  } catch (e) {
    database = {
      configured: usingSupabase,
      ok: false,
      error: e instanceof Error ? e.message : "db error",
    };
  }

  return NextResponse.json({
    env: {
      TELEGRAM_BOT_TOKEN: has("TELEGRAM_BOT_TOKEN"),
      TELEGRAM_CHAT_ID: has("TELEGRAM_CHAT_ID"),
      SMTP_HOST: has("SMTP_HOST"),
      SMTP_USER: has("SMTP_USER"),
      SMTP_PASS: has("SMTP_PASS"),
      OWNER_EMAIL: has("OWNER_EMAIL"),
      MAIL_FROM: has("MAIL_FROM"),
      NEXT_PUBLIC_SUPABASE_URL: has("NEXT_PUBLIC_SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: has("SUPABASE_SERVICE_ROLE_KEY"),
      NEXT_PUBLIC_PAYMENT_DETAILS: has("NEXT_PUBLIC_PAYMENT_DETAILS"),
      NEXT_PUBLIC_PHONE: has("NEXT_PUBLIC_PHONE"),
    },
    telegram,
    mail,
    database,
    tested: send,
  });
}
