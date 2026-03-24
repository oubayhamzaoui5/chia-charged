import type { Metadata } from 'next'

import ProductPage from '@/app/shop/[slug]/page'

type Props = {
  params: Promise<{ slug: string }>
}

export const revalidate = 120

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: 'Update Design | Produit',
    description: 'Details produit, disponibilite et recommandations.',
    alternates: { canonical: `/produit/${slug}` },
  }
}

export default ProductPage
