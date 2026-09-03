import type { PetKind, Product } from "./types";

/**
 * Розрахунок внутрішніх розмірів труни за типом тварини та приблизною вагою.
 *
 * Основа: тіло тварини має щільність близьку до 1 кг/л, тож характерна
 * довжина тіла зростає як корінь кубічний з ваги: L = k * ∛вага.
 * Коефіцієнт k підібраний під пропорції кожного виду.
 * Далі додається технологічний запас на підстилку та вільний простір.
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

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

const round = (n: number, step = 1) => Math.ceil(n / step) * step;

export function calcDimensions(pet: PetKind, weightKg: number): Dimensions {
  const s = SHAPES[pet];
  const w = Math.min(Math.max(weightKg, s.weight[0]), s.weight[1]);

  const body = s.k * Math.cbrt(w);
  const length = round(Math.max(body * (1 + s.margin), s.min[0]), 2);
  const width = round(Math.max(length * s.widthRatio, s.min[1]), 1);
  const height = round(Math.max(length * s.heightRatio, s.min[2]), 1);

  return { length, width, height };
}

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
