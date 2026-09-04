import type { PetKind, Product } from "./types";

/**
 * Розрахунок внутрішніх розмірів труни за типом тварини та приблизною вагою.
 *
 * Основа: тіло тварини має щільність близьку до 1 кг/л, тож характерна
 * довжина тіла зростає як корінь кубічний з ваги: L = k * ∛вага.
 * Коефіцієнт k підібраний під пропорції кожного виду.
 * Далі додається технологічний запас на підстилку та вільний простір.
 *
 * Усі розміри округлюються ВГОРУ до кратних 5 см:
 * 54×23×19 стає 55×25×20. Так простіше різати матеріал і тримати склад.
 */

interface Shape {
  /** коефіцієнт довжини тіла */
  k: number;
  /** ширина як частка довжини */
  widthRatio: number;
  /** висота як частка довжини */
  heightRatio: number;
  /** запас довжини, % */
  margin: number;
  /** мінімальні внутрішні розміри, см */
  min: [number, number, number];
  /** допустимий діапазон ваги, кг */
  weight: [number, number];
  /** типова вага для підказки */
  defaultWeight: number;
}

export const SHAPES: Record<PetKind, Shape> = {
  cat: {
    k: 28.5,
    widthRatio: 0.42,
    heightRatio: 0.34,
    margin: 0.14,
    min: [34, 18, 15],
    weight: [0.3, 15],
    defaultWeight: 4.5,
  },
  dog: {
    k: 26.0,
    widthRatio: 0.44,
    heightRatio: 0.38,
    margin: 0.14,
    min: [32, 18, 15],
    weight: [0.5, 90],
    defaultWeight: 12,
  },
  reptile: {
    // рептилії видовжені: більша довжина, менша ширина й висота
    k: 41.0,
    widthRatio: 0.26,
    heightRatio: 0.2,
    margin: 0.12,
    min: [24, 12, 9],
    weight: [0.05, 40],
    defaultWeight: 1.2,
  },
  rodent: {
    k: 23.0,
    widthRatio: 0.46,
    heightRatio: 0.38,
    margin: 0.16,
    min: [18, 11, 9],
    weight: [0.02, 12],
    defaultWeight: 0.35,
  },
};

/* ──────────────────── категорії розміру ────────────────────
   Каталог і калькулятор відштовхуються від цих груп.
   refWeight — середня вага групи, за нею рахується типовий розмір.
   ─────────────────────────────────────────────────────────── */

export interface SizeCategory {
  id: string;
  pet: PetKind;
  label_uk: string;
  label_en: string;
  /** приклади порід / видів */
  examples_uk: string;
  examples_en: string;
  /** діапазон ваги групи, кг */
  range: [number, number];
  /** середня вага групи — за нею рахується типовий розмір */
  refWeight: number;
}

export const CATEGORIES: SizeCategory[] = [
  {
    id: "cat-standard",
    pet: "cat",
    label_uk: "Кіт",
    label_en: "Cat",
    examples_uk: "до 5 кг · більшість порід",
    examples_en: "up to 5 kg · most breeds",
    range: [0.3, 5],
    refWeight: 4.5,
  },
  {
    id: "cat-large",
    pet: "cat",
    label_uk: "Великий кіт",
    label_en: "Large cat",
    examples_uk: "5–10 кг · мейн-кун, рагдол",
    examples_en: "5–10 kg · maine coon, ragdoll",
    range: [5, 15],
    refWeight: 7,
  },

  {
    id: "dog-small",
    pet: "dog",
    label_uk: "Мала порода",
    label_en: "Small breed",
    examples_uk: "до 10 кг · чихуахуа, той, йорк, шпіц",
    examples_en: "up to 10 kg · chihuahua, toy, yorkie, spitz",
    range: [0.5, 10],
    refWeight: 5,
  },
  {
    id: "dog-medium",
    pet: "dog",
    label_uk: "Середня порода",
    label_en: "Medium breed",
    examples_uk: "10–25 кг · бігль, кокер, шнауцер",
    examples_en: "10–25 kg · beagle, cocker, schnauzer",
    range: [10, 25],
    refWeight: 17,
  },
  {
    id: "dog-large",
    pet: "dog",
    label_uk: "Велика порода",
    label_en: "Large breed",
    examples_uk: "25–60 кг · лабрадор, вівчарка, ротвейлер",
    examples_en: "25–60 kg · labrador, shepherd, rottweiler",
    range: [25, 90],
    refWeight: 38,
  },

  {
    id: "reptile-small",
    pet: "reptile",
    label_uk: "Дрібні",
    label_en: "Small",
    examples_uk: "до 300 г · гекон, ящірка, дрібна змія",
    examples_en: "up to 300 g · gecko, lizard, small snake",
    range: [0.05, 0.3],
    refWeight: 0.15,
  },
  {
    id: "reptile-medium",
    pet: "reptile",
    label_uk: "Середні",
    label_en: "Medium",
    examples_uk: "0,3–3 кг · агама, черепаха, полоз",
    examples_en: "0.3–3 kg · bearded dragon, tortoise, rat snake",
    range: [0.3, 3],
    refWeight: 1.2,
  },
  {
    id: "reptile-large",
    pet: "reptile",
    label_uk: "Великі",
    label_en: "Large",
    examples_uk: "3–20 кг · ігуана, пітон, велика черепаха",
    examples_en: "3–20 kg · iguana, python, large tortoise",
    range: [3, 40],
    refWeight: 8,
  },

  {
    id: "rodent-small",
    pet: "rodent",
    label_uk: "Дрібні",
    label_en: "Small",
    examples_uk: "до 500 г · хом'як, миша, щур, піщанка",
    examples_en: "up to 500 g · hamster, mouse, rat, gerbil",
    range: [0.02, 0.5],
    refWeight: 0.25,
  },
  {
    id: "rodent-medium",
    pet: "rodent",
    label_uk: "Середні",
    label_en: "Medium",
    examples_uk: "0,5–1,5 кг · морська свинка, шиншила, дегу",
    examples_en: "0.5–1.5 kg · guinea pig, chinchilla, degu",
    range: [0.5, 1.5],
    refWeight: 0.8,
  },
  {
    id: "rodent-large",
    pet: "rodent",
    label_uk: "Великі",
    label_en: "Large",
    examples_uk: "1,5–5 кг · кролик, тхір",
    examples_en: "1.5–5 kg · rabbit, ferret",
    range: [1.5, 12],
    refWeight: 2.5,
  },
];

export const categoriesFor = (pet: PetKind) => CATEGORIES.filter((c) => c.pet === pet);
export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);

/** У яку групу потрапляє задана вага */
export function categoryForWeight(pet: PetKind, kg: number): SizeCategory {
  const list = categoriesFor(pet);
  return (
    list.find((c) => kg >= c.range[0] && kg <= c.range[1]) ??
    (kg < list[0].range[0] ? list[0] : list[list.length - 1])
  );
}

/* ──────────────────── розміри й ціна ──────────────────── */

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

/** Округлення вгору до кратних 5: 23 → 25, 54 → 55 */
const up5 = (n: number) => Math.ceil(n / 5) * 5;

export function calcDimensions(pet: PetKind, weightKg: number): Dimensions {
  const s = SHAPES[pet];
  const w = Math.min(Math.max(weightKg, s.weight[0]), s.weight[1]);

  // спершу «сирі» розміри, і лише потім округлення —
  // інакше похибка накопичується на ширині й висоті
  const raw = Math.max(s.k * Math.cbrt(w) * (1 + s.margin), s.min[0]);

  return {
    length: up5(raw),
    width: up5(Math.max(raw * s.widthRatio, s.min[1])),
    height: up5(Math.max(raw * s.heightRatio, s.min[2])),
  };
}

/** Типовий розмір для групи — те, що показуємо в каталозі */
export const dimsForCategory = (c: SizeCategory) => calcDimensions(c.pet, c.refWeight);

/** Ціна конкретної моделі під розраховану довжину */
export function priceFor(product: Product, length: number): number {
  const raw =
    product.base_price_uah +
    (length - product.base_length_cm) * product.price_per_cm_uah;
  const floor = Math.round(product.base_price_uah * 0.6);
  return Math.max(Math.round(raw / 50) * 50, floor);
}

export interface Offer {
  product: Product;
  price: number;
  dims: Dimensions;
  /** true — модель штатно перекриває цю довжину */
  exactFit: boolean;
}

/**
 * Підбір 2–4 моделей під розмір.
 * Спершу ті, що штатно перекривають довжину; якщо їх менше двох —
 * додаємо найближчі за діапазоном (виготовимо індивідуально).
 */
export function pickOffers(
  products: Product[],
  pet: PetKind,
  dims: Dimensions,
  limit = 4
): Offer[] {
  const pool = products
    .filter((p) => p.pet === pet && p.in_stock)
    .sort((a, b) => a.sort - b.sort);

  const fits = pool.filter(
    (p) => dims.length >= p.min_length_cm && dims.length <= p.max_length_cm
  );

  const rest = pool
    .filter((p) => !fits.includes(p))
    .sort((a, b) => distance(a, dims.length) - distance(b, dims.length));

  const chosen = [...fits, ...rest].slice(0, Math.max(limit, 2));

  return chosen.map((p) => ({
    product: p,
    price: priceFor(p, dims.length),
    dims,
    exactFit: fits.includes(p),
  }));
}

function distance(p: Product, length: number): number {
  if (length < p.min_length_cm) return p.min_length_cm - length;
  if (length > p.max_length_cm) return length - p.max_length_cm;
  return 0;
}
