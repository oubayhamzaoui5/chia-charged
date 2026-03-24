import { getPb } from "@/lib/pb";
import type { Product } from "@/components/shop/product-card";
import { getProductsStockMap } from "@/lib/stock";

export async function getBestSellers(): Promise<Product[]> {
  const pb = getPb();

  const res = await pb.collection("products").getList(1, 12, {
    sort: "-soldCount", // or any field you use for best sellers
    filter: "isActive=true && (inView=true || inView=null)",
  });

  const productIds = res.items.map((r: any) => r.id);
  const stockMap = await getProductsStockMap(productIds);

  return res.items.map((r: any): Product => ({
    id: r.id,
    slug: r.slug ?? "",
    sku: r.sku ?? "",
    name: r.name ?? "",
    price: Number(r.price ?? 0),
    promoPrice: r.promoPrice ?? null,
    isActive: Boolean(r.isActive),
    inView:
      r.inView === undefined || r.inView === null
        ? true
        : Boolean(r.inView),
    description: r.description ?? "",
    images: Array.isArray(r.images) ? r.images : [],
    currency: r.currency ?? "DT",
    categories: Array.isArray(r.categories)
      ? r.categories
      : r.category
        ? [r.category]
        : [],

    inStock: stockMap[r.id] ?? false,
  }));
}