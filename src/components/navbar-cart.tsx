"use client"

import { useEffect, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { ShoppingCart, X, Minus, Plus, ArrowRight, Truck, Zap } from "lucide-react"

type CartProduct = {
  id: string
  slug: string
  name: string
  sku?: string
  images?: string[]
  imageUrls?: string[]
  price?: number
  promoPrice?: number | null
  currency?: string
}

type CartItem = {
  id: string
  quantity: number
  product: CartProduct | null
  source?: "server" | "guest"
}

type AuthUser = {
  id: string
}

type GuestCartItem = {
  productId: string
  quantity: number
}

type NavbarCartRenderProps = {
  cartCount: number
  openCart: () => void
}

type NavbarCartProps = {
  currentUser: AuthUser | null
  onOpenChange?: (open: boolean) => void
  children: (props: NavbarCartRenderProps) => ReactNode
}

const GUEST_CART_KEY = "guest_cart"
const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"
const FREE_SHIPPING_THRESHOLD = 99

function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (it) => it && typeof it.productId === "string" && typeof it.quantity === "number"
    )
  } catch {
    return []
  }
}

function setGuestCart(items: GuestCartItem[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export function NavbarCart({ currentUser, onOpenChange, children }: NavbarCartProps) {
  const router = useRouter()

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  useEffect(() => {
    if (typeof document === "undefined") return
    const originalOverflow = document.body.style.overflow
    if (isCartOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = originalOverflow
    }
    return () => { document.body.style.overflow = originalOverflow }
  }, [isCartOpen])

  useEffect(() => { onOpenChange?.(isCartOpen) }, [isCartOpen, onOpenChange])

  useEffect(() => {
    let cancelled = false

    const loadCart = async () => {
      try {
        if (currentUser) {
          const res = await fetch("/api/shop/cart", { cache: "no-store" })
          if (!res.ok) { if (!cancelled) setCartItems([]); return }
          const data = await res.json()
          const items = Array.isArray(data?.items) ? data.items : []
          const mapped: CartItem[] = items.map((it: any) => {
            const prod = it?.product
            const product: CartProduct | null = prod ? {
              id: prod.id ?? "",
              slug: prod.slug ?? "",
              name: prod.name ?? "",
              sku: prod.sku ?? "",
              images: Array.isArray(prod.images) ? prod.images : [],
              imageUrls: Array.isArray(prod.imageUrls) ? prod.imageUrls : [],
              price: typeof prod.price === "number" ? prod.price : undefined,
              promoPrice: typeof prod.promoPrice === "number" ? prod.promoPrice : null,
              currency: prod.currency ?? "DT",
            } : null
            return { id: it.id ?? "", quantity: Number(it.quantity ?? 1), product, source: "server" }
          })
          if (!cancelled) setCartItems(mapped)
          return
        }

        const guest = getGuestCart()
        if (guest.length === 0) { if (!cancelled) setCartItems([]); return }
        const result: CartItem[] = []
        for (const item of guest) {
          try {
            const res = await fetch(`/api/shop/products/id/${item.productId}`, { cache: "no-store" })
            if (!res.ok) continue
            const data = await res.json()
            const prod = data?.product
            if (!prod) continue
            const product: CartProduct = {
              id: prod.id, slug: prod.slug ?? "", name: prod.name ?? "", sku: prod.sku ?? "",
              images: Array.isArray(prod.images) ? prod.images : [],
              imageUrls: Array.isArray(prod.imageUrls) ? prod.imageUrls : [],
              price: typeof prod.price === "number" ? prod.price : undefined,
              promoPrice: typeof prod.promoPrice === "number" ? prod.promoPrice : null,
              currency: prod.currency ?? "DT",
            }
            result.push({ id: item.productId, quantity: item.quantity, product, source: "guest" })
          } catch { /* ignore */ }
        }
        if (!cancelled) setCartItems(result)
      } catch (err) {
        console.error("Failed to load cart", err)
        if (!cancelled) setCartItems([])
      }
    }

    void loadCart()

    const onCartUpdated = () => { void loadCart() }
    const onCartOpen = () => { setIsCartOpen(true) }
    if (typeof window !== "undefined") {
      window.addEventListener("cart:updated", onCartUpdated)
      window.addEventListener("cart:open", onCartOpen)
    }
    return () => {
      cancelled = true
      if (typeof window !== "undefined") {
        window.removeEventListener("cart:updated", onCartUpdated)
        window.removeEventListener("cart:open", onCartOpen)
      }
    }
  }, [currentUser])

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) { await handleRemoveItem(itemId); return }
    try {
      if (currentUser) {
        const res = await fetch("/api/shop/cart", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, quantity: newQty }),
        })
        if (!res.ok) return
        setCartItems((prev) => prev.map((item) => item.id === itemId ? { ...item, quantity: newQty } : item))
      } else {
        const current = getGuestCart()
        const idx = current.findIndex((it) => it.productId === itemId)
        if (idx === -1) return
        current[idx].quantity = newQty
        setGuestCart(current)
        setCartItems((prev) => prev.map((item) => item.id === itemId ? { ...item, quantity: newQty } : item))
      }
      if (typeof window !== "undefined") window.dispatchEvent(new Event("cart:updated"))
    } catch (err) { console.error("Failed to update quantity", err) }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (typeof window !== "undefined") {
      const ok = window.confirm("Remove this item from your cart?")
      if (!ok) return
    }
    try {
      if (currentUser) {
        const res = await fetch(`/api/shop/cart?itemId=${encodeURIComponent(itemId)}`, { method: "DELETE" })
        if (!res.ok) return
      } else {
        setGuestCart(getGuestCart().filter((it) => it.productId !== itemId))
      }
      setCartItems((prev) => prev.filter((item) => item.id !== itemId))
      if (typeof window !== "undefined") window.dispatchEvent(new Event("cart:updated"))
    } catch (err) { console.error("Failed to remove cart item", err) }
  }

  const cartCount = cartItems.length
  const cartCurrency = cartItems.find((item) => item.product?.currency)?.product?.currency ?? "DT"
  const cartSubtotal = cartItems.reduce((sum, item) => {
    const prod = item.product
    if (!prod) return sum
    const unitPrice = prod.promoPrice && typeof prod.promoPrice === "number" && typeof prod.price === "number" && prod.promoPrice < prod.price
      ? prod.promoPrice : prod.price
    if (typeof unitPrice !== "number") return sum
    return sum + unitPrice * item.quantity
  }, 0)

  const shippingProgress = Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal)
  const freeShipping = cartSubtotal >= FREE_SHIPPING_THRESHOLD

  const overlay = isMounted && createPortal(
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setIsCartOpen(false)} />

      {/* Drawer */}
      <div
        className={`relative z-10 flex h-full flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{
          width: 'min(720px, 96vw)',
          backgroundColor: '#f5efe4',
          backgroundImage: "url('/texture.webp')",
          backgroundSize: '280px 280px',
          borderLeft: '4px solid #111',
          boxShadow: '-12px 0 0 #111',
        }}
      >
        {/* Top gradient accent line */}
        <div className="h-1.5 w-full shrink-0" style={{ background: GRADIENT }} />

        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-black px-6 py-5">
          <div className="flex items-center gap-3">
            <h2
              className="text-3xl font-black uppercase tracking-tighter"
              style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: '-0.04em', color: '#111' }}
            >
              MY CART
            </h2>
            {cartCount > 0 && (
              <span
                className="flex h-7 min-w-[28px] items-center justify-center border-2 border-black px-1.5 text-[11px] font-black text-white"
                style={{ fontFamily: FONT, fontWeight: 900, background: GRADIENT, boxShadow: '2px 2px 0 #111' }}
              >
                {cartCount}
              </span>
            )}
          </div>
          <button
            type="button"
            className="flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-black bg-white transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#111]"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Shipping progress bar */}
        <div className="border-b-3 border-black/10 px-6 py-4" style={{ background: 'rgba(255,255,255,0.5)' }}>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Truck size={14} strokeWidth={2.5} style={{ color: freeShipping ? 'rgb(34,197,94)' : '#111' }} />
              <span
                className="text-[10px] font-black uppercase tracking-[0.12em]"
                style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
              >
                {freeShipping
                  ? "FREE SHIPPING UNLOCKED!"
                  : <>${remaining.toFixed(2)} {cartCurrency} away from free shipping</>
                }
              </span>
            </div>
            <span
              className="text-[10px] font-black uppercase tracking-wider"
              style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.3)' }}
            >
              ${FREE_SHIPPING_THRESHOLD}
            </span>
          </div>

          {/* Bar track */}
          <div
            className="relative h-3 w-full overflow-hidden border-2 border-black"
            style={{ background: 'rgba(0,0,0,0.06)', boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.08)' }}
          >
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${shippingProgress}%`,
                background: freeShipping ? 'linear-gradient(90deg, rgb(34,197,94), rgb(16,185,129))' : GRADIENT,
              }}
            />
            {/* Tick marks */}
            {[25, 50, 75].map((pct) => (
              <div
                key={pct}
                className="absolute top-0 h-full w-px"
                style={{ left: `${pct}%`, background: 'rgba(0,0,0,0.12)' }}
              />
            ))}
          </div>

          <div className="mt-1 flex justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.3)' }}>$0</span>
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.3)' }}>FREE SHIP</span>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <div
                className="flex h-24 w-24 items-center justify-center border-4 border-black bg-white"
                style={{ boxShadow: '6px 6px 0 #111' }}
              >
                <ShoppingCart className="h-10 w-10" strokeWidth={2} style={{ color: 'rgba(0,0,0,0.25)' }} />
              </div>
              <div>
                <p
                  className="text-2xl font-black uppercase tracking-tighter"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                >
                  YOUR CART IS EMPTY
                </p>
                <p className="mt-1.5 text-sm font-semibold" style={{ color: 'rgba(0,0,0,0.4)' }}>
                  Add products to get started.
                </p>
              </div>
              <Link
                href="/boutique"
                onClick={() => setIsCartOpen(false)}
                className="inline-flex items-center gap-2 border-3 border-black px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{ fontFamily: FONT, fontWeight: 900, background: GRADIENT, boxShadow: '4px 4px 0 #111' }}
              >
                Shop Now
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => {
                const prod = item.product
                const productHref = prod?.slug ? `/shop/${prod.slug}` : null
                const imgSrc = prod && Array.isArray(prod.imageUrls) && prod.imageUrls.length > 0
                  ? prod.imageUrls[0]! : "/placeholder-square.webp"
                const unitPrice = prod?.promoPrice && typeof prod.promoPrice === "number" && typeof prod.price === "number" && prod.promoPrice < prod.price
                  ? prod.promoPrice : prod?.price
                const currency = prod?.currency ?? "DT"

                return (
                  <div
                    key={item.id}
                    className="group relative flex gap-4 bg-white p-4"
                    style={{ border: '3px solid #111', boxShadow: '4px 4px 0 #111' }}
                  >
                    {/* Product image */}
                    {productHref ? (
                      <Link
                        href={productHref}
                        onClick={() => setIsCartOpen(false)}
                        className="relative h-24 w-24 shrink-0 overflow-hidden border-2 border-black"
                        style={{ boxShadow: '3px 3px 0 #111' }}
                      >
                        <Image src={imgSrc} alt={prod?.name ?? "Product"} fill sizes="96px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                      </Link>
                    ) : (
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden border-2 border-black" style={{ boxShadow: '3px 3px 0 #111' }}>
                        <Image src={imgSrc} alt={prod?.name ?? "Product"} fill sizes="96px" className="object-cover" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {productHref ? (
                            <Link
                              href={productHref}
                              onClick={() => setIsCartOpen(false)}
                              className="block truncate text-sm font-black uppercase leading-tight tracking-tight transition-opacity hover:opacity-70"
                              style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                            >
                              {prod?.name ?? "Product unavailable"}
                            </Link>
                          ) : (
                            <p className="truncate text-sm font-black uppercase leading-tight tracking-tight" style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}>
                              {prod?.name ?? "Product unavailable"}
                            </p>
                          )}
                          {prod?.sku && (
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.3)' }}>
                              Ref: {prod.sku}
                            </p>
                          )}
                        </div>
                        {/* Remove */}
                        <button
                          type="button"
                          className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white transition-all hover:shadow-[2px_2px_0_#111]"
                          onClick={() => void handleRemoveItem(item.id)}
                          aria-label="Remove item"
                        >
                          <X className="h-3 w-3" strokeWidth={3} />
                        </button>
                      </div>

                      {/* Qty + price row */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center border-2 border-black" style={{ boxShadow: '2px 2px 0 #111' }}>
                          <button
                            type="button"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center bg-white text-sm font-black transition-colors hover:bg-black/5"
                            onClick={() => void handleUpdateQuantity(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={13} strokeWidth={3} />
                          </button>
                          <span
                            className="flex h-8 w-9 items-center justify-center border-x-2 border-black text-sm font-black"
                            style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center bg-white text-sm font-black transition-colors hover:bg-black/5"
                            onClick={() => void handleUpdateQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} strokeWidth={3} />
                          </button>
                        </div>

                        {unitPrice != null && (
                          <span
                            className="text-base font-black"
                            style={{
                              fontFamily: FONT, fontWeight: 900,
                              background: GRADIENT,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                            }}
                          >
                            {(unitPrice * item.quantity).toFixed(2)} {currency}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t-4 border-black px-6 py-5" style={{ background: 'rgba(255,255,255,0.6)' }}>
            {/* Totals */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}>
                  Subtotal
                </span>
                <span className="text-sm font-black" style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}>
                  {cartSubtotal.toFixed(2)} {cartCurrency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}>
                  Shipping
                </span>
                <span
                  className="text-sm font-black"
                  style={{
                    fontFamily: FONT, fontWeight: 900,
                    color: freeShipping ? 'rgb(34,197,94)' : '#111',
                  }}
                >
                  {freeShipping ? 'FREE' : `+8.00 ${cartCurrency}`}
                </span>
              </div>
              <div className="flex items-end justify-between border-t-2 border-black/10 pt-3">
                <span className="text-sm font-black uppercase" style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}>Total</span>
                <span
                  className="text-2xl font-black tracking-tighter"
                  style={{
                    fontFamily: FONT, fontWeight: 900,
                    background: GRADIENT,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {(cartSubtotal + (freeShipping ? 0 : 8)).toFixed(2)} {cartCurrency}
                </span>
              </div>
            </div>

            {/* Checkout button */}
            <button
              type="button"
              className="shimmer-btn relative flex w-full cursor-pointer items-center justify-between overflow-hidden border-3 border-black px-5 py-4 text-sm font-black uppercase tracking-[0.1em] text-white transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{
                fontFamily: FONT, fontWeight: 900,
                background: GRADIENT,
                boxShadow: '5px 5px 0 #111',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '7px 7px 0 #111'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '5px 5px 0 #111'
              }}
              onClick={() => {
                setIsCartOpen(false)
                router.push("/commande")
              }}
            >
              <span className="flex items-center gap-2">
                <Zap size={16} strokeWidth={2.5} />
                Checkout Now
              </span>
              <span className="flex items-center gap-1">
                {cartSubtotal.toFixed(2)} {cartCurrency}
                <ArrowRight size={16} strokeWidth={2.5} />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )

  return (
    <>
      {children({ cartCount, openCart: () => setIsCartOpen(true) })}
      {overlay}
    </>
  )
}
