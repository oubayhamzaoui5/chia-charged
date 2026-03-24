import type { Metadata } from 'next'

import ShopPage from '@/app/shop/page'
import { getShopCategoryBySlug } from '@/lib/services/product.service'
const DEFAULT_SHOP_DESCRIPTION = 'Decouvrez notre boutique, nos promotions et nos nouveautes.'
const SHOP_META_DESCRIPTION_MAX = 170

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const revalidate = 120

function formatMetaDescription(value?: string | null): string {
  const text = (value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const raw = text || DEFAULT_SHOP_DESCRIPTION
  if (raw.length <= SHOP_META_DESCRIPTION_MAX) return raw
  return `${raw.slice(0, SHOP_META_DESCRIPTION_MAX - 3).trimEnd()}...`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getShopCategoryBySlug(slug)

  return {
    title: `Update Design | ${category?.name ?? 'Boutique'}`,
    description: formatMetaDescription(category?.description),
    alternates: { canonical: `/boutique/categorie/${slug}` },
  }
}

export default async function BoutiqueCategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams

  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) {
      if (value[0]) normalized[key] = value[0]
    } else if (value) {
      normalized[key] = value
    }
  }

  normalized.category = slug

  return ShopPage({ searchParams: Promise.resolve(normalized) })
}
