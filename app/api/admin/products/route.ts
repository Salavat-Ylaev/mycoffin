import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getProducts, upsertProduct, deleteProduct } from "@/lib/store";
import { PET_KINDS, type Product } from "@/lib/types";

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
    min_length_cm: Math.max(5, num(b.min_length_cm, 20)),
    max_length_cm: Math.max(6, num(b.max_length_cm, 60)),
    base_price_uah: Math.max(0, num(b.base_price_uah, 1000)),
    base_length_cm: Math.max(5, num(b.base_length_cm, 40)),
    price_per_cm_uah: Math.max(0, num(b.price_per_cm_uah, 30)),
    in_stock: Boolean(b.in_stock),
    image: str(b.image, 600),
    art: ["classic", "minimal", "noir", "goldline", "eco"].includes(b.art)
      ? b.art
      : "minimal",
  };

  if (product.max_length_cm <= product.min_length_cm) {
    return NextResponse.json(
      { error: "Максимальна довжина має бути більшою за мінімальну" },
      { status: 400 }
    );
  }

  const saved = await upsertProduct(product);
  return NextResponse.json(saved);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return deny();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "no id" }, { status: 400 });
  await deleteProduct(id);
  return NextResponse.json({ ok: true });
}
