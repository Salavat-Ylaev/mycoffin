import type { PetKind, Product } from "./types";

/**
 * СТАНДАРТНІ КОРПУСИ
 *
 * Розміри більше не рахуються під кожну тварину окремо — це неможливо
 * поставити на потік. Замість цього сім стандартних корпусів, які меблевий
 * цех ріже серіями. Частина корпусів спільна для різних тварин:
 * кіт до 5 кг і пес до 10 кг лягають в один, великий гризун і дрібна
 * рептилія — в інший.
 *
 * Усі розміри — ВНУТРІШНІ, у сантиметрах, кратні 5.
 */

export interface CoffinSize {
  id: string;
  /** маркування для цеху */
  code: string;
  length: number;
  width: number;
  height: number;
}

export const SIZES: CoffinSize[] = [
  { id: "s1", code: "C1", length: 25, width: 15, height: 10 },
  { id: "s2", code: "C2", length: 50, width: 25, height: 20 },
  { id: "s3", code: "C3", length: 65, width: 30, height: 25 },
  { id: "s4", code: "C4", length: 75, width: 35, height: 30 },
  { id: "s5", code: "C5", length: 95, width: 25, height: 20 },
  { id: "s6", code: "C6", length: 100, width: 45, height: 40 },
  { id: "s7", code: "C7", length: 135, width: 60, height: 55 },
];

export const sizeById = (id: string) => SIZES.find((s) => s.id === id);

/**
 * Як корпуси розподілені по тваринах.
 * Порядок у масиві = порядок показу; останній варіант виду — найбільший.
 */
export interface PetSize {
  pet: PetKind;
  sizeId: string;
  label_uk: string;
  label_en: string;
  examples_uk: string;
  examples_en: string;
  /** верхня межа ваги, кг — нижня береться з попереднього варіанта */
  maxWeight: number;
}

export const PET_SIZES: PetSize[] = [
  {
    pet: "cat",
    sizeId: "s3",
    label_uk: "Стандарт",
    label_en: "Standard",
    examples_uk: "до 5 кг · більшість порід",
    examples_en: "up to 5 kg · most breeds",
    maxWeight: 5,
  },
  {
    pet: "cat",
    sizeId: "s4",
    label_uk: "Максі",
    label_en: "Maxi",
    examples_uk: "5–12 кг · мейн-кун, рагдол",
    examples_en: "5–12 kg · maine coon, ragdoll",
    maxWeight: 12,
  },

  {
    pet: "dog",
    sizeId: "s3",
    label_uk: "Мала порода",
    label_en: "Small breed",
    examples_uk: "до 10 кг · чихуахуа, той, йорк, шпіц",
    examples_en: "up to 10 kg · chihuahua, toy, yorkie, spitz",
    maxWeight: 10,
  },
  {
    pet: "dog",
    sizeId: "s6",
    label_uk: "Середня порода",
    label_en: "Medium breed",
    examples_uk: "10–35 кг · бігль, кокер, лабрадор",
    examples_en: "10–35 kg · beagle, cocker, labrador",
    maxWeight: 35,
  },
  {
    pet: "dog",
    sizeId: "s7",
    label_uk: "Велика порода",
    label_en: "Large breed",
    examples_uk: "35–90 кг · вівчарка, ротвейлер, алабай",
    examples_en: "35–90 kg · shepherd, rottweiler, alabai",
    maxWeight: 90,
  },

  {
    pet: "reptile",
    sizeId: "s2",
    label_uk: "Мала",
    label_en: "Small",
    examples_uk: "до 1 кг · гекон, ящірка, дрібна змія",
    examples_en: "up to 1 kg · gecko, lizard, small snake",
    maxWeight: 1,
  },
  {
    pet: "reptile",
    sizeId: "s5",
    label_uk: "Велика",
    label_en: "Large",
    examples_uk: "1–8 кг · агама, черепаха, пітон, ігуана",
    examples_en: "1–8 kg · bearded dragon, tortoise, python, iguana",
    maxWeight: 8,
  },

  {
    pet: "rodent",
    sizeId: "s1",
    label_uk: "Мала",
    label_en: "Small",
    examples_uk: "до 500 г · хом'як, миша, щур, піщанка",
    examples_en: "up to 500 g · hamster, mouse, rat, gerbil",
    maxWeight: 0.5,
  },
  {
    pet: "rodent",
    sizeId: "s2",
    label_uk: "Велика",
    label_en: "Large",
    examples_uk: "0,5–4 кг · свинка, шиншила, кролик, тхір",
    examples_en: "0.5–4 kg · guinea pig, chinchilla, rabbit, ferret",
    maxWeight: 4,
  },
];

export const sizesFor = (pet: PetKind) => PET_SIZES.filter((s) => s.pet === pet);

export const petSize = (pet: PetKind, sizeId: string) =>
  PET_SIZES.find((s) => s.pet === pet && s.sizeId === sizeId);

/** Нижня межа варіанта — верхня межа попереднього */
export function weightRange(ps: PetSize): [number, number] {
  const list = sizesFor(ps.pet);
  const i = list.indexOf(ps);
  return [i === 0 ? 0 : list[i - 1].maxWeight, ps.maxWeight];
}

/** Максимальна вага, яку закриває стандартний ряд для цього виду */
export const maxStandardWeight = (pet: PetKind) => {
  const list = sizesFor(pet);
  return list[list.length - 1].maxWeight;
};

/**
 * Який корпус потрібен для такої ваги.
 * Якщо тварина важча за весь стандартний ряд — повертаємо найбільший корпус
 * і прапорець custom: такий заказ рахується індивідуальним (+1–3 дні).
 */
export function sizeForWeight(
  pet: PetKind,
  kg: number
): { option: PetSize; custom: boolean } {
  const list = sizesFor(pet);
  const found = list.find((s) => kg <= s.maxWeight);
  return found
    ? { option: found, custom: false }
    : { option: list[list.length - 1], custom: true };
}

/* ──────────────────── ціна ──────────────────── */

/** Ціна моделі під конкретний корпус; 0 — ціну не задано в адмінці */
export const priceOf = (product: Product, sizeId: string): number =>
  Number(product.prices?.[sizeId] ?? 0);

export interface Offer {
  product: Product;
  price: number;
  size: CoffinSize;
  /** true — вага поза стандартним рядом, ціну підтверджує менеджер */
  custom: boolean;
}

/** Усі доступні моделі під обраний корпус */
export function pickOffers(
  products: Product[],
  pet: PetKind,
  sizeId: string,
  custom = false
): Offer[] {
  const size = sizeById(sizeId);
  if (!size) return [];

  return products
    .filter((p) => p.pet === pet && p.in_stock && priceOf(p, sizeId) > 0)
    .sort((a, b) => a.sort - b.sort)
    .map((p) => ({ product: p, price: priceOf(p, sizeId), size, custom }));
}

/** Найдешевша ціна моделі по всіх корпусах — для картки каталогу */
export const priceFrom = (product: Product): number => {
  const values = Object.values(product.prices ?? {})
    .map(Number)
    .filter((n) => n > 0);
  return values.length ? Math.min(...values) : 0;
};
