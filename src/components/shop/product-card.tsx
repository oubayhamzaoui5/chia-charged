'use client'

import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'

import { toggleWishlistForProduct } from '@/lib/shop/client-api'

export type Product = {
  id: string
  slug: string
  sku: string
  name: string
  price: number
  promoPrice?: number | null
  isActive: boolean
  inView: boolean
  description?: string | null
  images: string[]
  imageUrls?: string[]
  currency: string
  category?: string | string[] | null
  categories?: string[]
  expand?: unknown
  isNew?: boolean
  inStock?: boolean
}

// Compatibility type used by /app/shop/[slug]/product.client.tsx
export type CategoryOption = {
  id: string
  name: string
  slug?: string
  parent?: string | string[] | null
  description?: string | null
}

export default function ProductCard({
  p,
  categories,
  initialWishlisted = false,
  originQuery = '',
  prioritizeImage = false,
}: {
  p: Product
  categories?: CategoryOption[]
  initialWishlisted?: boolean
  originQuery?: string
  prioritizeImage?: boolean
}) {
  void categories
  const router = useRouter()

  const imageUrls = useMemo(() => (Array.isArray(p.imageUrls) ? p.imageUrls : []), [p.imageUrls])
  const imageCount = imageUrls.length

  const [hovered, setHovered] = useState(false)
  const [liked, setLiked] = useState(initialWishlisted)
  const [isWishLoading, setIsWishLoading] = useState(false)

  const productHref = originQuery ? `/produit/${p.slug}?${originQuery}` : `/produit/${p.slug}`

  useEffect(() => {
    setLiked(initialWishlisted)
  }, [initialWishlisted])

  const imageSrc = imageCount > 0 ? imageUrls[0] : '/aboutimg.webp'
  const hoverImageSrc = imageCount > 1 ? imageUrls[1] : imageSrc

  const hasPromo = p.promoPrice != null && p.promoPrice > 0 && p.promoPrice < p.price
  const isSale = hasPromo
  const isNew = Boolean(p.isNew)
  const inStock = p.inStock ?? true

  const handleWishlistClick = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    try {
      setIsWishLoading(true)
      const inWishlist = await toggleWishlistForProduct(p.id)
      setLiked(inWishlist)
    } catch {
      const currentPath =
        typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : `/produit/${p.slug}`
      router.push(`/connexion?next=${encodeURIComponent(currentPath)}`)
    } finally {
      setIsWishLoading(false)
    }
  }

  return (
    <div className="group">
      <Link href={productHref}>
        <div
          className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-secondary transition-smooth"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <Image
            src={hovered ? hoverImageSrc : imageSrc}
            alt={p.name}
            fill
            priority={prioritizeImage}
            loading={prioritizeImage ? 'eager' : 'lazy'}
            sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 45vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />

          <div className="absolute left-4 top-4 z-10 flex gap-2">
            {isNew && (
              <div className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                New
              </div>
            )}
            {isSale && (
              <div className="rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-white">
                Promo
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-background/80 opacity-80 shadow-sm backdrop-blur-sm transition hover:scale-105 active:scale-95"
            onClick={handleWishlistClick}
            disabled={isWishLoading}
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                liked ? 'fill-accent text-accent' : 'fill-transparent text-foreground/80'
              }`}
            />
          </button>

          {!inStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/25">
              <span className="text-sm font-semibold text-white">Rupture de stock</span>
            </div>
          )}
        </div>
      </Link>

      <div className="space-y-2">
        <h3 className="line-clamp-1 text-sm font-semibold">{p.name}</h3>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="line-clamp-1">{p.sku ? `Reference : ${p.sku}` : '\u00A0'}</span>
          <span className={`font-semibold ${inStock ? 'text-emerald-600' : 'text-red-600'}`}>
            {inStock ? 'En stock' : 'Rupture de stock'}
          </span>
        </div>

        {p.description && <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-accent">
            {hasPromo ? p.promoPrice!.toFixed(2) : p.price.toFixed(2)} {p.currency}
          </span>

          {hasPromo && (
            <span className="text-xs text-red-600 line-through">
              {p.price.toFixed(2)} {p.currency}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
