import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'

import ShopPage from '@/app/shop/page'
import {
  detectShopPreset,
  getShopPresetPath,
  normalizeShopSearchParams,
  stripPresetParams,
} from '@/lib/shop-presets'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Update Design | Boutique',
  description: 'Decouvrez notre boutique, nos promotions et nos nouveautes.',
  alternates: { canonical: '/boutique' },
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function BoutiquePage({ searchParams }: Props) {
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
    permanentRedirect(`/boutique/categorie/${categorySlug}${suffix}`)
  }

  const preset = detectShopPreset(normalized)
  if (preset) {
    const filtered = stripPresetParams(new URLSearchParams(normalized), preset)
    const query = filtered.toString()
    const targetPath = getShopPresetPath(preset)
    permanentRedirect(query ? `${targetPath}?${query}` : targetPath)
  }

  return ShopPage({ searchParams: Promise.resolve(normalized) })
}
