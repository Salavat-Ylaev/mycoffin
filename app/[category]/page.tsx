import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryShell from "@/components/CategoryShell";
import { getProducts, getEngravingOptions } from "@/lib/store";
import type { EngravingOption, Product } from "@/lib/types";
import productsSeed from "@/data/products.json";
import engravingSeed from "@/data/engraving.json";
import { categoryBySlug } from "@/lib/categories";
import { sizesFor, sizeById, priceOf } from "@/lib/calc";
import { abs, buildGraph, BRAND } from "@/lib/seo";

const fallbackProducts = productsSeed as unknown as Product[];
const fallbackEngraving = engravingSeed as unknown as EngravingOption[];

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = categoryBySlug(slug);
  if (!cat) return {};

  return {
    title: cat.title,
    description: cat.description,
    alternates: { canonical: `/${cat.slug}` },
    openGraph: {
      type: "website",
      siteName: BRAND,
      locale: "uk_UA",
      url: `/${cat.slug}`,
      title: cat.title,
      description: cat.description,
    },
    twitter: {
      card: "summary_large_image",
      title: cat.title,
      description: cat.description,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const cat = categoryBySlug(slug);
  if (!cat) notFound();

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

  // ── структуровані дані сторінки ──
  const bands = sizesFor(cat.pet);
  const list = products
    .filter((p) => p.pet === cat.pet && p.in_stock)
    .sort((a, b) => a.sort - b.sort);

  const url = abs(`/${cat.slug}`);

  const items = list
    .map((p) => {
      const prices = bands.map((b) => priceOf(p, b.sizeId)).filter((n) => n > 0);
      if (!prices.length) return null;
      const sizeText = bands
        .map((b) => {
          const s = sizeById(b.sizeId)!;
          return `${s.code} ${s.length}×${s.width}×${s.height} см`;
        })
        .join(", ");
      return {
        "@type": "Product",
        name: `${p.name_uk} — ${cat.short.toLowerCase()}`,
        description: `${p.desc_uk} Матеріал: ${p.material_uk}. Розміри: ${sizeText}.`,
        category: cat.h1,
        brand: { "@type": "Brand", name: BRAND },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "UAH",
          lowPrice: Math.min(...prices),
          highPrice: Math.max(...prices),
          offerCount: prices.length,
          availability: "https://schema.org/InStock",
          url,
        },
      };
    })
    .filter(Boolean);

  const graph = buildGraph([
    {
      "@type": "CollectionPage",
      "@id": `${url}#page`,
      url,
      name: cat.title,
      description: cat.description,
      inLanguage: "uk-UA",
      isPartOf: { "@id": abs("/#website") },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#crumbs`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: BRAND, item: abs("/") },
        { "@type": "ListItem", position: 2, name: cat.short, item: url },
      ],
    },
    ...(items.length
      ? [
          {
            "@type": "ItemList",
            "@id": `${url}#items`,
            name: cat.h1,
            numberOfItems: items.length,
            itemListElement: items.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item,
            })),
          },
        ]
      : []),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: cat.faq.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // розмітка складається на сервері з наших же даних
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <CategoryShell category={cat} products={products} engraving={engraving} />
    </>
  );
}
