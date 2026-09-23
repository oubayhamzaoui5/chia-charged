import { NextRequest, NextResponse } from "next/server"
import { createServerPb } from "@/lib/pb"
import { catalogCategoryIds, resolveCatalogPrice } from "@/lib/catalog-pricing"

function normalizeImageFilenames(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean)
      }
    } catch {
      // keep as plain filename
    }

    return [trimmed]
  }

  return []
}

function normalizeProduct(record: Record<string, unknown>, promoPrice: number | null) {
  const PB_BASE =
    process.env.NEXT_PUBLIC_PB_URL ??
    process.env.POCKETBASE_URL ??
    "http://127.0.0.1:8090"
  const images = normalizeImageFilenames(record?.images)
  const productId = String(record?.id ?? "")

  return {
    id: productId,
    slug: String(record?.slug ?? ""),
    name: String(record?.name ?? ""),
    sku: String(record?.sku ?? ""),
    images,
    imageUrls: images.map(
      (filename: string) =>
        `${PB_BASE}/api/files/products/${productId}/${encodeURIComponent(filename)}`
    ),
    price: typeof record?.price === "number" ? record.price : Number(record?.price ?? 0),
    promoPrice,
    currency: String(record?.currency ?? "USD"),
    stock: typeof record?.stock === "number" ? record.stock : Number(record?.stock ?? 0),
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const safeId = String(id ?? "").trim()
    if (!/^[a-zA-Z0-9]{15}$/.test(safeId)) {
      return NextResponse.json({ error: "productId invalide" }, { status: 400 })
    }

    const pb = createServerPb()
    const record = await pb.collection("products").getOne(safeId, {
      fields: "id,slug,name,sku,images,price,promoPrice,currency,stock,isActive,inView,category",
      requestKey: null,
    })

    if (record.isActive === false || record.inView === false) {
      return NextResponse.json({ error: "Produit indisponible" }, { status: 404 })
    }

    const categoryIds = catalogCategoryIds(record.category)
    const categories = categoryIds.length === 0 ? [] : await pb.collection("categories").getFullList({
      filter: categoryIds.map((categoryId) => `id = '${categoryId}'`).join(" || "),
      fields: "id,promo,activeAll",
      requestKey: null,
    })
    const categoryMap = new Map(categories.map((category) => [category.id, category]))
    const price = resolveCatalogPrice(
      Number(record.price),
      record.promoPrice == null ? null : Number(record.promoPrice),
      categoryIds.map((categoryId) => {
        const category = categoryMap.get(categoryId)
        return { id: categoryId, percent: Number(category?.promo ?? 0), active: category?.activeAll === true }
      }),
    )
    const promoPrice = price && price.unitPriceCents < price.baseUnitPriceCents ? price.unitPriceCents / 100 : null
    return NextResponse.json({ product: normalizeProduct(record, promoPrice) }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
  }
}
