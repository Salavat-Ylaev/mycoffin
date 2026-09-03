import { NextRequest, NextResponse } from "next/server";
import { getProducts, createOrder } from "@/lib/store";
import { calcDimensions, priceFor } from "@/lib/calc";
import { notifyTelegram } from "@/lib/telegram";
import { mailOwner, mailCustomer } from "@/lib/mail";
import { PET_KINDS, type Order, type PetKind } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function orderNumber(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `${dd}${mm}-${rnd}`;
}

const clean = (v: unknown, max = 200) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const pet = body.pet as PetKind;
    if (!PET_KINDS.includes(pet)) {
      return NextResponse.json({ error: "bad pet" }, { status: 400 });
    }

    const weight = Number(body.weight_kg);
    if (!Number.isFinite(weight) || weight <= 0 || weight > 200) {
      return NextResponse.json({ error: "bad weight" }, { status: 400 });
    }

    const first_name = clean(body.first_name, 60);
    const last_name = clean(body.last_name, 60);
    const phone = clean(body.phone, 30);
    const email = clean(body.email, 120);
    const post_office = clean(body.post_office, 160);
    const comment = clean(body.comment, 700);

    if (!first_name || !last_name || !post_office) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    if (!/^[\d+\s()\-]{9,20}$/.test(phone)) {
      return NextResponse.json({ error: "bad phone" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "bad email" }, { status: 400 });
    }

    const products = await getProducts();
    const product = products.find((p) => p.id === body.product_id);
    if (!product) {
      return NextResponse.json({ error: "product not found" }, { status: 400 });
    }

    // розміри й ціну рахуємо на сервері — клієнтським даним не довіряємо
    const dims = calcDimensions(pet, weight);
    const price = priceFor(product, dims.length);
    const lang = body.lang === "en" ? "en" : "uk";

    const order: Order = {
      id: orderNumber(),
      created_at: new Date().toISOString(),
      pet,
      weight_kg: Math.round(weight * 100) / 100,
      first_name,
      last_name,
      phone,
      email,
      post_office,
      payment: "transfer",
      comment,
      status: "new",
      item: {
        product_id: product.id,
        product_name: lang === "en" ? product.name_en : product.name_uk,
        material: lang === "en" ? product.material_en : product.material_uk,
        price_uah: price,
        length_cm: dims.length,
        width_cm: dims.width,
        height_cm: dims.height,
      },
    };

    await createOrder(order);

    // сповіщення — не блокують відповідь клієнту, якщо сервіс не налаштований
    const [tg, own, cust] = await Promise.all([
      notifyTelegram(order),
      mailOwner(order),
      mailCustomer(order),
    ]);
    if (!tg && !own) {
      console.warn(
        `Замовлення ${order.id} збережено, але сповіщення не надіслані: не налаштовані Telegram і SMTP.`
      );
    }

    return NextResponse.json({
      id: order.id,
      price: order.item.price_uah,
      notified: { telegram: tg, owner_email: own, customer_email: cust },
    });
  } catch (e) {
    console.error("POST /api/order:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
