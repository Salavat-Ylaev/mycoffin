import type { Order } from "./types";

const PET_LABEL: Record<string, string> = {
  cat: "Кіт",
  dog: "Пес",
  reptile: "Рептилія",
  rodent: "Гризун",
};

const money = (n: number) => `${n.toLocaleString("uk-UA")} грн`;

export function orderToText(o: Order): string {
  const hasEngraving = Boolean(o.engraving && o.engraving.ids.length);
  const needsTime = Boolean(hasEngraving || o.item.custom_size);

  return [
    `🕯 НОВЕ ЗАМОВЛЕННЯ №${o.id}`,
    ``,
    `Тварина: ${PET_LABEL[o.pet] ?? o.pet}, ~${o.weight_kg} кг`,
    `Модель: ${o.item.product_name}`,
    `Матеріал: ${o.item.material}`,
    `Корпус ${o.item.size_code}: ${o.item.length_cm}×${o.item.width_cm}×${o.item.height_cm} см (внутр.)`,
    `Труна: ${money(o.item.price_uah)}`,
    hasEngraving
      ? `Нанесення: ${o.engraving.labels.join(", ")} — ${money(o.engraving.price_uah)}` +
        (o.engraving.text ? `\nТекст: «${o.engraving.text}»` : ``)
      : `Нанесення: ні`,
    `РАЗОМ: ${money(o.total_uah)}`,
    needsTime
      ? `Термін: +1–3 дні (${[o.item.custom_size ? "розмір поза стандартом" : "", hasEngraving ? "нанесення" : ""].filter(Boolean).join(", ")})`
      : `Термін: у наявності, відправка сьогодні`,
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

/** Перевірка бота: чи живий токен і чи доходить повідомлення */
export async function checkTelegram(send: boolean): Promise<{
  configured: boolean;
  ok: boolean;
  error?: string;
  botName?: string;
}> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return {
      configured: false,
      ok: false,
      error: !token ? "Немає TELEGRAM_BOT_TOKEN" : "Немає TELEGRAM_CHAT_ID",
    };
  }

  try {
    const me = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meJson = await me.json();
    if (!meJson.ok) {
      return { configured: true, ok: false, error: `Токен не приймається: ${meJson.description ?? "?"}` };
    }
    const botName = meJson.result?.username as string | undefined;

    if (!send) return { configured: true, ok: true, botName };

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "SPOKIY: перевірка зв'язку. Якщо ви це бачите — сповіщення про замовлення працюють.",
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      const d = String(json.description ?? "");
      const hint = d.includes("chat not found")
        ? " — напишіть боту будь-яке слово в Telegram, і перевірте TELEGRAM_CHAT_ID"
        : "";
      return { configured: true, ok: false, botName, error: `Telegram відмовив: ${d}${hint}` };
    }
    return { configured: true, ok: true, botName };
  } catch (e) {
    return { configured: true, ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}
