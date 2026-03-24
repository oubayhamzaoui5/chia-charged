import type { Metadata } from 'next'

import ShopPage from '@/app/shop/page'
import { getPresetInjectedSearchParams } from '@/lib/shop-presets'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Update Design | Promotions',
  description: 'Profitez des promotions en cours sur la boutique Update Design.',
  alternates: { canonical: '/Promotions' },
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
