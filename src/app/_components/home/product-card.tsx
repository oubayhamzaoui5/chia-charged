import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'

import type { HomeProduct } from './types'

function formatPrice(value: number, currency: string) {
  return `${value.toFixed(2)} ${currency}`
}

export default function ProductCard({ product }: { product: HomeProduct }) {
  const hasPromo = product.promoPrice != null && product.promoPrice > 0 && product.promoPrice < product.price

  return (
    <article className="group overflow-hidden rounded-2xl border border-foreground/10 bg-background transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/produit/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-foreground/5">
          <Image
            src={product.imageUrl || '/aboutimg.webp'}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
            {product.category}
          </Badge>
          <span className={`text-xs ${product.inStock ? 'text-emerald-600' : 'text-rose-600'}`}>
            {product.inStock ? 'En stock' : 'Rupture'}
          </span>
        </div>

        <Link href={`/produit/${product.slug}`} className="block text-base font-semibold leading-snug hover:underline">
          {product.name}
        </Link>

        <p className="line-clamp-2 text-sm text-foreground/65">{product.shortDescription}</p>

        <div className="flex items-center gap-2">
          {hasPromo ? (
            <>
              <span className="text-base font-semibold">{formatPrice(product.promoPrice as number, product.currency)}</span>
              <span className="text-sm text-foreground/50 line-through">
                {formatPrice(product.price, product.currency)}
              </span>
            </>
          ) : (
            <span className="text-base font-semibold">{formatPrice(product.price, product.currency)}</span>
          )}
        </div>
      </div>
    </article>
  )
}
