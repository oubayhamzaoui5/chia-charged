import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import ProductClient from './product.client'
import { getProductDetailsBySlug } from '@/lib/services/product.service'

export const revalidate = 120

type MetadataProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { slug } = await params
  return {
    title: 'Update Design | Produit',
    description: 'Details produit, disponibilite et recommandations.',
    alternates: { canonical: `/produit/${slug}` },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getProductDetailsBySlug(slug)

  if (!data) {
    notFound()
  }

  return (
    <ProductClient
      product={data.product}
      imageUrls={data.imageUrls}
      categoryName={data.categoryName}
      categories={data.categories}
      explicitRelatedProducts={data.explicitRelatedProducts}
      relatedProducts={data.relatedProducts}
      availability={data.availability}
      variants={data.variants}
      variantUrlMap={data.variantUrlMap}
      variantValuesMap={data.variantValuesMap}
    />
  )
}
