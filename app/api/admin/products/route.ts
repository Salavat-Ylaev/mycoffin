import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getProducts, upsertProduct, deleteProduct } from "@/lib/store";
import { PET_KINDS, type Product } from "@/lib/types";
import { sizesFor } from "@/lib/calc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

export async function GET() {
  if (!(await isAdmin())) return deny();
  return NextResponse.json(await getProducts());
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return deny();

  const b = await req.json();
  const num = (v: unknown, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  const str = (v: unknown, max = 400) => String(v ?? "").trim().slice(0, max);

  if (!PET_KINDS.includes(b.pet)) {
    return NextResponse.json({ error: "bad pet" }, { status: 400 });
  }

  const product: Product = {
    id: str(b.id, 60) || `${b.pet}-${Date.now().toString(36)}`,
    pet: b.pet,
    sort: num(b.sort, 99),
    name_uk: str(b.name_uk, 80),
    name_en: str(b.name_en, 80),
    material_uk: str(b.material_uk, 160),
    material_en: str(b.material_en, 160),
    desc_uk: str(b.desc_uk, 500),
    desc_en: str(b.desc_en, 500),
    // ціни приймаємо лише для корпусів, доступних цьому виду
    prices: Object.fromEntries(
      sizesFor(b.pet).map((o) => [
        o.sizeId,
        Math.max(0, num(b.prices?.[o.sizeId], 0)),
      ])
    ),
    in_stock: Boolean(b.in_stock),
    image: str(b.image, 600),
    art: ["classic", "minimal", "noir", "goldline", "eco"].includes(b.art)
      ? b.art
      : "minimal",
  };

  try {
    const saved = await upsertProduct(product);
    return NextResponse.json(saved);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "не вдалося зберегти";
    console.error("POST /api/admin/products:", e);
    const hint = /column .* does not exist|prices/i.test(msg)
      ? " — у базі стара структура таблиці products. Виконайте supabase.sql заново в SQL Editor."
      : "";
    return NextResponse.json({ error: msg + hint }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return deny();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "no id" }, { status: 400 });
  try {
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "не вдалося видалити";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
