import type { Metadata } from 'next'

import ShopPage from '@/app/shop/page'
import { getPresetInjectedSearchParams } from '@/lib/shop-presets'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Update Design | Nouveautés',
  description: 'Découvrez les nouveautés de la boutique Update Design.',
  alternates: { canonical: '/Nouveautes' },
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
