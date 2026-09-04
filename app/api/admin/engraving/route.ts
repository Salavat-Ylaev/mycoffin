import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getEngravingOptions, upsertEngravingOption } from "@/lib/store";
import type { EngravingOption } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

export async function GET() {
  if (!(await isAdmin())) return deny();
  return NextResponse.json(await getEngravingOptions());
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return deny();

  const b = await req.json();
  const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
  const num = (v: unknown, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };

  const option: EngravingOption = {
    id: str(b.id, 40) || `opt-${Date.now().toString(36)}`,
    sort: num(b.sort, 99),
    label_uk: str(b.label_uk, 80),
    label_en: str(b.label_en, 80),
    hint_uk: str(b.hint_uk, 160),
    hint_en: str(b.hint_en, 160),
    price_uah: Math.max(0, num(b.price_uah, 0)),
    needs_text: Boolean(b.needs_text),
    enabled: Boolean(b.enabled),
  };

  try {
    const saved = await upsertEngravingOption(option);
    return NextResponse.json(saved);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "не вдалося зберегти";
    console.error("POST /api/admin/engraving:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
