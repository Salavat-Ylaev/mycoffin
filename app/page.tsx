import SiteShell from "@/components/SiteShell";
import { getProducts, getEngravingOptions } from "@/lib/store";
import { PET_KINDS, type EngravingOption, type PetKind, type Product } from "@/lib/types";
import productsSeed from "@/data/products.json";
import engravingSeed from "@/data/engraving.json";
import {
  buildGraph,
  storeJsonLd,
  webSiteJsonLd,
  faqJsonLd,
  offerCatalogJsonLd,
  type CatalogGroup,
} from "@/lib/seo";

const fallbackProducts = productsSeed as unknown as Product[];
const fallbackEngraving = engravingSeed as unknown as EngravingOption[];

export const dynamic = "force-dynamic";

/** Підписи груп для структурованих даних */
const GROUP_LABELS: Record<PetKind, [string, string]> = {
  cat: ["Труни для котів", "Класична форма, розміри під кота до 5 кг і великого кота до 12 кг."],
  dog: [
    "Труни для собак",
    "Чотири розміри: від дрібної породи до 4 кг до великої породи до 90 кг.",
  ],
  reptile: [
    "Кофри для рептилій",
    "Довга вузька форма для геконів, ящірок, змій, агам і черепах.",
  ],
  rodent: [
    "Скриньки для гризунів",
    "Компактна форма для хом'яків, щурів, морських свинок, шиншил і кролів.",
  ],
};

/** Усі ціни одного виду — щоб порахувати діапазон «від і до» */
function priceSpan(products: Product[], pet: PetKind): [number, number] | null {
  const values = products
    .filter((p) => p.pet === pet && p.in_stock)
    .flatMap((p) => Object.values(p.prices ?? {}).map(Number))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!values.length) return null;
  return [Math.min(...values), Math.max(...values)];
}

export default async function Home() {
  let products: Product[];
  let engraving: EngravingOption[];

  try {
    products = await getProducts();
  } catch (e) {
    console.error("getProducts:", e);
    products = fallbackProducts;
  }

  try {
    engraving = await getEngravingOptions();
  } catch (e) {
    console.error("getEngravingOptions:", e);
    engraving = fallbackEngraving;
  }

  // ── структуровані дані: збираємо з тих самих цін, що показує каталог ──
  const groups: CatalogGroup[] = [];
  const allPrices: number[] = [];

  for (const pet of PET_KINDS) {
    const span = priceSpan(products, pet);
    if (!span) continue;
    const [label, description] = GROUP_LABELS[pet];
    groups.push({ label, description, minPrice: span[0], maxPrice: span[1] });
    allPrices.push(span[0], span[1]);
  }

  const priceRange = allPrices.length
    ? `${Math.min(...allPrices)}–${Math.max(...allPrices)} UAH`
    : undefined;

  const graph = buildGraph([
    webSiteJsonLd(),
    storeJsonLd(priceRange),
    ...(groups.length ? [offerCatalogJsonLd(groups)] : []),
    faqJsonLd(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // розмітка складається на сервері з наших же даних, сторонніх рядків тут немає
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <SiteShell products={products} engraving={engraving} />
    </>
  );
}
