import type { Metadata } from 'next'

import ShopPage from '@/app/shop/page'
import { getPresetInjectedSearchParams } from '@/lib/shop-presets'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Update Design | Wishlist',
  description: 'Retrouvez les produits sauvegardés dans votre wishlist Update Design.',
  alternates: { canonical: '/Wishlist' },
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
