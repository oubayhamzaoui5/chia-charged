import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getShopList } from '@/lib/services/product.service'

const querySchema = z.object({
  category: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{1,40}$/)
    .default('lighting'),
  limit: z.coerce.number().int().min(1).max(12).default(8),
})

function mapCategoryName(rawCategory: string) {
  if (rawCategory === 'lighting') return 'Lighting'
  if (rawCategory === 'decor') return 'Decor'
  return rawCategory
}

export async function GET(request: NextRequest) {
  const rawCategory = request.nextUrl.searchParams.get('category') ?? 'lighting'
  const rawLimit = request.nextUrl.searchParams.get('limit') ?? '8'
  const parsed = querySchema.safeParse({ category: rawCategory, limit: rawLimit })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Requete invalide.' }, { status: 400 })
  }

  const { category, limit } = parsed.data

  try {
    const data = await getShopList({
      page: 1,
      perPage: limit,
      query: undefined,
      category,
      promotions: undefined,
      nouveautes: undefined,
      sort: 'latest',
    })

    const products = data.products.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      price: item.price,
      promoPrice: item.promoPrice,
      currency: item.currency || 'DT',
      imageUrl: item.imageUrls[0] ?? '/aboutimg.webp',
      shortDescription: item.description || 'Produit design pour interieur contemporain.',
      category: data.activeCategory?.name ?? mapCategoryName(category),
      inStock: item.inStock,
    }))

    return NextResponse.json({ products }, { status: 200 })
  } catch {
    return NextResponse.json({ products: [] }, { status: 200 })
  }
}
