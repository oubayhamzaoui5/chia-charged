"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

type Category = {
  id: string
  name: string
  slug: string
  order?: number
  parent?: string | string[] | null
}

type MegaProduct = {
  id: string
  slug: string
  name: string
  price: number
  promoPrice?: number | null
  currency?: string
  imageUrls: string[]
  isNew?: boolean
}

interface MegaMenuProps {
  isOpen: boolean
  categories: Category[]
  onClose: () => void
}

const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"
const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"

export function MegaMenu({ isOpen, categories, onClose }: MegaMenuProps) {
  const rootCategories = categories
    .filter((cat) => {
      if (Array.isArray(cat.parent)) return cat.parent.length === 0
      return !cat.parent
    })
    .sort((a, b) => {
      const aO = typeof a.order === "number" ? a.order : 0
      const bO = typeof b.order === "number" ? b.order : 0
      return aO !== bO ? aO - bO : a.name.localeCompare(b.name)
    })

  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [products, setProducts] = useState<MegaProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (isOpen && rootCategories.length > 0 && !activeCategory) {
      setActiveCategory(rootCategories[0].slug)
    }
  }, [isOpen, rootCategories, activeCategory])

  useEffect(() => {
    if (!isOpen) {
      setActiveCategory(null)
      setProducts([])
    }
  }, [isOpen])

  // Prevent background scroll when mega menu is open
  useEffect(() => {
    if (!isOpen) return
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [isOpen])

  const fetchProducts = useCallback(async (categorySlug: string) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoadingProducts(true)
    setProducts([])
    try {
      const res = await fetch(
        `/api/products?category=${encodeURIComponent(categorySlug)}&limit=10`,
        { cache: "no-store", signal: controller.signal }
      )
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      if (!controller.signal.aborted) {
        setProducts(
          (data.products ?? []).slice(0, 10).map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: p.price,
            promoPrice: p.promoPrice,
            currency: p.currency ?? "DT",
            imageUrls: p.imageUrls ?? (p.imageUrl ? [p.imageUrl] : []),
            isNew: p.isNew ?? false,
          }))
        )
      }
    } catch {
      if (!controller.signal.aborted) setProducts([])
    } finally {
      if (!controller.signal.aborted) setIsLoadingProducts(false)
    }
  }, [])

  useEffect(() => {
    if (activeCategory) fetchProducts(activeCategory)
  }, [activeCategory, fetchProducts])

  const handleCategoryHover = (slug: string) => {
    if (slug !== activeCategory) setActiveCategory(slug)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — fixed, covers screen behind the menu */}
          <motion.div
            className="fixed inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ background: "rgba(0,0,0,0.35)" }}
          />

          {/* Menu panel — absolute from nav, stretches to bottom of viewport */}
          <motion.div
            className="fixed left-0 right-0 z-40"
            style={{
              top: "calc(var(--mega-menu-top-desktop, var(--navbar-offset-desktop, 72px)) - 6px)",
              bottom: 0,
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Outer gradient + subtle doodle lines */}
              <div
                className="absolute inset-0 -z-10"
                style={{
                  background: GRADIENT,
                }}
              />
              {/* Soft vignette */}
              <div
                className="absolute inset-0 -z-10"
                style={{
                  background:
                    "radial-gradient(circle at 50% 15%, rgba(255,255,255,0) 0%, rgba(0,0,0,0.08) 70%)",
                }}
              />


              <div
                className="relative z-10 flex"
                style={{
                  backgroundColor: "#f2eadf",
                  backgroundImage: "url('/texture.webp')",
                  backgroundSize: "280px 280px",
                  borderTop: "3px solid #111",
                  height: "100%",
                  margin: "16px auto",
                  width: "90vw",
                  border: "4px solid #111",
                  borderRadius: "16px",
                  boxShadow: "8px 8px 0 #111",
                  overflow: "hidden",
                }}
              >
              {/* Left: Category sidebar */}
              <div
                className="flex-shrink-0 w-[210px] lg:w-[240px] py-5 pl-6 pr-2 overflow-y-auto"
                style={{
                  borderRight: "3px solid #111",
                  background: "#efe6d8",
                  borderRadius: "12px 0 0 12px",
                }}
              >
                <nav className="space-y-0">
                  {rootCategories.map((cat) => {
                    const isActive = activeCategory === cat.slug
                    return (
                      <Link
                        key={cat.id}
                        href={`/shop/category/${cat.slug}`}
                        onClick={onClose}
                        onMouseEnter={() => handleCategoryHover(cat.slug)}
                        className="relative block px-4 py-3 transition-colors duration-150"
                        style={{
                          fontFamily: FONT,
                          fontWeight: 900,
                          fontSize: "1.02rem",
                          textTransform: "uppercase",
                          letterSpacing: "-0.01em",
                          color: isActive ? "white" : "#111",
                          background: isActive ? GRADIENT : "transparent",
                        }}
                      >
                        {cat.name}
                      </Link>
                    )
                  })}

                </nav>
              </div>

              {/* Right: Product grid */}
              <div className="flex-1 py-6 px-6 lg:px-7 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory ?? "empty"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {isLoadingProducts || products.length === 0 ? null : (
                      <div className="grid grid-cols-3 lg:grid-cols-5 gap-4 auto-rows-fr">
                        {products.map((product, i) => (
                          <MegaProductCard
                            key={product.id}
                            product={product}
                            index={i}
                            onClose={onClose}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function MegaProductCard({
  product,
  index,
  onClose,
}: {
  product: MegaProduct
  index: number
  onClose: () => void
}) {
  const imageSrc = product.imageUrls[0] ?? "/aboutimg.webp"
  const hasPromo =
    product.promoPrice != null &&
    product.promoPrice > 0 &&
    product.promoPrice < product.price

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="h-full"
    >
      <Link
        href={`/product/${product.slug}`}
        onClick={onClose}
        className="group/card flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1"
        style={{
          border: "3px solid #111",
          borderRadius: "14px",
          boxShadow: "4px 4px 0 #111",
          background: "#f2eadf",
        }}
      >
        {/* Image area with gradient background */}
        <div
          className="relative aspect-square overflow-hidden"
          style={{ background: GRADIENT }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)" }}
          />

          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 18vw, 30vw"
            className="object-contain p-2 transition-transform duration-400 group-hover/card:scale-[1.06]"
            style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.2))" }}
          />

          {(product.isNew || hasPromo) && (
            <div className="absolute left-2 top-2 flex gap-1.5">
              {product.isNew && (
                <span
                  className="rounded-sm border-2 border-white/30 bg-white/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-sm"
                  style={{ fontFamily: FONT }}
                >
                  New
                </span>
              )}
              {hasPromo && (
                <span
                  className="rounded-sm border-2 border-white/30 bg-white/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-sm"
                  style={{ fontFamily: FONT }}
                >
                  Promo
                </span>
              )}
            </div>
          )}

          {/* Wavy bottom separator */}
          <svg
            viewBox="0 0 200 24"
            preserveAspectRatio="none"
            className="absolute -bottom-px left-0 w-full h-6"
          >
            <path
              d="M0,12 C40,24 80,0 120,12 C140,18 170,6 200,12 L200,24 L0,24 Z"
              fill="#f2eadf"
            />
            <path
              d="M0,12 C40,24 80,0 120,12 C140,18 170,6 200,12"
              fill="none"
              stroke="#111"
              strokeWidth="2.5"
            />
          </svg>
        </div>

        {/* Name area */}
        <div className="mt-auto px-3 py-3 text-center">
          <h4
            className="text-[0.75rem] lg:text-[0.85rem] font-black uppercase leading-tight line-clamp-2"
            style={{ fontFamily: FONT, fontWeight: 900, color: "#111", letterSpacing: "-0.01em" }}
          >
            {product.name}
          </h4>
        </div>
      </Link>
    </motion.div>
  )
}
