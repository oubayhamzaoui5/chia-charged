'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'

import { getPb } from '@/lib/pb'
import { toggleWishlistForProduct } from '@/lib/shop/client-api'
import type { ProductListItem } from '@/lib/services/product.service'

export default function ShopProductCard({
  product,
  productHref,
  prioritizeImage,
  initialWishlisted = false,
  enableWishlist = true,
  disableAnimations,
}: {
  product: ProductListItem
  productHref: string
  prioritizeImage: boolean
  initialWishlisted?: boolean
  enableWishlist?: boolean
  disableAnimations?: boolean
}) {
  void disableAnimations
  const imageSrc = product.imageUrls[0] ?? '/aboutimg.webp'
  const hoverImageSrc = product.imageUrls[1] ?? null
  const [imageLoaded, setImageLoaded] = useState(false)
  const [hoverImageLoaded, setHoverImageLoaded] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted)
  const [isWishLoading, setIsWishLoading] = useState(false)

  const hasPromo =
    product.promoPrice != null && product.promoPrice > 0 && product.promoPrice < product.price

  useEffect(() => {
    const signedIn = getPb(true).authStore.isValid
    setIsSignedIn(signedIn)
  }, [])

  useEffect(() => {
    if (!isSignedIn || !enableWishlist) {
      setIsWishlisted(false)
      return
    }
    setIsWishlisted(initialWishlisted)
  }, [enableWishlist, initialWishlisted, isSignedIn])

  const handleWishlistClick = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    try {
      setIsWishLoading(true)
      const next = await toggleWishlistForProduct(product.id)
      setIsWishlisted(next)
    } finally {
      setIsWishLoading(false)
    }
  }

  return (
    <article className="group">
      <Link href={productHref} prefetch={false}>
        <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-secondary transition-smooth">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-foreground/10" aria-hidden="true" />
          )}

          <Image
            src={imageSrc}
            alt={product.name}
            fill
            priority={prioritizeImage}
            loading={prioritizeImage ? 'eager' : 'lazy'}
            fetchPriority={prioritizeImage ? 'high' : 'auto'}
            sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 45vw, 50vw"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
            className={`object-cover transition duration-300 group-hover:scale-[1.02] ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${
              hoverImageSrc && hoverImageLoaded ? 'group-hover:opacity-0' : ''
            }`}
          />

          {hoverImageSrc && (
            <Image
              src={hoverImageSrc}
              alt={`${product.name} - vue 2`}
              fill
              loading="lazy"
              fetchPriority="auto"
              sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 45vw, 50vw"
              onLoad={() => setHoverImageLoaded(true)}
              onError={() => setHoverImageLoaded(false)}
              className={`object-cover transition duration-300 group-hover:scale-[1.02] ${
                hoverImageLoaded ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
              }`}
            />
          )}

          <div className="absolute left-4 top-4 z-10 flex gap-2">
            {product.isNew && (
              <div className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                New
              </div>
            )}
            {hasPromo && (
              <div className="rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-white">
                Promo
              </div>
            )}
          </div>

          {isSignedIn && enableWishlist && (
            <button
              type="button"
              aria-label={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-gray-500/20 backdrop-blur-sm transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={handleWishlistClick}
              disabled={isWishLoading}
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isWishlisted ? 'fill-accent text-accent' : 'fill-transparent text-foreground/80'
                }`}
              />
            </button>
          )}

          {!product.inStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45">
              <span className="text-base font-extrabold text-white">Rupture de stock</span>
            </div>
          )}

        </div>
      </Link>

      <div className="space-y-1">
        <h3 className="line-clamp-1 text-base font-bold mb-0 lg:mb-1">
          <Link href={productHref} prefetch={false} className="transition-colors hover:text-accent">
            {product.name}
          </Link>
        </h3>

        <div className="text-sm text-muted-foreground mt-0 mb-1 lg:mb-2">
          <span className="line-clamp-1 font-semibold">
            {product.sku ? `Reference : ${product.sku}` : '\u00A0'}
          </span>
        </div>

      

        {product.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground mb-1">{product.description}</p>
        )}

        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-accent">
            {hasPromo ? product.promoPrice!.toFixed(2) : product.price.toFixed(2)} {product.currency}
          </span>

          {hasPromo && (
            <span className="text-xs text-red-600 line-through">
              {product.price.toFixed(2)} {product.currency}
            </span>
          )}
          
        </div>
          {product.isVariant && (
          <p className="text-[10px] lg:text-[11px] text-muted-foreground font-bold">*Disponible dans d'autres modeles</p>
        )}
      </div>
    </article>
  )
}
