// Заливает стартовый каталог (data/products.json) в таблицу products в Supabase.
// Запуск (после того как заполнил .env):  node scripts/push-to-supabase.mjs
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// простое чтение .env без лишних зависимостей
for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) {
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Нет NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY в .env");
  process.exit(1);
}

const products = JSON.parse(readFileSync(join(root, "data/products.json"), "utf8"));
const sb = createClient(url, key, { auth: { persistSession: false } });

const { error } = await sb.from("products").upsert(products);
if (error) {
  console.error("Ошибка:", error.message);
  process.exit(1);
}
console.log(`Готово: залито ${products.length} товаров.`);
