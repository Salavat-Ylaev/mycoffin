/**
 * SEO — одне джерело правди для адреси сайту, розмітки та перевірок.
 *
 * Канонічний домен задається в NEXT_PUBLIC_SITE_URL. Без нього беремо
 * petskorbota.store: так canonical і sitemap не зламаються, навіть якщо змінну
 * забули додати в Vercel.
 */

const RAW_SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://petskorbota.store";

/** Адреса без слеша в кінці — щоб не плодити //, коли клеїмо шляхи */
export const SITE_URL = RAW_SITE.replace(/\/+$/, "");

/** Хост без схеми — для middleware і для порівнянь */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

export const abs = (path = "/") =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const BRAND = "Pet Skorbota";

/** Контакти беремо з тих самих змінних, що показує сайт */
export const PHONE = process.env.NEXT_PUBLIC_PHONE || "";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_EMAIL || "";

/** Код підтвердження з Google Search Console (метод «HTML-тег») */
export const GOOGLE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "";

/** Ідентифікатор Google Analytics 4, вигляду G-XXXXXXX */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

/* ──────────────────── структуровані дані ──────────────────── */

type Jsonish = Record<string, unknown>;

/**
 * Організація + магазин. Google використовує це для панелі знань
 * і для зв'язку сайту з брендом.
 */
export function storeJsonLd(priceRange?: string): Jsonish {
  const node: Jsonish = {
    "@type": ["Store", "Organization"],
    "@id": abs("/#store"),
    name: BRAND,
    url: SITE_URL,
    description:
      "Труни ручної роботи для котів, собак, рептилій і гризунів. " +
      "Стандартні розміри в наявності, відправка того ж дня.",
    image: abs("/opengraph-image.png"),
    areaServed: { "@type": "Country", name: "Україна" },
    currenciesAccepted: "UAH",
    paymentAccepted: "Переказ на реквізити",
    knowsLanguage: ["uk", "en"],
  };
  if (priceRange) node.priceRange = priceRange;
  if (PHONE) node.telephone = PHONE;
  if (CONTACT_EMAIL) node.email = CONTACT_EMAIL;
  return node;
}

/** Перелік того, що продаємо, згруповано за видом тварини */
export interface CatalogGroup {
  label: string;
  description: string;
  minPrice: number;
  maxPrice: number;
}

export function offerCatalogJsonLd(groups: CatalogGroup[]): Jsonish {
  return {
    "@type": "OfferCatalog",
    "@id": abs("/#catalog"),
    name: "Каталог трун для улюбленців",
    itemListElement: groups.map((g, i) => ({
      "@type": "OfferCatalog",
      position: i + 1,
      name: g.label,
      description: g.description,
      itemListElement: [
        {
          "@type": "Offer",
          priceCurrency: "UAH",
          priceSpecification: {
            "@type": "PriceSpecification",
            minPrice: g.minPrice,
            maxPrice: g.maxPrice,
            priceCurrency: "UAH",
          },
          availability: "https://schema.org/InStock",
          itemOffered: { "@type": "Product", name: g.label },
        },
      ],
    })),
  };
}

/**
 * Питання, які реально ставлять по телефону. FAQPage інколи дає
 * розгорнутий сніпет у видачі — і це безкоштовне місце в результатах.
 */
export const FAQ: Array<[string, string]> = [
  [
    "Як дізнатися, який розмір труни потрібен?",
    "Вкажіть тип тварини та приблизну вагу — калькулятор на сайті сам підбере " +
      "стандартний корпус і покаже внутрішній розмір у сантиметрах. Точність до " +
      "кілограма не потрібна, ми уточнимо при підтвердженні замовлення.",
  ],
  [
    "Скільки чекати на замовлення?",
    "Більшість корпусів у наявності — відправляємо того ж дня. Плюс 1–3 дні " +
      "потрібно лише на індивідуальний розмір або на гравіювання. Далі термін " +
      "залежить від пошти; по Дніпру привозимо протягом кількох годин.",
  ],
  [
    "Чи можна нанести ім'я та дати?",
    "Так. Гравіювання імені — 250 грн, дати життя — 250 грн, емблема — 350 грн, " +
      "посмертний вірш — 500 грн. Нанесення додає 1–3 дні до відправки.",
  ],
  [
    "Для яких тварин ви робите труни?",
    "Для котів, собак усіх порід, рептилій і гризунів. Форма виробу різна: " +
      "для котів і собак — класична труна, для рептилій — довгий вузький кофр, " +
      "для гризунів — компактна скринька.",
  ],
  [
    "Як оплатити?",
    "Переказом на реквізити. Оплату вносите після дзвінка менеджера — спершу " +
      "ми підтверджуємо розмір і остаточну вартість.",
  ],
  [
    "Чи підходить труна для поховання в землю?",
    "Модель «Еко» зроблена саме для цього: березова фанера і льон, без лаку, " +
      "матеріали біорозкладні.",
  ],
];

export function faqJsonLd(): Jsonish {
  return {
    "@type": "FAQPage",
    "@id": abs("/#faq"),
    mainEntity: FAQ.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function webSiteJsonLd(): Jsonish {
  return {
    "@type": "WebSite",
    "@id": abs("/#website"),
    url: SITE_URL,
    name: BRAND,
    inLanguage: "uk-UA",
    publisher: { "@id": abs("/#store") },
  };
}

/** Збирає весь граф в один тег — так Google читає його одним шматком */
export function buildGraph(nodes: Jsonish[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
