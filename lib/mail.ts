import nodemailer, { Transporter } from "nodemailer";
import type { Order } from "./types";
import { orderToText } from "./telegram";

let _tx: Transporter | null = null;

export const mailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

function transport(): Transporter {
  if (!_tx) {
    _tx = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE ?? "true") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return _tx;
}

const from = () =>
  process.env.MAIL_FROM || `SPOKIY <${process.env.SMTP_USER ?? "no-reply@localhost"}>`;

const money = (n: number) => `${n.toLocaleString("uk-UA")} грн`;

/** Лист власнику: сирі дані замовлення */
export async function mailOwner(o: Order): Promise<boolean> {
  const to = process.env.OWNER_EMAIL;
  if (!mailConfigured() || !to) return false;
  try {
    await transport().sendMail({
      from: from(),
      to,
      replyTo: o.email || undefined,
      subject: `Нове замовлення №${o.id} — ${o.item.product_name}, ${o.total_uah} грн`,
      text: orderToText(o),
    });
    return true;
  } catch (e) {
    console.error("mailOwner:", e);
    return false;
  }
}

/** Лист клієнту: підтвердження замовлення */
export async function mailCustomer(o: Order): Promise<boolean> {
  if (!mailConfigured() || !o.email) return false;

  const details =
    process.env.NEXT_PUBLIC_PAYMENT_DETAILS || "Реквізити надішле менеджер";
  const phone = process.env.NEXT_PUBLIC_PHONE || "";
  const hasEngraving = Boolean(o.engraving && o.engraving.ids.length);
  const lead = hasEngraving || o.item.custom_size
    ? "+1–3 дні (індивідуальний розмір або нанесення)"
    : "У наявності — відправляємо сьогодні";

  const html = `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
  <div style="border-bottom:1px solid #111;padding-bottom:14px;margin-bottom:26px;">
    <div style="letter-spacing:.32em;font-size:13px;text-transform:uppercase;">SPOKIY</div>
  </div>

  <p style="font-size:15px;line-height:1.7;">Вітаємо, ${esc(o.first_name)}.</p>
  <p style="font-size:15px;line-height:1.7;">
    Ми отримали ваше замовлення <b>№${esc(o.id)}</b> і вже почали над ним працювати.
    Найближчим часом зв'яжемося з вами, щоб підтвердити розмір і терміни.
    Співчуваємо вашій втраті — обіцяємо зробити все в найкращому вигляді.
  </p>

  <table style="width:100%;border-collapse:collapse;margin:26px 0;font-size:14px;">
    ${row("Модель", esc(o.item.product_name))}
    ${row("Матеріал", esc(o.item.material))}
    ${row("Внутрішній розмір", `${o.item.length_cm} × ${o.item.width_cm} × ${o.item.height_cm} см`)}
    ${row("Труна", money(o.item.price_uah))}
    ${hasEngraving ? row("Нанесення", `${esc(o.engraving.labels.join(", "))} — ${money(o.engraving.price_uah)}`) : ""}
    ${hasEngraving && o.engraving.text ? row("Текст нанесення", `«${esc(o.engraving.text)}»`) : ""}
    ${row("<b>Разом</b>", `<b>${money(o.total_uah)}</b>`)}
    ${row("Термін відправки", lead)}
    ${row("Відділення пошти", esc(o.post_office))}
    ${row("Оплата", "Переказ на реквізити")}
  </table>

  <div style="background:#f5f4f2;padding:18px 20px;font-size:14px;line-height:1.7;">
    <div style="letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#6b6b6b;margin-bottom:8px;">Реквізити для переказу</div>
    ${esc(details)}
    <div style="color:#6b6b6b;margin-top:10px;font-size:13px;">
      Оплату вносьте після дзвінка менеджера — спершу підтвердимо розмір і вартість.
    </div>
  </div>

  <p style="font-size:14px;line-height:1.7;margin-top:26px;">
    Якщо щось потрібно змінити — просто відпишіть на цей лист${phone ? ` або зателефонуйте ${esc(phone)}` : ""}.
  </p>

  <div style="border-top:1px solid #e3e1de;margin-top:30px;padding-top:14px;font-size:12px;color:#8a8a8a;">
    SPOKIY · труни для улюбленців на замовлення
  </div>
</div>`;

  try {
    await transport().sendMail({
      from: from(),
      to: o.email,
      subject: `Замовлення №${o.id} прийнято — SPOKIY`,
      html,
      text:
        `Вітаємо, ${o.first_name}.\n\nМи отримали ваше замовлення №${o.id}.\n` +
        `Модель: ${o.item.product_name}\nРозмір: ${o.item.length_cm}×${o.item.width_cm}×${o.item.height_cm} см\n` +
        `Труна: ${money(o.item.price_uah)}\n` +
        (hasEngraving
          ? `Нанесення: ${o.engraving.labels.join(", ")} — ${money(o.engraving.price_uah)}\n` +
            (o.engraving.text ? `Текст: «${o.engraving.text}»\n` : "")
          : "") +
        `Разом: ${money(o.total_uah)}\n` +
        `Термін: ${lead}\n` +
        `Відділення: ${o.post_office}\n\n` +
        `Реквізити: ${details}\n`,
    });
    return true;
  } catch (e) {
    console.error("mailCustomer:", e);
    return false;
  }
}

function row(k: string, v: string) {
  return `<tr>
    <td style="padding:9px 0;color:#6b6b6b;border-bottom:1px solid #eeecea;width:45%;">${k}</td>
    <td style="padding:9px 0;border-bottom:1px solid #eeecea;">${v}</td>
  </tr>`;
}

function esc(s: string) {
  const map: Record<string, string> = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
  };
  return String(s ?? "").replace(/[<>&"]/g, (c) => map[c] ?? c);
}

/** Перевірка SMTP: підключення, а за потреби — тестовий лист власнику */
export async function checkMail(send: boolean): Promise<{
  configured: boolean;
  ok: boolean;
  error?: string;
}> {
  if (!mailConfigured()) {
    const missing = [
      !process.env.SMTP_HOST && "SMTP_HOST",
      !process.env.SMTP_USER && "SMTP_USER",
      !process.env.SMTP_PASS && "SMTP_PASS",
    ].filter(Boolean);
    return { configured: false, ok: false, error: `Немає ${missing.join(", ")}` };
  }
  if (!process.env.OWNER_EMAIL) {
    return { configured: false, ok: false, error: "Немає OWNER_EMAIL" };
  }

  try {
    await transport().verify();
    if (!send) return { configured: true, ok: true };

    await transport().sendMail({
      from: from(),
      to: process.env.OWNER_EMAIL,
      subject: "SPOKIY: перевірка пошти",
      text: "Якщо ви бачите цей лист — сповіщення про замовлення надсилаються правильно.",
    });
    return { configured: true, ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "smtp error";
    const hint = /not verified|unrecognized|sender/i.test(msg)
      ? " — адресу відправника треба підтвердити в кабінеті Brevo (Senders & Domains)"
      : /auth/i.test(msg)
        ? " — перевірте SMTP_USER і SMTP_PASS"
        : "";
    return { configured: true, ok: false, error: msg + hint };
  }
}
