import type { Metadata } from 'next'

import ShopPage from '@/app/shop/page'
import { getPresetInjectedSearchParams } from '@/lib/shop-presets'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Chia Charged | Deals & Promotions',
  description: 'Current deals and promotions on Chia Charged protein chia pudding. Stock up and save on your favorite flavors.',
  alternates: { canonical: '/promotions' },
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function PromotionsPage({ searchParams }: Props) {
  const sp = await searchParams
  const merged = {
    ...sp,
    ...getPresetInjectedSearchParams('promotions'),
  }

  return ShopPage({ searchParams: Promise.resolve(merged) })
}
