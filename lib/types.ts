export type PetKind = "cat" | "dog" | "reptile" | "rodent";

export const PET_KINDS: PetKind[] = ["cat", "dog", "reptile", "rodent"];

/** Художній стиль ілюстрації, якщо фото ще не завантажене */
export type ArtPattern = "classic" | "minimal" | "noir" | "goldline" | "eco";

export interface Product {
  id: string;
  pet: PetKind;
  sort: number;

  name_uk: string;
  name_en: string;
  material_uk: string;
  material_en: string;
  desc_uk: string;
  desc_en: string;

  /**
   * Ціна за кожен стандартний корпус: { "s3": 4150, "s4": 4700 }.
   * Ключі — id корпусів із lib/calc.ts. Нуль або відсутній ключ —
   * модель у цьому розмірі не виготовляється.
   */
  prices: Record<string, number>;

  in_stock: boolean;
  /** URL фото. Порожньо — показуємо векторну ілюстрацію */
  image: string;
  art: ArtPattern;
}

/** Платна додаткова послуга: нанесення імені, дат, емблеми, вірша */
export interface EngravingOption {
  id: string;
  sort: number;
  label_uk: string;
  label_en: string;
  hint_uk: string;
  hint_en: string;
  price_uah: number;
  /** чи потрібно клієнту вписати текст */
  needs_text: boolean;
  enabled: boolean;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  material: string;
  price_uah: number;
  /** стандартний корпус */
  size_id: string;
  size_code: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  /** true — вага поза стандартним рядом, розмір індивідуальний */
  custom_size: boolean;
}

export interface OrderEngraving {
  /** id обраних послуг */
  ids: string[];
  /** назви послуг мовою замовлення — щоб лист не залежав від змін у прайсі */
  labels: string[];
  text: string;
  price_uah: number;
}

export interface Order {
  id: string;
  created_at: string;
  pet: PetKind;
  weight_kg: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  post_office: string;
  payment: "transfer";
  comment: string;
  item: OrderItem;
  engraving: OrderEngraving;
  total_uah: number;
  status: "new" | "in_work" | "done" | "cancelled";
}
