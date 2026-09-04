import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { uploadImage } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024; // 6 МБ
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // Якщо тіло завелике, хостинг обриває запит саме тут —
    // ловимо це окремо, щоб не віддавати порожню відповідь.
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json(
        {
          error:
            "Фото завелике або передача обірвалась. Оберіть фото меншого розміру — сайт стискає їх автоматично, але дуже великі файли не доходять.",
        },
        { status: 413 }
      );
    }
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "no file" }, { status: 400 });
    }
    if (!TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Підтримуються JPG, PNG, WEBP, AVIF" },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Файл ${(file.size / 1024 / 1024).toFixed(1)} МБ — забагато, максимум 6 МБ` },
        { status: 400 }
      );
    }

    const url = await uploadImage(await file.arrayBuffer(), file.name, file.type);
    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
