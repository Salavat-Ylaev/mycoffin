import SiteShell from "@/components/SiteShell";
import { getProducts } from "@/lib/store";
import type { Product } from "@/lib/types";
import seedJson from "@/data/products.json";

const seed = seedJson as unknown as Product[];

export const dynamic = "force-dynamic";

export default async function Home() {
  let products: Product[];
  try {
    products = await getProducts();
  } catch (e) {
    console.error("getProducts:", e);
    products = seed;
  }
  return <SiteShell products={products} />;
}
