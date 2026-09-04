"use client";

import { useState } from "react";
import type { ArtPattern, PetKind } from "@/lib/types";
import CoffinArt from "./CoffinArt";

/**
 * Фото моделі з підстраховкою: якщо посилання порожнє або картинка
 * не завантажилась (видалили з Storage, корзина не публічна, немає мережі),
 * показуємо векторну ілюстрацію замість порожньої рамки.
 */
export default function ProductImage({
  src,
  alt,
  art,
  pet,
}: {
  src: string;
  alt: string;
  art: ArtPattern;
  pet: PetKind;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <CoffinArt art={art} pet={pet} label={alt} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
  );
}
