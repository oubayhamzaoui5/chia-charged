import type { Metadata } from 'next'

import ShopPage from '@/app/shop/page'
import { getPresetInjectedSearchParams } from '@/lib/shop-presets'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Chia Charged | New Arrivals',
  description: 'Discover the latest from Chia Charged — new flavors, bundles and limited drops. High-protein chia pudding made in Tunisia.',
  alternates: { canonical: '/new-arrivals' },
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function NouveautesPage({ searchParams }: Props) {
  const sp = await searchParams
  const merged = {
    ...sp,
    ...getPresetInjectedSearchParams('nouveautes'),
  }

  return ShopPage({ searchParams: Promise.resolve(merged) })
}
