import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'

import ShopClient from './shop.client'
import { parseShopListInput, getShopCategoryBySlug, getShopList } from '@/lib/services/product.service'
import {
  detectShopPreset,
  getShopPresetPath,
  normalizeShopSearchParams,
  stripPresetParams,
} from '@/lib/shop-presets'

export const revalidate = 120

type SearchParams = Record<string, string | string[] | undefined>
const SHOP_META_DESCRIPTION_MAX = 170

function formatMetaDescription(value?: string | null): string {
  const text = (value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const raw = text || 'Shop Chia Charged — high-protein chia seed pudding with 22g protein, 12g fiber and MCT oil. Strawberry & Cream and Chocolate flavors. Fast delivery in Tunisia.'
  if (raw.length <= SHOP_META_DESCRIPTION_MAX) return raw
  return `${raw.slice(0, SHOP_META_DESCRIPTION_MAX - 3).trimEnd()}...`
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const sp = await searchParams
  const normalized = normalizeShopSearchParams(sp)
  const categorySlug = normalized.category
  const category = categorySlug ? await getShopCategoryBySlug(categorySlug) : null

  return {
    title: `Chia Charged | ${category?.name ?? 'Shop'} — High-Protein Chia Pudding`,
    description: formatMetaDescription(category?.description),
    alternates: { canonical: '/shop' },
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const normalized = normalizeShopSearchParams(sp)
  const categorySlug = normalized.category

  if (categorySlug) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(normalized)) {
      if (key === 'category') continue
      query.set(key, value)
    }
    const suffix = query.toString() ? `?${query.toString()}` : ''
    permanentRedirect(`/shop/category/${categorySlug}${suffix}`)
  }

  const preset = detectShopPreset(normalized)
  if (preset) {
    const filtered = stripPresetParams(new URLSearchParams(normalized), preset)
    const query = filtered.toString()
    const targetPath = getShopPresetPath(preset)
    permanentRedirect(query ? `${targetPath}?${query}` : targetPath)
  }

  const input = { ...parseShopListInput(normalized), page: 1 }
  const data = await getShopList(input)

  return (
    <div>
      <ShopClient data={data} searchParams={normalized} />
    </div>
  )
}
