import type { Metadata } from 'next'

import ShopClient from './shop.client'
import { parseShopListInput, getShopCategoryBySlug, getShopList } from '@/lib/services/product.service'

export const revalidate = 120

type SearchParams = Record<string, string | string[] | undefined>
const DEFAULT_SHOP_DESCRIPTION = 'Decouvrez notre boutique, nos promotions et nos nouveautes.'
const SHOP_META_DESCRIPTION_MAX = 170

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function formatMetaDescription(value?: string | null): string {
  const text = (value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const raw = text || DEFAULT_SHOP_DESCRIPTION
  if (raw.length <= SHOP_META_DESCRIPTION_MAX) return raw
  return `${raw.slice(0, SHOP_META_DESCRIPTION_MAX - 3).trimEnd()}...`
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const sp = await searchParams
  const categorySlug = firstParam(sp.category)
  const category = categorySlug ? await getShopCategoryBySlug(categorySlug) : null

  return {
    title: `Update Design | ${category?.name ?? 'Boutique'}`,
    description: formatMetaDescription(category?.description),
    alternates: { canonical: '/boutique' },
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const rawSearchParams = await searchParams
  const input = { ...parseShopListInput(rawSearchParams), page: 1 }
  const data = await getShopList(input)

  return (
    <div>
      <ShopClient data={data} searchParams={rawSearchParams} />
    </div>
  )
}
