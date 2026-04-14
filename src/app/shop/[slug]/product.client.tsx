'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShoppingCart, ChevronLeft, ChevronRight, X, Beaker, GlassWater, Timer, Sparkles } from 'lucide-react'

import Footer from '@/components/footer'
import { Navbar } from '@/components/navbar'
import LandingTestimonials from '@/components/landing/landing-testimonials'
import InstallationSteps from '@/components/shop/installation-steps'
import ShopProductCard from '@/app/shop/_components/shop-product-card'
import { getPb } from '@/lib/pb'
import { hasInstallationStepsCategory } from '@/lib/shop/product-category-match'
import type { ProductListItem, ShopCategory } from '@/lib/services/product.service'
import {
  addToCartForUser,
  fetchIsInCart,
  fetchIsInWishlist,
  toggleWishlistForProduct,
} from '@/lib/shop/client-api'

type DetailItem = { label: string; value: string }
type VariantKey = Record<string, string>

type ProductWithDetails = ProductListItem & {
  details?: DetailItem[] | null
  variantKey?: VariantKey
}

type AvailabilityInfo = {
  stock: number
  inStock: boolean
}

type BreadcrumbItem = {
  label: string
  href?: string
}

type GuestCartItem = {
  productId: string
  quantity: number
}

type VariantResolved = {
  id: string
  value: string
  resolvedValue: { type: 'image' | 'color' | 'text'; url?: string; value?: string }
}

// ─── Nutrition Modal ──────────────────────────────────────────────────────────

function NutritionModal({
  onClose,
  ingredientsText,
}: {
  onClose: () => void
  ingredientsText: string
}) {
  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose()
  }
  const modalRef = useRef<HTMLDivElement | null>(null)
  const [atBottom, setAtBottom] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const closeTimeoutRef = useRef<number | null>(null)

  const handleClose = () => {
    if (isClosing) return
    setIsClosing(true)
    closeTimeoutRef.current = window.setTimeout(onClose, 220)
  }

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }

    window.addEventListener('keydown', onKey)

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyPadding = document.body.style.paddingRight

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`
    }

    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
      document.body.style.paddingRight = prevBodyPadding
      if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current)
    }
  }, [onClose])

  const handleModalScroll = () => {
    const el = modalRef.current
    if (!el) return
    const threshold = 12
    const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
    setAtBottom(reachedBottom)
  }

  return (
  <div
  onClick={handleBackdrop}
  style={{
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 'clamp(12px, 4vw, 32px) clamp(8px, 5vw, 15%)',
    overflowY: 'auto',
  }}
>
      <style>{`
        @keyframes nf-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes nf-slide-up {
          from { transform: translateY(36px) scale(0.96); opacity: 0 }
          to   { transform: translateY(0) scale(1); opacity: 1 }
        }
        @keyframes nf-slide-down {
          from { transform: translateY(0) scale(1); opacity: 1 }
          to   { transform: translateY(36px) scale(0.96); opacity: 0 }
        }
        .nf-modal {
          position: relative;
          background: #f5efe4;
          background-image: url('/texture.webp');
          background-size: 280px 280px;
          border: 4px solid #111;
          border-radius: 16px;
          max-width: 100vw;
          width: calc(100vw - 32px);
           
          display: flex;
          flex-direction: column;
          animation: nf-slide-up 0.28s cubic-bezier(0.34,1.56,0.64,1);
          font-family: 'Arial Black', 'Impact', 'Haettenschweiler', sans-serif;
          color: #111;
            margin: auto 0; /* ✅ THIS IS THE KEY */
        }
        .nf-modal.closing {
          animation: nf-slide-down 0.22s ease-in forwards;
        }
        .nf-body {
          flex: 1;
          overflow: visible;
          scrollbar-width: thin;
          scrollbar-color: rgba(124,58,237,0.4) transparent;
              overscroll-behavior: contain;
        }
        .nf-body::-webkit-scrollbar { width: 5px; }
        .nf-body::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.4); border-radius: 3px; }

        .nf-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 40px; height: 40px;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.1s;
          z-index: 10;
          color: #111;
          padding: 0;
        }
        .nf-close:hover { transform: scale(1.05); }
        .nf-close:active { transform: scale(0.98);}

        .nf-title {
          font-family: 'Arial Black', 'Impact', 'Haettenschweiler', sans-serif;
          font-size: 5.1rem;
          line-height: 0.88;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
        }

        .nf-box {
          border: 3px solid #111;
          border-radius: 10px;
          background: rgba(255,255,255,0.85);
          overflow: hidden;
          max-width: 760px;
          margin: 0 auto 16px;
        }
        .nf-label {
          background: #fff;
          border: 3px solid #111;
          border-radius: 10px;
          max-width: 760px;
          margin: 0 auto;
          padding: 8px 10px 10px;
          color: #111;
        }
        .nf-label h2 {
          font-size: 1.65rem;
          font-weight: 900;
          border-bottom: 6px solid #111;
          padding-bottom: 2px;
          margin: 0 0 6px;
          
        }
        .nf-small { font-size: 0.72rem; font-weight: 700; }
        .nf-rowline {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          border-top: 1px solid #111;
          padding: 2px 0;
          font-size: 0.78rem;
        }
        .nf-rowline.bold { font-weight: 900; }
        .nf-rowline.indent { padding-left: 12px; font-weight: 700; }
        .nf-rowline.subindent { padding-left: 20px; font-weight: 700; }
        .nf-rule-thick { border-top: 6px solid #111; margin: 6px 0; }
        .nf-rule-mid { border-top: 3px solid #111; margin: 4px 0; }
        .nf-calories {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-weight: 900;
          border-top: 3px solid #111;
          padding-top: 4px;
        }
        .nf-calories .label { font-size: 1.1rem; }
        .nf-calories .value { font-size: 2rem; }
        .nf-dv {
          display: flex;
          justify-content: flex-end;
          font-size: 0.72rem;
          font-weight: 800;
          border-top: 1px solid #111;
          padding: 2px 0;
        }
        .nf-foot {
          border-top: 3px solid #111;
          font-size: 0.62rem;
          line-height: 1.2;
          padding-top: 4px;
        }
        .nf-box-head { padding: 12px 16px 8px; border-bottom: 8px solid #111; }
        .nf-box-head h2 { font-size: 1.75rem; font-weight: 900; color: #111; font-family: 'Arial Black', sans-serif; }
        .nf-box-head p { font-size: 0.75rem; color: #111; font-weight: 600; margin-top: 2px; }

        .nf-col-hdr {
          display: flex; justify-content: flex-end;
          padding: 5px 16px;
          font-size: 0.68rem; font-weight: 800; color: #111;
          border-bottom: 1px solid #ccc;
        }

        .nf-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 4px 16px;
          border-bottom: 1px solid #ddd;
          font-size: 0.8rem;
        }
        .nf-row:last-child { border-bottom: none; }
        .nf-row.thick  { border-top: 7px solid #111; }
        .nf-row.medium { border-top: 4px solid #111; }
        .nf-row .lbl   { font-weight: 700; color: #111; font-family: 'Arial Black', sans-serif; }
        .nf-row .lbl.i1 { padding-left: 14px; font-weight: 500; font-family: inherit; }
        .nf-row .lbl.i2 { padding-left: 26px; font-weight: 400; font-size: 0.74rem; font-family: inherit; }
        .nf-row .val   { font-weight: 800; color: #111; white-space: nowrap; font-family: 'Arial Black', sans-serif; }
        .nf-row.calories .lbl { font-size: 0.85rem; }
        .nf-row.calories .val { font-size: 1.9rem; font-weight: 900; }

        .nf-pct-note {
          padding: 4px 16px 6px;
          font-size: 0.66rem; color: #111; font-weight: 600;
          text-align: right;
          border-bottom: 1px solid #ccc;
        }

        .nf-section {
          background: rgba(255,255,255,0.85);
          border: 3px solid #111;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 14px;
        }
        .nf-section h3 {
          font-size: 0.9rem; font-weight: 900; color: #111;
          text-transform: uppercase; letter-spacing: 1px;
          margin-bottom: 8px;
          font-family: 'Arial Black', sans-serif;
        }
        .nf-section p { font-size: 0.79rem; line-height: 1.65; color: #111; font-weight: 500; }
        .nf-section.allergen { background: rgba(255,246,235,0.95); }
        .nf-section.allergen .contains { font-weight: 800; color: #111; font-size: 0.79rem; margin-bottom: 4px; }
        .nf-section.allergen .maycontain { font-weight: 600; color: #111; font-size: 0.79rem; }

        @media (max-width: 1023px) {
          .nf-title { font-size: 2.4rem; padding: 0; }
          .nf-label h2 { font-size: 1.1rem; }
          .nf-small { font-size: 0.62rem; }
          .nf-rowline { font-size: 0.65rem; }
          .nf-calories .label { font-size: 0.85rem; }
          .nf-calories .value { font-size: 1.4rem; }
          .nf-dv { font-size: 0.6rem; }
          .nf-foot { font-size: 0.55rem; }
          .nf-box-head h2 { font-size: 1.1rem; }
          .nf-box-head p { font-size: 0.62rem; }
          .nf-col-hdr { font-size: 0.58rem; padding: 4px 10px; }
          .nf-row { font-size: 0.65rem; padding: 3px 10px; }
          .nf-row.calories .val { font-size: 1.3rem; }
          .nf-pct-note { font-size: 0.56rem; padding: 3px 10px 5px; }
          .nf-section h3 { font-size: 0.75rem; }
          .nf-section p { font-size: 0.65rem; line-height: 1.5; }
          .nf-section.allergen .contains,
          .nf-section.allergen .maycontain { font-size: 0.65rem; }
          .nf-label { padding: 6px 8px 8px; }
          .nf-section { padding: 10px 12px; margin-bottom: 10px; }
        }
      `}</style>

    <div className={`nf-modal${isClosing ? ' closing' : ''}`}>
           <button className="nf-close" onClick={handleClose} aria-label="Close">
      <X size={40} strokeWidth={3.5} />
    </button>

    <div
      ref={modalRef}
      onScroll={handleModalScroll}
      className="nf-body"
      style={{
        padding: 'clamp(20px, 5vw, 48px) clamp(12px, 8vw, 20%) 0',
        paddingBottom: atBottom ? 'clamp(20px, 5vw, 48px)' : '0',
        transition: 'padding-bottom 120ms ease'
      }}
    >          {/* Header */}
          <div style={{ textAlign: 'center', padding: '4px 0 44px', clear: 'both' }}>
            <h1 className="nf-title">NUTRITION &<br />INGREDIENTS</h1>
          </div>
          <div className="nf-label">
            <h2>Nutrition Facts</h2>
            <div className="nf-small">8 servings per container</div>
            <div className="nf-small" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Serving size</span>
              <span>1/4 cup (57g)</span>
            </div>
            <div className="nf-rule-mid" />
            <div className="nf-small">Amount per serving</div>
            <div className="nf-calories">
              <span className="label">Calories</span>
              <span className="value">280</span>
            </div>
            <div className="nf-rule-thick" />
            <div className="nf-dv">% Daily Value*</div>
            <div className="nf-rowline bold"><span>Total Fat 14g</span><span>18%</span></div>
            <div className="nf-rowline indent"><span>Saturated Fat 5g</span><span>25%</span></div>
            <div className="nf-rowline indent"><span>Trans Fat 0g</span><span /></div>
            <div className="nf-rowline bold"><span>Cholesterol 60mg</span><span>20%</span></div>
            <div className="nf-rowline bold"><span>Sodium 55mg</span><span>2%</span></div>
            <div className="nf-rowline bold"><span>Total Carbohydrate 16g</span><span>6%</span></div>
            <div className="nf-rowline indent"><span>Dietary Fiber 12g</span><span>43%</span></div>
            <div className="nf-rowline indent"><span>Total Sugars 2g</span><span /></div>
            <div className="nf-rowline subindent"><span>Includes 2g Added Sugars</span><span>4%</span></div>
            <div className="nf-rowline bold"><span>Protein 22g</span><span /></div>
            <div className="nf-rule-mid" />
            <div className="nf-rowline"><span>Vitamin D 0mcg</span><span>0%</span></div>
            <div className="nf-rowline"><span>Calcium 250mg</span><span>20%</span></div>
            <div className="nf-rowline"><span>Iron 2.3mg</span><span>15%</span></div>
            <div className="nf-rowline"><span>Potassium 330mg</span><span>8%</span></div>
            <div className="nf-foot">
              *The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet.
              2,000 calories a day is used for general nutrition advice.
            </div>
          </div>
          <div className="nf-section" style={{ maxWidth: 760, margin: '16px auto 0' }}>
            <h3>Ingredients</h3>
            <p>{ingredientsText}</p>
          </div>
          <div className="nf-section" style={{ maxWidth: 760, margin: '10px auto 24px' }}>
            <p>Contains milk. Produced in a facility with tree nuts, peanuts, soybeans, milk, eggs, wheat and sesame.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FLAVOR_IMAGE_MAP: Record<string, string> = {
  strawberry: '/strawberry.png',
  fraise: '/strawberry.png',
  framboise: '/strawberry.png',
  chocolate: '/chocolate.png',
  chocolat: '/chocolate.png',
  choco: '/chocolate.png',
}

const FLAVOR_KEYS = ['saveur', 'flavor', 'flavour', 'goût', 'gout', 'arome', 'arôme', 'taste', 'parfum']
const COUNT_KEYS = ['count', 'quantité', 'quantite', 'qty', 'portion', 'serving', 'size', 'taille', 'poids', 'weight', 'gramme', 'pack', 'capsule', 'sachet', 'boîte', 'boite', 'unité', 'unite']

function isFlavorKey(k: string) { return FLAVOR_KEYS.some((f) => k.toLowerCase().includes(f)) }
function isCountKey(k: string) { return COUNT_KEYS.some((c) => k.toLowerCase().includes(c)) }

function resolveFlavorImage(variantKey: string, variantValue: string): string | null {
  const isFlavor = FLAVOR_KEYS.some((k) => variantKey.toLowerCase().includes(k))
  if (!isFlavor) return null
  const normalized = variantValue.toLowerCase().trim()
  for (const [keyword, img] of Object.entries(FLAVOR_IMAGE_MAP)) {
    if (normalized.includes(keyword)) return img
  }
  return null
}

const GUEST_CART_KEY = 'guest_cart'
function getGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) =>
        item &&
        typeof item.productId === 'string' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0
    )
  } catch { return [] }
}

function setGuestCart(items: GuestCartItem[]) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items)) } catch {}
}

function variantKeyToString(value: VariantKey): string {
  return Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|')
}

function disableSmoothScrollForNextNavigation() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.add('no-smooth-scroll')
  window.setTimeout(() => {
    root.classList.remove('no-smooth-scroll')
  }, 300)
}

function resolveVariantDisplay(
  variantKey: VariantKey | undefined,
  variantValuesMap: Record<string, VariantResolved[]>
): string {
  if (!variantKey) return ''
  return Object.entries(variantKey)
    .map(([key, raw]) => {
      const match = variantValuesMap[key]?.find((item) => item.value === raw)
      return match?.resolvedValue?.value ?? raw
    })
    .filter(Boolean)
    .join(' / ')
}

function Price({ p }: { p: ProductWithDetails }) {
  const priceMainClass = 'text-base font-black tracking-wide'
  const priceMainStyle = {
    color: 'rgb(68,15,195)',
    fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif",
    fontWeight: 900 as const,
  }

  const hasPromo = p.promoPrice != null && p.promoPrice > 0 && p.promoPrice < p.price
  if (!hasPromo) {
    return (
      <div className="flex items-baseline gap-0">
        <span className={priceMainClass} style={priceMainStyle}>{p.currency}</span>
        <span className={priceMainClass} style={priceMainStyle}>
          {p.price.toFixed(2)}
        </span>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span
          className="text-base font-black tracking-wide text-black/40 line-through"
          style={{
            fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif",
            fontWeight: 900,
          }}
        >
          {p.currency}
          {p.price.toFixed(2)}
        </span>
        <div className="flex items-baseline gap-0">
          <span className={priceMainClass} style={priceMainStyle}>{p.currency}</span>
          <span className={priceMainClass} style={priceMainStyle}>
            {p.promoPrice!.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductClient({
  product,
  imageUrls,
  categoryName,
  categories,
  explicitRelatedProducts,
  relatedProducts,
  availability,
  variants = [],
  variantUrlMap = {},
  variantValuesMap = {},
  metaPixelId = null,
}: {
  product: ProductWithDetails
  imageUrls: string[]
  categoryName: string
  categories: ShopCategory[]
  explicitRelatedProducts: ProductListItem[]
  relatedProducts: ProductListItem[]
  availability: AvailabilityInfo
  variants?: ProductWithDetails[]
  variantUrlMap?: Record<string, string>
  variantValuesMap?: Record<string, VariantResolved[]>
  metaPixelId?: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isInCart, setIsInCart] = useState(false)
  const [isMainCartStatusReady, setIsMainCartStatusReady] = useState(false)
  const [addMessage, setAddMessage] = useState<string | null>(null)
  const [isWishLoading, setIsWishLoading] = useState(false)
  const [isAddingRelatedId, setIsAddingRelatedId] = useState<string | null>(null)
  const [relatedInCartIds, setRelatedInCartIds] = useState<Set<string>>(new Set())
  const [isRelatedCartStatusReady, setIsRelatedCartStatusReady] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'details'>('details')
  const [showNutrition, setShowNutrition] = useState(false)  // ← NEW
  const [alsoLikeSlide, setAlsoLikeSlide] = useState(0)
  const alsoLikeScrollRef = useRef<HTMLDivElement | null>(null)
  const [currentImageIdx, setCurrentImageIdx] = useState(0)
  const [displayImageIdx, setDisplayImageIdx] = useState(0)
  const [isImageFading, setIsImageFading] = useState(false)
  const leftPanelRef = useRef<HTMLDivElement | null>(null)
  const mobileCarouselRef = useRef<HTMLDivElement | null>(null)
  const [panelFixedStyle, setPanelFixedStyle] = useState<{ top: number; left: number; width: number } | null>(null)

  const defaultVariant = useMemo<ProductWithDetails | null>(() => {
    if (variants.length === 0) return null
    const target = product.variantKey ?? {}
    const match = variants.find((variant) =>
      Object.entries(target).every(([key, value]) => variant.variantKey?.[key] === value)
    )
    return match ?? variants[0]
  }, [product.variantKey, variants])

  const [selectedVariant, setSelectedVariant] = useState<ProductWithDetails | null>(defaultVariant)
  useEffect(() => { setSelectedVariant(defaultVariant) }, [defaultVariant])

  const details = useMemo<DetailItem[]>(() => {
    if (!Array.isArray(product.details)) return []
    return product.details.filter(
      (item): item is DetailItem =>
        Boolean(item) &&
        typeof item.label === 'string' &&
        item.label.trim().length > 0 &&
        typeof item.value === 'string'
    )
  }, [product.details])

  const hasDetails = details.length > 0
  useEffect(() => {
    if (!hasDetails && activeTab === 'details') setActiveTab('description')
  }, [activeTab, hasDetails])

  const isInStock = availability.inStock
  const maxSelectableQuantity = isInStock ? Math.max(1, availability.stock) : 1

  // ─── Meta Pixel: ViewContent ─────────────────────────────────────────────────
  useEffect(() => {
    if (!metaPixelId) return
    const pixelId = metaPixelId

    function initAndTrack() {
      const w = window as Window & { fbq?: (...args: unknown[]) => void; _fbq?: unknown }
      if (typeof w.fbq !== 'function') {
        // Minimal fbq stub
        const fbq: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string } = function (...args: unknown[]) {
          if (fbq.callMethod) fbq.callMethod(...args)
          else { if (!fbq.queue) fbq.queue = []; fbq.queue.push(args) }
        }
        fbq.loaded = true
        fbq.version = '2.0'
        fbq.queue = []
        w.fbq = fbq
        w._fbq = fbq
        const script = document.createElement('script')
        script.async = true
        script.src = 'https://connect.facebook.net/en_US/fbevents.js'
        document.head.appendChild(script)
      }
      w.fbq!('init', pixelId)
      w.fbq!('track', 'ViewContent', {
        content_ids: [product.id],
        content_type: 'product',
        content_name: product.name,
        value: product.promoPrice ?? product.price,
        currency: product.currency ?? 'USD',
      })
    }

    if (document.readyState === 'complete') {
      initAndTrack()
    } else {
      window.addEventListener('load', initAndTrack, { once: true })
      return () => window.removeEventListener('load', initAndTrack)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaPixelId, product.id])


  const mainCategory = useMemo(() => {
    if (!product.categories || product.categories.length === 0) return null
    return categories.find((c) => c.id === product.categories?.[0]) ?? null
  }, [categories, product.categories])

  const shouldRenderInstallationSteps = useMemo(
    () => hasInstallationStepsCategory(product, categories),
    [product, categories]
  )

  const isProteinPuddingCategory = useMemo(() => {
    const normalize = (value?: string | null) => (value ?? '').trim().toLowerCase()
    const directCategory = normalize(categoryName)
    if (directCategory === 'protein pudding') return true

    const productCategoryIds = new Set(product.categories ?? [])
    return categories.some((category) => {
      if (!productCategoryIds.has(category.id)) return false
      const name = normalize(category.name)
      const slug = normalize(category.slug)
      return (
        name === 'protein pudding' ||
        slug.includes('protein-pudding') ||
        (name.includes('protein') && name.includes('pudding'))
      )
    })
  }, [categoryName, categories, product.categories])

  const selectedFlavorName = useMemo(() => {
    const activeVariantKey = selectedVariant?.variantKey ?? product.variantKey
    if (!activeVariantKey) return ''
    const entry = Object.entries(activeVariantKey).find(([key]) => isFlavorKey(key))
    if (!entry) return ''

    const [key, rawValue] = entry
    const resolved = variantValuesMap[key]?.find((item) => item.value === rawValue)?.resolvedValue?.value
    return (resolved ?? rawValue ?? '').trim()
  }, [selectedVariant, product.variantKey, variantValuesMap])

  const nutritionIngredientsText = useMemo(() => {
    const flavor = selectedFlavorName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    const isChocolateChipFlavor =
      flavor.includes('chocolate') && (flavor.includes('chip') || flavor.includes('chips'))

    if (isChocolateChipFlavor) {
      return 'Chia Seed, Whey Protein Concentrate, Chocolate Chips (Chocolate, Cane Sugar, Cocoa Butter, Sunflower Lecithin), Medium Chain Coconut Oil Triglycerides, Natural Flavor, Cocoa Powder (Alkaline Process), Stevia Leaf Glycosides, Monk Fruit Extract.'
    }

    return 'Chia Seed, Whey Protein Concentrate, Medium Chain Coconut Oil Triglycerides, Freeze Dried Strawberry Slices, Vanilla Flavor With Other Natural Flavors, Stevia Leaf Glycosides, Monk Fruit Extract.'
  }, [selectedFlavorName])

  const installationStep3Image = useMemo(() => {
    const productCategoryIds = new Set(product.categories ?? [])
    const productCategoryTokens = categories
      .filter((category) => productCategoryIds.has(category.id))
      .flatMap((category) => [category.slug, category.name])
      .map((value) => value.toLowerCase())
    const hasMarbreCategory = productCategoryTokens.some((token) => token.includes('marbre') || token.includes('marble'))
    if (hasMarbreCategory) return '/step3_1.webp'
    return '/step3.webp'
  }, [product.categories, categories])

  const fromPromotions = searchParams.get('promotions') === '1'
  const fromNouveautes = searchParams.get('nouveautes') === '1'
  const fromWishlist = searchParams.get('wishlist') === '1'
  const fromCategorySlug = searchParams.get('category')

  const originCategory = useMemo(() => {
    if (!fromCategorySlug) return null
    const bySlug = categories.find((c) => c.slug === fromCategorySlug)
    if (!bySlug) return null
    if (product.categories?.length && !product.categories.includes(bySlug.id)) return null
    return bySlug
  }, [categories, fromCategorySlug, product.categories])

  const alsoLikeProducts = useMemo(() => {
    const explicitIds = new Set(explicitRelatedProducts.map((item) => item.id))
    return relatedProducts.filter((item) => !explicitIds.has(item.id)).slice(0, 4)
  }, [explicitRelatedProducts, relatedProducts])

  const alsoLikePages = useMemo(() => {
    const pages: ProductListItem[][] = []
    for (let i = 0; i < alsoLikeProducts.length; i += 2) pages.push(alsoLikeProducts.slice(i, i + 2))
    return pages
  }, [alsoLikeProducts])

  useEffect(() => { setAlsoLikeSlide(0) }, [alsoLikePages.length])

  useEffect(() => {
    if (currentImageIdx === displayImageIdx) return
    setIsImageFading(true)
    const t = window.setTimeout(() => {
      setDisplayImageIdx(currentImageIdx)
      window.requestAnimationFrame(() => setIsImageFading(false))
    }, 140)
    return () => window.clearTimeout(t)
  }, [currentImageIdx, displayImageIdx])

  useEffect(() => {
    const el = mobileCarouselRef.current
    if (!el) return
    const W = el.clientWidth
    const itemWidth = W * 0.8
    const gap = 12
    const scrollLeft = currentImageIdx * (itemWidth + gap)
    el.scrollTo({ left: scrollLeft, behavior: 'smooth' })
  }, [currentImageIdx])

  useEffect(() => {
    setQuantity((prev) => Math.max(1, Math.min(prev, maxSelectableQuantity)))
  }, [maxSelectableQuantity])

  // Pin left panel when cart drawer opens (same fix as nutrition modal scroll-lock)
  useEffect(() => {
    const onCartOpen = () => {
      if (leftPanelRef.current) {
        const { top, left, width } = leftPanelRef.current.getBoundingClientRect()
        setPanelFixedStyle({ top, left, width })
      }
    }
    const onCartClose = () => {
      requestAnimationFrame(() => setPanelFixedStyle(null))
    }
    window.addEventListener("cart:drawer:open", onCartOpen)
    window.addEventListener("cart:drawer:close", onCartClose)
    return () => {
      window.removeEventListener("cart:drawer:open", onCartOpen)
      window.removeEventListener("cart:drawer:close", onCartClose)
    }
  }, [])

  const handleAlsoLikeScroll = () => {
    const container = alsoLikeScrollRef.current
    if (!container) return
    const pageWidth = container.clientWidth
    if (!pageWidth) return
    const nextSlide = Math.round(container.scrollLeft / pageWidth)
    setAlsoLikeSlide(Math.max(0, Math.min(nextSlide, Math.max(alsoLikePages.length - 1, 0))))
  }

  const scrollAlsoLike = (direction: 'prev' | 'next') => {
    const container = alsoLikeScrollRef.current
    if (!container || alsoLikePages.length <= 1) return
    const targetSlide =
      direction === 'prev'
        ? alsoLikeSlide === 0 ? alsoLikePages.length - 1 : alsoLikeSlide - 1
        : alsoLikeSlide === alsoLikePages.length - 1 ? 0 : alsoLikeSlide + 1
    container.scrollTo({ left: targetSlide * container.clientWidth, behavior: 'smooth' })
    setAlsoLikeSlide(targetSlide)
  }

  useEffect(() => {
    let cancelled = false
    const syncMainInCart = async () => {
      const existsInGuest = getGuestCart().some((item) => item.productId === product.id)
      let existsOnServer = false
      try { existsOnServer = await fetchIsInCart(product.id) } catch {}
      if (!cancelled) { setIsInCart(existsOnServer || existsInGuest); setIsMainCartStatusReady(true) }
    }
    syncMainInCart()
    const onCartUpdated = () => { syncMainInCart() }
    const onFocus = () => { syncMainInCart() }
    if (typeof window !== 'undefined') {
      window.addEventListener('cart:updated', onCartUpdated)
      window.addEventListener('focus', onFocus)
    }
    return () => {
      cancelled = true
      if (typeof window !== 'undefined') {
        window.removeEventListener('cart:updated', onCartUpdated)
        window.removeEventListener('focus', onFocus)
      }
    }
  }, [product.id])

  useEffect(() => {
    let cancelled = false
    const syncRelatedInCart = async () => {
      const explicitIds = new Set(explicitRelatedProducts.map((item) => item.id))
      const guest = new Set(getGuestCart().map((item) => item.productId).filter((id) => explicitIds.has(id)))
      const checks = await Promise.all(
        explicitRelatedProducts.map(async (item) => ({
          id: item.id,
          inCart: await fetchIsInCart(item.id).catch(() => false),
        }))
      )
      const merged = new Set(guest)
      checks.forEach((check) => { if (check.inCart) merged.add(check.id) })
      if (!cancelled) { setRelatedInCartIds(merged); setIsRelatedCartStatusReady(true) }
    }
    syncRelatedInCart()
    const onCartUpdated = () => { syncRelatedInCart() }
    const onFocus = () => { syncRelatedInCart() }
    if (typeof window !== 'undefined') {
      window.addEventListener('cart:updated', onCartUpdated)
      window.addEventListener('focus', onFocus)
    }
    return () => {
      cancelled = true
      if (typeof window !== 'undefined') {
        window.removeEventListener('cart:updated', onCartUpdated)
        window.removeEventListener('focus', onFocus)
      }
    }
  }, [explicitRelatedProducts])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const signedIn = getPb(true).authStore.isValid
      if (!signedIn) { if (!cancelled) setIsWishlisted(false); return }
      try { const inWishlist = await fetchIsInWishlist(product.id); if (!cancelled) setIsWishlisted(inWishlist) }
      catch { if (!cancelled) setIsWishlisted(false) }
    }
    run()
    return () => { cancelled = true }
  }, [product.id])

  const handleAddToCart = async () => {
    if (!isInStock) return
    const safeQuantity = Math.max(1, Math.min(quantity, maxSelectableQuantity))
    try {
      setIsAdding(true)
      try { await addToCartForUser(product.id, safeQuantity) }
      catch {
        const current = getGuestCart()
        const idx = current.findIndex((it) => it.productId === product.id)
        if (idx >= 0) current[idx].quantity = Math.min(current[idx].quantity + safeQuantity, maxSelectableQuantity)
        else current.push({ productId: product.id, quantity: safeQuantity })
        setGuestCart(current)
      }
      if (safeQuantity !== quantity) setQuantity(safeQuantity)
      setIsInCart(true)
      setAddMessage('Item added to cart.')
      window.setTimeout(() => setAddMessage(null), 2500)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cart:updated'))
        window.dispatchEvent(new Event('cart:open'))
        const w = window as Window & { fbq?: (...args: unknown[]) => void }
        if (metaPixelId && typeof w.fbq === 'function') {
          w.fbq('track', 'AddToCart', {
            content_ids: [product.id],
            content_type: 'product',
            content_name: product.name,
            value: product.promoPrice ?? product.price,
            currency: product.currency ?? 'USD',
            num_items: safeQuantity,
          })
        }
      }
    } finally { setIsAdding(false) }
  }

  const handleWishlistClick = async () => {
    try {
      setIsWishLoading(true)
      const inWishlist = await toggleWishlistForProduct(product.id)
      setIsWishlisted(inWishlist)
    } catch {
      const currentPath = typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : `/product/${product.slug}`
      router.push(`/login?next=${encodeURIComponent(currentPath)}`)
    } finally { setIsWishLoading(false) }
  }

  const handleAddRelatedToCart = async (relatedProductId: string) => {
    if (relatedInCartIds.has(relatedProductId)) {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart:open'))
      return
    }
    try {
      setIsAddingRelatedId(relatedProductId)
      try { await addToCartForUser(relatedProductId, 1) }
      catch {
        const current = getGuestCart()
        const idx = current.findIndex((it) => it.productId === relatedProductId)
        if (idx >= 0) current[idx].quantity += 1
        else current.push({ productId: relatedProductId, quantity: 1 })
        setGuestCart(current)
      }
      setRelatedInCartIds((prev) => new Set(prev).add(relatedProductId))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cart:updated'))
        window.dispatchEvent(new Event('cart:open'))
      }
    } finally { setIsAddingRelatedId(null) }
  }

  const handleShareClick = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : `/product/${product.slug}`
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(url)
      setShareCopied(true)
      if (typeof window !== 'undefined') window.setTimeout(() => setShareCopied(false), 1500)
    } catch { setShareCopied(false) }
  }

  const PURPLE = 'rgb(68,15,195)'

  return (
    <div className="relative">
      <Navbar />

      {/* ── Nutrition Modal ── */}
      {showNutrition && isProteinPuddingCategory && (
        <NutritionModal
          ingredientsText={nutritionIngredientsText}
          onClose={() => {
            setShowNutrition(false)
            requestAnimationFrame(() => setPanelFixedStyle(null))
          }}
        />
      )}

      {/* ── Hero Split ── */}
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        {/* LEFT: Sticky image panel */}
        <div
          ref={leftPanelRef}
          className="relative z-[1] flex flex-col items-center justify-center lg:w-[55%] lg:sticky lg:top-0 lg:h-screen product-left-panel"
          style={{
            backgroundColor: '#f7f3ed',
            backgroundImage: "url('/texture.webp')",
            backgroundRepeat: 'repeat',
            backgroundSize: '280px 280px',
            ...(panelFixedStyle ? { position: 'fixed', top: panelFixedStyle.top, left: panelFixedStyle.left, width: panelFixedStyle.width } : {}),
          }}
        >
          <style>{`
            @media (min-width: 1024px) {
              .product-left-panel {
                background: linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%) !important;
                background-image: linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%) !important;
              }
            }
          `}</style>
          <div className="pointer-events-none absolute inset-0 hidden lg:block" style={{ background: "radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.14) 0%, transparent 65%)" }} />

          {/* Mobile: navbar spacer */}
          <div className="block lg:hidden" style={{ height: 'var(--navbar-offset-mobile, 60px)' }} />

          {/* Mobile: category + product name */}
          <div className="block lg:hidden w-full px-6 pt-4 pb-1 z-10 relative">
            {categoryName && (
              <p className="text-xs font-black uppercase tracking-[0.15em] mb-1" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900, color: '#888' }}>{categoryName}</p>
            )}
            <h1 className="text-[2rem] font-black uppercase leading-[0.9] tracking-tighter" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900, letterSpacing: '-0.03em' }}>
              <span style={{ background: "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {product.name}
              </span>
            </h1>
          </div>

          {/* Mobile: peek carousel */}
          <div className="block lg:hidden w-full z-10 relative pt-2 pb-2">
            <div
              ref={mobileCarouselRef}
              className="flex"
              style={{
                overflowX: 'scroll',
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                paddingLeft: '6%',
                paddingRight: '6%',
                gap: '10px',
              } as React.CSSProperties}
              onScroll={(e) => {
                const el = e.currentTarget
                const W = el.clientWidth
                const itemWidth = W * 0.88
                const gap = 10
                const idx = Math.round(el.scrollLeft / (itemWidth + gap))
                const clamped = Math.max(0, Math.min(idx, imageUrls.length - 1))
                if (clamped !== currentImageIdx) setCurrentImageIdx(clamped)
              }}
            >
              {imageUrls.map((url, i) => (
                <div
                  key={url + i}
                  style={{ flexShrink: 0, width: '88%', scrollSnapAlign: 'center' }}
                >
                  <div
                    style={{
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)',
                      aspectRatio: '1',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      src={url}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      unoptimized
                      className="object-contain p-6 drop-shadow-2xl"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: single image with fade */}
          <div className="hidden lg:flex relative z-10 w-full flex-1 items-center justify-center px-2 py-2">
            <div className="relative w-full max-w-[520px] aspect-square">
              <Image
                key={imageUrls[displayImageIdx] ?? '/aboutimg.webp'}
                src={imageUrls[displayImageIdx] ?? '/aboutimg.webp'}
                alt={product.name}
                fill
                unoptimized
                className={`object-contain drop-shadow-2xl rounded-md transition-all duration-300 ease-out ${isImageFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
                priority
              />
            </div>
          </div>

          {/* Desktop thumbnails */}
          {imageUrls.length > 1 && (
            <div className="hidden lg:flex absolute bottom-5 left-0 right-0 z-10 w-full px-8 justify-center gap-3 flex-wrap pointer-events-auto">
              {imageUrls.map((img, i) => (
                <button key={img + i} type="button" onClick={() => setCurrentImageIdx(i)}
                  className="relative h-16 w-16 shrink-0 rounded-sm transition-transform duration-200 cursor-pointer"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    transform: i === currentImageIdx ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  {i === currentImageIdx && (
                    <span
                      className="pointer-events-none absolute inset-0 -z-10"
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 35%, transparent 70%)',
                        filter: 'blur(6px)',
                        transform: 'scale(1.25)',
                      }}
                    />
                  )}
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill unoptimized className="object-contain rounded-sm" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer: holds the 55% gap when the left panel is position:fixed (out of flow) */}
        {panelFixedStyle && <div className="lg:w-[55%] shrink-0" aria-hidden="true" />}

        {/* RIGHT: Cream bg */}
        <div
          className="nav-offset-top-desktop flex flex-col px-4 pb-8 pt-4 lg:w-[45%] lg:px-10 xl:px-14"
          style={{
            backgroundColor: '#f7f3ed',
            backgroundImage: "url('/texture.webp')",
            backgroundRepeat: 'repeat',
            backgroundSize: '280px 280px',
          }}
        >
          <div className="hidden lg:block">
            {categoryName && (
              <p className="text-[1.4rem] font-black uppercase tracking-[0.1em]" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900 }}>{categoryName}</p>
            )}
          </div>

          <h1 className="mb-6 hidden lg:block text-[2.1rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[3.1rem] lg:text-[4.1rem]" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900, letterSpacing: '-0.03em' }}>
            <span style={{ background: "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {product.name}
            </span>
          </h1>

          {/* Selection card */}
          <div className="overflow-visible rounded-md border-3 border-black" style={{ background: "rgba(255,255,255,0.8)" }}>
            <div className="p-5 space-y-5">

              {/* Summary + price */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
                <p className="text-base font-black uppercase tracking-wide text-black" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900 }}>
                  {resolveVariantDisplay(selectedVariant?.variantKey ?? product.variantKey, variantValuesMap) || product.name}
                </p>
                <Price p={selectedVariant ?? product} />
              </div>

              {/* Variant groups */}
              {variants.length > 0 && (
                <div className="space-y-5 mb-1">
                  {Object.keys(variants[0].variantKey ?? {}).map((key) => {
                    const values = variantValuesMap[key] ?? []
                    const isFlavor = isFlavorKey(key)
                    const isCount = isCountKey(key)
                    return (
                      <div key={key}>
                        <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-black" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900 }}>
                          Select {key}
                        </p>

                        {isCount && (
                          <div className="flex overflow-hidden rounded-md border-3 border-black">
                            {values.map((value, vi) => {
                              const nextVariant = { ...(selectedVariant?.variantKey ?? {}), [key]: value.value }
                              const keyStr = variantKeyToString(nextVariant)
                              const variantLink = variantUrlMap[keyStr] ?? `/product/${product.slug}`
                              const isSelected = selectedVariant?.variantKey?.[key] === value.value
                              return (
                                <Link
                                  key={value.id}
                                  href={variantLink}
                                  className="flex-1"
                                  onClick={disableSmoothScrollForNextNavigation}
                                >
                                  <span
                                    className={`flex h-11 w-full cursor-pointer items-center justify-center text-sm font-black uppercase tracking-wide transition-all duration-150 ${vi > 0 ? 'border-l-2 border-black' : ''}`}
                                    style={isSelected
                                      ? { background: "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 100%)", color: 'white', fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900 }
                                      : { background: 'transparent', color: 'black', fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900 }}
                                  >
                                    {value.resolvedValue.value ?? value.value}
                                  </span>
                                </Link>
                              )
                            })}
                          </div>
                        )}

                        {isFlavor && (
                          <div className="flex flex-wrap gap-3">
                            {values.map((value) => {
                              const nextVariant = { ...(selectedVariant?.variantKey ?? {}), [key]: value.value }
                              const keyStr = variantKeyToString(nextVariant)
                              const variantLink = variantUrlMap[keyStr] ?? `/product/${product.slug}`
                              const isSelected = selectedVariant?.variantKey?.[key] === value.value
                              const imgSrc = value.resolvedValue.type === 'image'
                                ? (value.resolvedValue.url ?? null)
                                : resolveFlavorImage(key, value.resolvedValue.value ?? '')
                              const displayName = value.resolvedValue.value ?? value.value
                              return (
                                <Link
                                  key={value.id}
                                  href={variantLink}
                                  className="group relative flex-shrink-0"
                                  onClick={disableSmoothScrollForNextNavigation}
                                >
                                  <span className="relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-2xl transition-all duration-200" style={{ background: 'transparent', border: 'none' }}>
                                    {isSelected && (
                                      <span className="absolute inset-0 rounded-2xl opacity-100 transition-opacity duration-200" style={{
                                        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.23) 0%, rgba(185,58,210,0.3) 35%, rgba(124,58,237,0.23) 60%, transparent 80%)',
                                        filter: 'blur(4px)',
                                      }} />
                                    )}
                                    {imgSrc ? (
                                      <span className="relative h-12 w-12 block transition-transform duration-200" style={{ transform: isSelected ? 'scale(1.05)' : 'scale(1)', filter: isSelected ? 'drop-shadow(0 4px 14px rgba(185,58,210,0.5))' : 'none' }}>
                                        <Image src={imgSrc} alt={displayName} fill unoptimized className="object-contain" />
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-black uppercase tracking-wide text-center leading-tight px-1" style={{ color: isSelected ? PURPLE : 'rgba(0,0,0,0.5)' }}>
                                        {displayName}
                                      </span>
                                    )}
                                  </span>
                                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 -mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide text-white opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0" style={{ background: PURPLE, transform: 'translateY(-4px)' }}>
                                    {displayName}
                                  </span>
                                </Link>
                              )
                            })}
                          </div>
                        )}

                        {!isFlavor && !isCount && (
                          <div className="flex flex-wrap gap-2">
                            {values.map((value) => {
                              const nextVariant = { ...(selectedVariant?.variantKey ?? {}), [key]: value.value }
                              const keyStr = variantKeyToString(nextVariant)
                              const variantLink = variantUrlMap[keyStr] ?? `/product/${product.slug}`
                              const isSelected = selectedVariant?.variantKey?.[key] === value.value
                              if (value.resolvedValue.type === 'color') {
                                return (
                                  <Link key={value.id} href={variantLink} onClick={disableSmoothScrollForNextNavigation}>
                                    <div className="h-9 w-9 cursor-pointer rounded-full border-3 border-black/10 transition" style={{ backgroundColor: value.resolvedValue.value, boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${PURPLE}` : 'none' }} />
                                  </Link>
                                )
                              }
                              return (
                                <Link key={value.id} href={variantLink} onClick={disableSmoothScrollForNextNavigation}>
                                  <span className="inline-flex cursor-pointer items-center justify-center rounded-md border-3 px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-all"
                                    style={isSelected ? { background: PURPLE, borderColor: PURPLE, color: 'white', fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900 } : { borderColor: 'rgba(0,0,0,0.2)', color: 'black', fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900 }}>
                                    {value.resolvedValue.value ?? value.value}
                                  </span>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {variants.length === 0 && <Price p={product} />}

              {product.description && (
                <p className="text-sm font-black uppercase leading-relaxed mt-3 text-bold -mb-5" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 600 }}>{product.description}</p>
              )}

              {/* Badge */}
              <div className="flex items-center justify-end relative top-8 z-[1]">
                <span
                  className="inline-flex flex-col items-center justify-center rounded-sm border-[3px] border-black px-4 py-2 text-center"
                  style={{
                    fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif",
                    fontWeight: 900,
                    transform: "rotate(3deg)",
                    background: 'linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)',
                    boxShadow: '3px 3px 0px rgba(0,0,0,1)',
                  }}
                >
                  <span className="text-[12px] font-black uppercase tracking-[0.25em] text-white" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif" }}>Taste just like</span>
                  <span className="text-[16px] font-black uppercase tracking-[0.1em] text-white leading-none" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif" }}>Cheat Day</span>
                </span>
              </div>
            </div>

            {/* Accent strip — qty + add to bag */}
            <div className="relative flex items-stretch gap-3 px-3 py-8" style={{ background: "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)" }}>
              <div className="flex items-center overflow-hidden rounded-md border-3 border-black bg-white">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={!isInStock || quantity <= 1} className="flex h-12 w-10 items-center justify-center text-lg font-black text-black transition-all duration-150 hover:[background:linear-gradient(135deg,rgb(68,15,195)_0%,rgb(158,38,182)_50%,rgb(232,68,106)_100%)] hover:text-white active:[background:linear-gradient(135deg,rgb(68,15,195)_0%,rgb(158,38,182)_50%,rgb(232,68,106)_100%)] active:text-white disabled:opacity-30" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900, cursor: !isInStock || quantity <= 1 ? 'not-allowed' : 'pointer' }}>−</button>
                <span className="w-8 text-center text-sm font-black text-black" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900 }}>{quantity}</span>
                <button onClick={() => setQuantity((prev) => Math.min(prev + 1, maxSelectableQuantity))} disabled={!isInStock || quantity >= maxSelectableQuantity} className="flex h-12 w-10 items-center justify-center text-lg font-black text-black transition-all duration-150 hover:[background:linear-gradient(135deg,rgb(68,15,195)_0%,rgb(158,38,182)_50%,rgb(232,68,106)_100%)] hover:text-white active:[background:linear-gradient(135deg,rgb(68,15,195)_0%,rgb(158,38,182)_50%,rgb(232,68,106)_100%)] active:text-white disabled:opacity-30" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900, cursor: !isInStock || quantity >= maxSelectableQuantity ? 'not-allowed' : 'pointer' }}>+</button>
              </div>
              {!isMainCartStatusReady ? (
                <button disabled className="flex flex-1 items-center justify-center border-[3px] border-black font-black uppercase italic tracking-[0.08em] text-white/60 disabled:opacity-70" style={{ background: "rgba(0,0,0,0.30)", fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900, boxShadow: '3px 3px 0 #111' }}>Loading...</button>
              ) : isInCart ? (
                <button onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new Event('cart:open'))} className="flex flex-1 cursor-pointer items-center justify-center gap-2 border-[3px] border-black font-black uppercase italic tracking-[0.08em] text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#111]" style={{ background: "rgba(0,0,0,0.30)", fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900, boxShadow: '3px 3px 0 #111' }}>
                  <ShoppingCart size={16} />View Cart
                </button>
              ) : isInStock ? (
                <button onClick={handleAddToCart} disabled={!isMainCartStatusReady || isAdding} className="flex flex-1 cursor-pointer items-center justify-center border-[3px] border-black font-black uppercase italic tracking-[0.08em] text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#111] disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)", fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900, boxShadow: '3px 3px 0 #111' }}>
                  {isAdding ? 'Adding...' : 'Add to Bag'}
                </button>
              ) : (
                <button disabled className="flex flex-1 items-center justify-center border-[3px] border-black font-black uppercase italic tracking-[0.08em] text-white" style={{ background: "rgba(0,0,0,0.30)", fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900, boxShadow: '3px 3px 0 #111', cursor: 'not-allowed', opacity: 0.7 }}>
                  Unavailable
                </button>
              )}
            </div>

            {/* ── Nutrition Facts + Ingredients trigger ── */}
            {isProteinPuddingCategory && (
              <div className="pt-4 pb-5 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    if (leftPanelRef.current) {
                      const { top, left, width } = leftPanelRef.current.getBoundingClientRect()
                      setPanelFixedStyle({ top, left, width })
                    }
                    setShowNutrition(true)
                  }}
                  className="text-sm font-black uppercase underline tracking-widest text-black transition-[letter-spacing] duration-200 ease-out hover:tracking-[0.12em]"
                  style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Nutrition Facts + Ingredients
                </button>
              </div>
            )}
          </div>

          <hr className="border-t-2 border-black/15" />
        </div>
      </div>


   

      {/* ── Prep Instructions Banner ── */}
      <div className="relative border-y-3 border-black/15" style={{ background: "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 55%, rgb(232,68,106) 100%)" }}>
        <div className="mx-auto max-w-[1400px] px-4 py-10 md:py-12">
          <div className="flex flex-col items-center justify-between gap-6">
            <div className="grid w-full grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { icon: Beaker, stat: "1/4 Cup", label: "Powder" },
                { icon: GlassWater, stat: "1/2 Cup", label: "Milk of Choice" },
                { icon: Timer, stat: "15 Min+", label: "Best Overnight" },
                { icon: Sparkles, stat: "Top It", label: "Granola or Fruit" },
              ].map(({ icon: Icon, stat, label }) => (
                <div key={label} className="text-center text-white">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center">
                    <Icon size={60} strokeWidth={2} />
                  </div>
                  <div className="text-base font-black uppercase tracking-[0.12em] md:text-lg" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900 }}>{stat}</div>
                  <div className="mt-1 text-[11px] font-black uppercase tracking-widest text-white/80" style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <LandingTestimonials />

  


      <Footer />
    </div>
  )
}
