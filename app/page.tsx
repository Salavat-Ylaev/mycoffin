import SiteShell from "@/components/SiteShell";
import { getProducts, getEngravingOptions } from "@/lib/store";
import type { EngravingOption, Product } from "@/lib/types";
import productsSeed from "@/data/products.json";
import engravingSeed from "@/data/engraving.json";

const fallbackProducts = productsSeed as unknown as Product[];
const fallbackEngraving = engravingSeed as unknown as EngravingOption[];

export const dynamic = "force-dynamic";

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

  return <SiteShell products={products} engraving={engraving} />;
}
