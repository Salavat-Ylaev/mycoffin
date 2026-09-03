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

  /** Внутрішня довжина, у межах якої модель виготовляється (см) */
  min_length_cm: number;
  max_length_cm: number;

  /** Ціна за еталонну довжину base_length_cm */
  base_price_uah: number;
  base_length_cm: number;
  /** Наскільки дорожчає кожен додатковий сантиметр довжини */
  price_per_cm_uah: number;

  in_stock: boolean;
  /** URL фото. Порожньо — показуємо векторну ілюстрацію */
  image: string;
  art: ArtPattern;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  material: string;
  price_uah: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
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
  status: "new" | "in_work" | "done" | "cancelled";
}
