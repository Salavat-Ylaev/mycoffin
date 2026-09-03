import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import seedJson from "@/data/products.json";
import engravingJson from "@/data/engraving.json";
import type { EngravingOption, Order, Product } from "./types";

const seed = seedJson as unknown as Product[];
const engravingSeed = engravingJson as unknown as EngravingOption[];

/**
 * Сховище даних із двома режимами:
 *  • Supabase — якщо задані NEXT_PUBLIC_SUPABASE_URL і SUPABASE_SERVICE_ROLE_KEY;
 *  • локальні JSON-файли в data/ — для роботи на своєму комп'ютері без сервісів.
 * Якщо файлова система лише для читання (хостинг), працює копія в пам'яті.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const usingSupabase = Boolean(SUPABASE_URL && SERVICE_KEY);

let _sb: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!_sb) {
    _sb = createClient(SUPABASE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return _sb;
}

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const ENGRAVING_FILE = path.join(DATA_DIR, "engraving.json");

// пам'ять — використовується, коли диск недоступний для запису
const mem: {
  products: Product[] | null;
  orders: Order[];
  engraving: EngravingOption[] | null;
} = {
  products: null,
  orders: [],
  engraving: null,
};

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown): Promise<boolean> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(value, null, 2) + "\n", "utf8");
    return true;
  } catch {
    return false;
  }
}

/* ─────────────────────────── товари ─────────────────────────── */

export async function getProducts(): Promise<Product[]> {
  if (usingSupabase) {
    const { data, error } = await supabase()
      .from("products")
      .select("*")
      .order("pet")
      .order("sort");
    if (error) throw new Error(error.message);
    return (data ?? []) as Product[];
  }

  if (mem.products) return mem.products;
  const fromDisk = await readJson<Product[]>(PRODUCTS_FILE, seed);
  mem.products = fromDisk.length ? fromDisk : seed;
  return mem.products;
}

export async function upsertProduct(p: Product): Promise<Product> {
  if (usingSupabase) {
    const { data, error } = await supabase()
      .from("products")
      .upsert(p)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Product;
  }

  const list = [...(await getProducts())];
  const i = list.findIndex((x) => x.id === p.id);
  if (i >= 0) list[i] = p;
  else list.push(p);
  mem.products = list;
  await writeJson(PRODUCTS_FILE, list);
  return p;
}

export async function deleteProduct(id: string): Promise<void> {
  if (usingSupabase) {
    const { error } = await supabase().from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  const list = (await getProducts()).filter((x) => x.id !== id);
  mem.products = list;
  await writeJson(PRODUCTS_FILE, list);
}

/* ─────────────────────────── гравіювання ─────────────────────────── */

export async function getEngravingOptions(): Promise<EngravingOption[]> {
  if (usingSupabase) {
    const { data, error } = await supabase()
      .from("engraving_options")
      .select("*")
      .order("sort");
    if (error) throw new Error(error.message);
    // якщо таблиця ще порожня — віддаємо стартовий набір
    return (data && data.length ? data : engravingSeed) as EngravingOption[];
  }

  if (mem.engraving) return mem.engraving;
  const fromDisk = await readJson<EngravingOption[]>(ENGRAVING_FILE, engravingSeed);
  mem.engraving = fromDisk.length ? fromDisk : engravingSeed;
  return mem.engraving;
}

export async function upsertEngravingOption(
  o: EngravingOption
): Promise<EngravingOption> {
  if (usingSupabase) {
    const { data, error } = await supabase()
      .from("engraving_options")
      .upsert(o)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as EngravingOption;
  }

  const list = [...(await getEngravingOptions())];
  const i = list.findIndex((x) => x.id === o.id);
  if (i >= 0) list[i] = o;
  else list.push(o);
  mem.engraving = list;
  await writeJson(ENGRAVING_FILE, list);
  return o;
}

/* ─────────────────────────── замовлення ─────────────────────────── */

export async function createOrder(order: Order): Promise<Order> {
  if (usingSupabase) {
    const { data, error } = await supabase()
      .from("orders")
      .insert(order)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Order;
  }

  const list = await readJson<Order[]>(ORDERS_FILE, mem.orders);
  list.unshift(order);
  mem.orders = list;
  await writeJson(ORDERS_FILE, list);
  return order;
}

export async function getOrders(limit = 200): Promise<Order[]> {
  if (usingSupabase) {
    const { data, error } = await supabase()
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as Order[];
  }
  const list = await readJson<Order[]>(ORDERS_FILE, mem.orders);
  mem.orders = list;
  return list.slice(0, limit);
}

export async function setOrderStatus(
  id: string,
  status: Order["status"]
): Promise<void> {
  if (usingSupabase) {
    const { error } = await supabase()
      .from("orders")
      .update({ status })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  const list = await getOrders(10000);
  const o = list.find((x) => x.id === id);
  if (o) o.status = status;
  mem.orders = list;
  await writeJson(ORDERS_FILE, list);
}

/* ─────────────────────────── фото ─────────────────────────── */

/** Завантажує фото в Supabase Storage і повертає публічний URL */
export async function uploadImage(
  file: ArrayBuffer,
  filename: string,
  contentType: string
): Promise<string> {
  if (!usingSupabase) {
    throw new Error(
      "Завантаження фото працює після підключення Supabase. Поки що вставте посилання на фото вручну."
    );
  }
  const bucket = process.env.SUPABASE_BUCKET || "coffins";
  const key = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase()
    .storage.from(bucket)
    .upload(key, file, { contentType, upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase().storage.from(bucket).getPublicUrl(key);
  return data.publicUrl;
}
