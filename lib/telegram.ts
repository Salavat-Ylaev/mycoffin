import { categoryById } from "./calc";
import type { Order } from "./types";

const PET_LABEL: Record<string, string> = {
  cat: "Кіт",
  dog: "Пес",
  reptile: "Рептилія",
  rodent: "Гризун",
};

const money = (n: number) => `${n.toLocaleString("uk-UA")} грн`;

export function orderToText(o: Order): string {
  const cat = categoryById(o.category_id);
  const hasEngraving = o.engraving && o.engraving.ids.length > 0;

  return [
    `🕯 НОВЕ ЗАМОВЛЕННЯ №${o.id}`,
    ``,
    `Тварина: ${PET_LABEL[o.pet] ?? o.pet}, ~${o.weight_kg} кг`,
    cat ? `Група: ${cat.label_uk} (${cat.examples_uk})` : ``,
    `Модель: ${o.item.product_name}`,
    `Матеріал: ${o.item.material}`,
    `Розмір (внутр.): ${o.item.length_cm}×${o.item.width_cm}×${o.item.height_cm} см`,
    `Труна: ${money(o.item.price_uah)}`,
    hasEngraving
      ? `Нанесення: ${o.engraving.labels.join(", ")} — ${money(o.engraving.price_uah)}` +
        (o.engraving.text ? `\nТекст: «${o.engraving.text}»` : ``)
      : `Нанесення: ні`,
    `РАЗОМ: ${money(o.total_uah)}`,
    hasEngraving ? `Термін: 1–3 дні + 1–3 дні на нанесення` : `Термін: 1–3 дні`,
    ``,
    `Клієнт: ${o.last_name} ${o.first_name}`,
    `Телефон: ${o.phone}`,
    `E-mail: ${o.email}`,
    `Відділення: ${o.post_office}`,
    `Оплата: переказ на реквізити`,
    o.comment ? `\nКоментар: ${o.comment}` : ``,
    ``,
    `Час: ${new Date(o.created_at).toLocaleString("uk-UA")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Надсилає повідомлення в Telegram. Мовчки пропускає, якщо бот не налаштований. */
export async function notifyTelegram(o: Order): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: orderToText(o),
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
