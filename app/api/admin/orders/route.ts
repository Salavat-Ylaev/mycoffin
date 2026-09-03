import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getOrders, setOrderStatus } from "@/lib/store";
import type { Order } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

export async function GET() {
  if (!(await isAdmin())) return deny();
  return NextResponse.json(await getOrders());
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return deny();
  const { id, status } = await req.json();
  const allowed: Order["status"][] = ["new", "in_work", "done", "cancelled"];
  if (!id || !allowed.includes(status)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  await setOrderStatus(String(id), status);
  return NextResponse.json({ ok: true });
}
