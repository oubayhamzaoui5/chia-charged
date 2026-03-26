import type { Metadata } from 'next'

import ShopPage from '@/app/shop/page'
import { getPresetInjectedSearchParams } from '@/lib/shop-presets'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Chia Charged | My Wishlist',
  description: 'Your saved Chia Charged products. High-protein chia pudding delivered fast across Tunisia.',
  alternates: { canonical: '/wishlist' },
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function WishlistPage({ searchParams }: Props) {
  const sp = await searchParams
  const merged = {
    ...sp,
    ...getPresetInjectedSearchParams('wishlist'),
  }

  return ShopPage({ searchParams: Promise.resolve(merged) })
}
