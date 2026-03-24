'use client'

import dynamic from 'next/dynamic'
import { ArrowUpDown, Check, SlidersHorizontal, Tag, TicketPercent, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Navbar } from '@/components/navbar'
import ShopEmptyState from '@/components/shop/shop-empty-state'
import { Button } from '@/components/ui/button'
import { detectShopPreset, getShopPresetPath, stripPresetParams } from '@/lib/shop-presets'
import { fetchWishlistIds } from '@/lib/shop/client-api'
import type { ShopListResult } from '@/lib/services/product.service'

import ShopProductCard from './_components/shop-product-card'

const Footer = dynamic(() => import('@/components/footer'), {
  ssr: true,
  loading: () => <div className="h-32" aria-hidden="true" />,
})

type SearchParams = Record<string, string | string[] | undefined>
const SIGNUP_PROMO_DISMISSED_KEY = 'signup_promo_dismissed_v1'

function ChevronDownIcon() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/60 transition-transform group-hover:text-black/80"
      width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function normalizeSearchParams(searchParams: SearchParams): Record<string, string> {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      if (value[0]) normalized[key] = value[0]
    } else if (typeof value === 'string') {
      normalized[key] = value
    }
  }
  return normalized
}

function buildShopHref(
  current: Record<string, string>,
  updates: Record<string, string | null>
): string {
  const next = new URLSearchParams(current)
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === '') {
      next.delete(key)
    } else {
      next.set(key, value)
    }
  }

  const nextCategory = next.get('category')
  if (nextCategory) next.delete('category')

  let path = nextCategory ? `/boutique/categorie/${nextCategory}` : '/boutique'
  let finalQuery = next

  if (!nextCategory) {
    const preset = detectShopPreset(Object.fromEntries(next.entries()))
    if (preset) {
      path = getShopPresetPath(preset)
      finalQuery = stripPresetParams(next, preset)
    }
  }

  const nextQuery = finalQuery.toString()
  return nextQuery ? `${path}?${nextQuery}` : path
}

function getEffectivePrice(price: number, promoPrice: number | null): number {
  if (promoPrice != null && promoPrice > 0 && promoPrice < price) return promoPrice
  return price
}

function mergeUniqueProducts(current: ShopListResult['products'], incoming: ShopListResult['products']) {
  if (incoming.length === 0) return current
  const seen = new Set(current.map((product) => product.id))
  const appended = incoming.filter((product) => {
    if (seen.has(product.id)) return false
    seen.add(product.id)
    return true
  })
  if (appended.length === 0) return current
  return [...current, ...appended]
}

export default function ShopClient({
  data,
  searchParams = {},
}: {
  data: ShopListResult
  searchParams?: SearchParams
}) {
  const router = useRouter()
  const currentQuery = normalizeSearchParams(searchParams)
  const [products, setProducts] = useState<ShopListResult['products']>(data.products)
  const [pagination, setPagination] = useState(data.pagination)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [hasSignupPromoBanner, setHasSignupPromoBanner] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const isFetchingRef = useRef(false)
  const lastLoadAtRef = useRef(0)
  const lastScrollYRef = useRef(0)

  if (data.activeCategory && !currentQuery.category) {
    currentQuery.category = data.activeCategory.slug
  }

  useEffect(() => {
    setProducts(data.products)
    setPagination(data.pagination)
    setIsFetchingMore(false)
    setLoadMoreError(null)
    isFetchingRef.current = false
    lastLoadAtRef.current = 0
  }, [data])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false

    const resolvePromoVisibility = async () => {
      const dismissedUntilRaw = window.localStorage.getItem(SIGNUP_PROMO_DISMISSED_KEY)
      const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0
      const isDismissed =
        !!dismissedUntilRaw && Number.isFinite(dismissedUntil) && Date.now() < dismissedUntil

      let signedIn = false
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' })
        signedIn = response.ok
      } catch {
        signedIn = false
      }

      if (cancelled) return
      setIsSignedIn(signedIn)
      setHasSignupPromoBanner(!signedIn && !isDismissed)
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== SIGNUP_PROMO_DISMISSED_KEY) return
      void resolvePromoVisibility()
    }

    const onVisibilityChange = () => {
      void resolvePromoVisibility()
    }

    void resolvePromoVisibility()
    window.addEventListener('storage', onStorage)
    window.addEventListener('signup-promo:visibility-change', onVisibilityChange)

    return () => {
      cancelled = true
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('signup-promo:visibility-change', onVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (!isSignedIn) {
      setWishlistIds(new Set())
      return
    }

    let cancelled = false
    const loadWishlistIds = async () => {
      try {
        const ids = await fetchWishlistIds()
        if (!cancelled) {
          setWishlistIds(new Set(ids))
        }
      } catch {
        if (!cancelled) {
          setWishlistIds(new Set())
        }
      }
    }

    void loadWishlistIds()
    return () => {
      cancelled = true
    }
  }, [isSignedIn])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobileViewport(mobile)
      if (!mobile) {
        setIsMobileNavVisible(true)
      }
    }

    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !isMobileViewport) return

    const scrollThreshold = 8
    lastScrollYRef.current = window.scrollY

    const onScroll = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - lastScrollYRef.current

      if (currentScrollY <= 10) {
        setIsMobileNavVisible(true)
      } else if (delta > scrollThreshold) {
        setIsMobileNavVisible(false)
      } else if (delta < -scrollThreshold) {
        setIsMobileNavVisible(true)
      }

      lastScrollYRef.current = currentScrollY
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isMobileViewport])

  const originQuery = useMemo(() => {
    const params = new URLSearchParams(currentQuery)
    params.delete('page')
    return params.toString()
  }, [currentQuery])

  const inStockOnly = currentQuery.inStock === '1'
  const selectedPriceRange = currentQuery.priceRange ?? 'all'
  const isWishlistView = currentQuery.wishlist === '1'
  const isPromotionsView = currentQuery.promotions === '1'
  const isNouveautesView = currentQuery.sort === 'latest' || currentQuery.nouveautes === '1'

  const heroContent = useMemo(() => {
    if (isWishlistView) {
      return {
        title: 'Wishlist',
        description: "Retrouvez les produits que vous avez enregistres dans votre wishlist.",
      }
    }

    if (isPromotionsView) {
      return {
        title: 'Promotions',
        description: 'Profitez des meilleures promotions disponibles en ce moment.',
      }
    }

    if (isNouveautesView) {
      return {
        title: 'Nouveautes',
        description: 'Decouvrez les derniers produits ajoutes a notre boutique.',
      }
    }

    return {
      title: 'Boutique',
      description:
        "Explorez l'integralite de notre collection, un espace ou le design rencontre la fonctionnalite. " +
        "Que vous cherchiez l'inspiration ou une piece specifique, profitez d'une experience de navigation " +
        'fluide pour filtrer nos creations selon vos criteres les plus exigeants.',
    }
  }, [isNouveautesView, isPromotionsView, isWishlistView])

  const withinPriceRange = useCallback((price: number): boolean => {
    if (selectedPriceRange === 'all') return true
    if (selectedPriceRange === '0-100') return price <= 100
    if (selectedPriceRange === '100-300') return price >= 100 && price <= 300
    if (selectedPriceRange === '300-600') return price >= 300 && price <= 600
    if (selectedPriceRange === '600+') return price >= 600
    return true
  }, [selectedPriceRange])

  const filteredProducts = useMemo(
    () =>
      products
        .filter((product) => (inStockOnly ? product.inStock : true))
        .filter((product) => withinPriceRange(getEffectivePrice(product.price, product.promoPrice))),
    [inStockOnly, products, withinPriceRange]
  )

  const loadMore = useCallback(async () => {
    const now = Date.now()
    if (isFetchingRef.current || !pagination.hasNextPage) return
    if (now - lastLoadAtRef.current < 300) return

    lastLoadAtRef.current = now
    isFetchingRef.current = true

    setIsFetchingMore(true)
    setLoadMoreError(null)

    try {
      const nextPage = pagination.page + 1
      const params = new URLSearchParams(currentQuery)
      params.set('page', String(nextPage))
      params.set('perPage', String(pagination.perPage))

      const response = await fetch(`/api/shop/products?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Impossible de charger plus de produits.')
      }

      const nextData = (await response.json()) as ShopListResult
      setProducts((prev) => mergeUniqueProducts(prev, nextData.products))
      setPagination(nextData.pagination)
    } catch {
      setLoadMoreError('Echec du chargement des produits suivants.')
    } finally {
      isFetchingRef.current = false
      setIsFetchingMore(false)
    }
  }, [currentQuery, pagination])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void loadMore()
          }
        }
      },
      {
        rootMargin: '300px 0px',
      }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore])

  function pushQuery(updates: Record<string, string | null>) {
    router.push(buildShopHref(currentQuery, updates))
  }

  const navOffsetClass = hasSignupPromoBanner
    ? 'pt-[100px] md:pt-[112px]'
    : 'pt-[60px] md:pt-[72px]'
  const stickyOffset = hasSignupPromoBanner ? 56 : 56
  const effectiveStickyOffset = isMobileViewport
    ? isMobileNavVisible
      ? stickyOffset
      : 8
    : stickyOffset

  return (
    <div className={`relative min-h-screen bg-background ${navOffsetClass}`}>
      <Navbar categories={data.categories} />

      <main id="main-content">
        <section className="relative overflow-hidden bg-gradient-to-b from-accent/[0.2] to-transparent py-10 md:py-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-14 top-8 h-44 w-44 rounded-full bg-foreground/5 blur-3xl" />
            <div className="absolute right-0 top-16 h-52 w-52 rounded-full bg-foreground/5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-[1400px] px-4">
            {data.activeCategory ? (
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-foreground/60">
                    Accueil &gt; Collection &gt; {data.activeCategory.name}
                  </p>
                  <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
                    {data.activeCategory.name}
                  </h1>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-foreground/60">
                    COLLECTION UPDATE DESIGN
                  </p>
                  {data.activeCategory.description ? (
                    <div
                      className="mt-4 space-y-2 text-sm leading-relaxed text-foreground/80 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-accent [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-black [&_p]:mb-2 [&_strong]:font-semibold [&_b]:font-semibold [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-1"
                      dangerouslySetInnerHTML={{ __html: data.activeCategory.description }}
                    />
                  ) : null}
                  {data.activeCategory.features.length > 0 && (
                    <ul className="mt-5 space-y-2.5">
                      {data.activeCategory.features.map((feature, index) => (
                        <li key={`${feature}-${index}`} className="flex items-start gap-2.5 text-sm text-foreground/80">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/20 shadow-sm">
                  <div className="aspect-video">
                    {data.activeCategory.coverImageUrl ? (
                      <img
                        src={data.activeCategory.coverImageUrl}
                        alt={data.activeCategory.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-medium text-foreground/50">
                        {data.activeCategory.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                  {heroContent.title}
                </h1>
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-foreground/70">
                  {heroContent.description}
                </p>
              </>
            )}
          </div>
        </section>

<div className="sticky z-20 px-4 py-4 md:px-8 md:py-6" style={{ top: effectiveStickyOffset }}>
  <div className="mx-auto max-w-[1400px]">
    <div
      className={`rounded-xl border border-accent/70 bg-accent p-1.5 opacity-85 shadow-sm backdrop-blur-xl transition-opacity hover:opacity-100 md:mx-auto md:w-fit md:rounded-full ${
        isMobileFiltersOpen ? 'w-full' : 'w-fit'
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-black md:hidden"
          onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
          aria-expanded={isMobileFiltersOpen}
          aria-controls="shop-filters-row"
        >
          <SlidersHorizontal size={16} className="text-black" />
          Filtres
        </button>
        <div id="shop-filters-row" className={`${isMobileFiltersOpen ? 'block' : 'hidden'} min-w-0 flex-1 md:block`}>
    <div className="flex flex-nowrap items-center justify-start gap-1.5 overflow-x-auto whitespace-nowrap md:flex-wrap md:justify-center md:gap-2 md:overflow-visible">
      <div className="hidden h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black md:inline-flex">
        <SlidersHorizontal size={14} className="text-black" />
        Filtres
      </div>
      
      {/* Category Select - Compact h-10 */}
      <div className="group relative shrink-0">
        <Tag size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black" />
        <select
          id="shop-category"
          value={currentQuery.category ?? ''}
          onChange={(event) =>
            pushQuery({ category: event.target.value || null, query: null })
          }
          className="h-10 cursor-pointer appearance-none rounded-lg md:rounded-full border border-transparent bg-white pl-9 pr-9 text-sm font-medium text-black transition-all hover:bg-white/90 focus:outline-none"
        >
          <option value="">Tous les Catégories</option>
          {data.categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <ChevronDownIcon />
      </div>

      {/* Price Select */}
      <div className="group relative shrink-0">
        <Wallet size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black" />
        <select
          id="shop-price"
          value={selectedPriceRange}
          onChange={(event) => pushQuery({ priceRange: event.target.value })}
          className="h-10 cursor-pointer appearance-none rounded-lg md:rounded-full border border-transparent bg-white pl-9 pr-9 text-sm font-medium text-black transition-all hover:bg-white/90 focus:outline-none"
        >
          <option value="all">Prix</option>
          <option value="0-100">0-100 DT</option>
          <option value="100-300">100-300 DT</option>
          <option value="300-600">300-600 DT</option>
          <option value="600+">600+ DT</option>
        </select>
        <ChevronDownIcon />
      </div>

      <div className="mx-0.5 hidden h-5 w-px bg-border/40 md:block" />

      {/* Checkboxes - Solid Accent when active */}
      {[ 
        { id: 'promotions', label: 'Promotions', checked: data.applied.promotions, key: 'promotions', Icon: TicketPercent },
        { id: 'inStock', label: 'En Stock', checked: inStockOnly, key: 'inStock', Icon: Check },
      ].map((item) => (
        <label
          key={item.id}
          className={`flex h-10 shrink-0 cursor-pointer select-none items-center gap-2 rounded-lg md:rounded-full border px-4 text-sm font-medium transition-all ${
            item.checked
              ? 'border-black/70 bg-white text-black'
              : 'border-black/20 bg-white text-black hover:bg-white/90'
          }`}
        >
          <input
            type="checkbox"
            className="hidden"
            checked={item.checked}
            onChange={(event) => pushQuery({ [item.key]: event.target.checked ? '1' : null })}
          />
          <item.Icon size={14} className="text-black" />
          {item.label}
        </label>
      ))}

      <div className="mx-0.5 hidden h-5 w-px bg-border/40 md:block" />

      {/* Sort Select */}
      <div className="group relative shrink-0">
        <ArrowUpDown size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black" />
        <select
          id="shop-sort"
          value={data.applied.sort}
          onChange={(event) => pushQuery({ sort: event.target.value })}
          className="h-10 cursor-pointer appearance-none rounded-lg md:rounded-full border border-transparent bg-white pl-9 pr-9 text-sm font-medium text-black transition-all hover:bg-white/90 focus:outline-none"
        >
          <option value="name">Trier par Nom</option>
          <option value="latest">Nouveautés</option>
          <option value="priceAsc">Trier par Prix ↑</option>
          <option value="priceDesc">Trier par Prix ↓</option>
        </select>
        <ChevronDownIcon />
      </div>
    </div>
      </div>
</div>
</div>
</div>
</div>

        <div className="mx-auto max-w-[1400px] px-4 py-2 ">
          <div className="min-h-[40vh] space-y-5">
            {filteredProducts.length === 0 ? (
              <ShopEmptyState
                title="Aucun produit trouve"
                description="Essayez de modifier vos filtres ou votre recherche."
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product, idx) => {
                  const productHref = originQuery
                    ? `/produit/${product.slug}?${originQuery}`
                    : `/produit/${product.slug}`

                  return (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-transparent p-2 transition hover:border-foreground/15 hover:bg-foreground/[0.02] [content-visibility:auto]"
                    >
                      <ShopProductCard
                        product={product}
                        productHref={productHref}
                        prioritizeImage={idx === 0}
                        enableWishlist={isSignedIn}
                        initialWishlisted={wishlistIds.has(product.id)}
                      />
                    </div>
                  )
                })}
              </div>
            )}

            {loadMoreError && (
              <div className="flex items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <span>{loadMoreError}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => void loadMore()}>
                  Reessayer
                </Button>
              </div>
            )}

            {isFetchingMore && (
              <div className="flex items-center justify-center py-2">
                <div
                  className="h-6 w-6 animate-spin rounded-full border-2 border-accent/25 border-t-accent"
                  role="status"
                  aria-live="polite"
                >
                  <span className="sr-only">Chargement de plus de produits...</span>
                </div>
              </div>
            )}

            <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
