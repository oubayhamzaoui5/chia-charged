import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

import ParentHeader from '@/components/admin/ParentHeader'
import { getParentProductWithVariants } from '@/lib/data/products.server'

import ProductsLoadingSkeleton from '../../loading'
import ProductsClient from '../../products.client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Props = {
  params: Promise<{ parentId: string }>
}

function isValidPocketBaseId(id: string): boolean {
  return /^[a-zA-Z0-9]{15}$/.test(id)
}

export async function generateMetadata({ params }: Props) {
  const { parentId } = await params

  return {
    title: 'Chia Charged | Admin Variants',
    description: `Manage variants for product ${parentId}`,
    robots: 'noindex, nofollow',
  }
}

export default async function VariantsPage({ params }: Props) {
  const { parentId } = await params

  if (!isValidPocketBaseId(parentId)) {
    notFound()
  }

  const { parent, variants, categories, variables } = await getParentProductWithVariants(parentId)

  if (!parent) {
    notFound()
  }

  const parentVariantKeys = Object.entries(parent.variantKey ?? {}).map(([key, value]) => ({
    key,
    value: String(value),
  }))

  return (
    <div className="space-y-6 p-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center text-base font-semibold text-blue-600 hover:underline"
      >
        {'<-'} Back to products
      </Link>

      <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-foreground/5" />}>
        <ParentHeader parent={parent} variables={variables} />
      </Suspense>

      <div className="-mx-6">
        <Suspense fallback={<ProductsLoadingSkeleton />}>
          <ProductsClient
            initialProducts={variants}
            totalItems={variants.length}
            initialPage={1}
            perPage={100}
            initialQuery=""
            initialSort="name"
            allCategories={categories}
            parentVariantKeys={parentVariantKeys}
            variables={variables}
            parent={parent}
          />
        </Suspense>
      </div>
    </div>
  )
}
