"use client"

import { useEffect, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { ShoppingCart, X, ArrowRight } from "lucide-react"

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
  stock?: number
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
const GRADIENT = "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)"
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
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalPadding = document.body.style.paddingRight
    if (isCartOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.paddingRight = `${scrollbarWidth}px`
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
    } else {
      window.dispatchEvent(new Event("cart:drawer:close"))
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
      document.body.style.paddingRight = originalPadding
    }
    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
      document.body.style.paddingRight = originalPadding
    }
  }, [isCartOpen])

  useEffect(() => {
    onOpenChange?.(isCartOpen)
  }, [isCartOpen, onOpenChange])

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
              stock: typeof prod.stock === "number" ? prod.stock : undefined,
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
              stock: typeof prod.stock === "number" ? prod.stock : undefined,
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
    const onCartOpen = () => {
      window.dispatchEvent(new Event("cart:drawer:open"))
      setIsCartOpen(true)
    }
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
    // Optimistic update — instant UI response
    const prev = cartItems
    setCartItems((items) => items.map((item) => item.id === itemId ? { ...item, quantity: newQty } : item))
    try {
      if (currentUser) {
        const res = await fetch("/api/shop/cart", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, quantity: newQty }),
        })
        if (!res.ok) { setCartItems(prev); return }
      } else {
        const current = getGuestCart()
        const idx = current.findIndex((it) => it.productId === itemId)
        if (idx === -1) { setCartItems(prev); return }
        current[idx].quantity = newQty
        setGuestCart(current)
      }
      if (typeof window !== "undefined") window.dispatchEvent(new Event("cart:updated"))
    } catch (err) { console.error("Failed to update quantity", err); setCartItems(prev) }
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
          width: 'min(620px, 96vw)',
          backgroundColor: '#f5efe4',
          backgroundImage: "url('/texture.webp')",
          backgroundSize: '280px 280px',
        }}
      >
        {/* Header */}
        <div
          className="relative flex items-start justify-between px-6 pb-2 pt-4"
        >
          <div>
            <h2
              className="text-5xl font-black uppercase leading-none"
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                background: GRADIENT,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              YOUR BAG
            </h2>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center transition-opacity hover:opacity-60"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Shipping progress bar */}
        <div className="px-6 py-4">
          <div className="mb-2 flex items-center justify-between">
            <span
              className="text-[9px] font-black uppercase tracking-[0.22em]"
              style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
            >
              YOU
            </span>
            <span
              className="text-[9px] font-black uppercase tracking-[0.22em]"
              style={{ fontFamily: FONT, fontWeight: 900, color: freeShipping ? 'rgb(34,197,94)' : '#111' }}
            >
              FREE SHIPPING
            </span>
          </div>

          {/* Bar */}
          <div
            className="relative h-8 w-full overflow-hidden border-[3px] border-black"
            style={{ background: 'rgba(255,255,255,0.7)', boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.06)' }}
          >
            <div
              className="h-full"
              style={{
                width: `${shippingProgress}%`,
                background: freeShipping ? 'linear-gradient(90deg, rgb(34,197,94), rgb(16,185,129))' : GRADIENT,
                transition: 'width 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>

          <div className="mt-1.5 flex justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.35)' }}>
              {cartSubtotal > 0 ? `$${cartSubtotal.toFixed(0)}` : '$0'}
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.35)' }}>
              ${FREE_SHIPPING_THRESHOLD}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <ShoppingCart className="h-14 w-14" strokeWidth={1.75} style={{ color: 'rgb(68,15,195)' }} />
              <div>
                <p
                  className="text-2xl font-black uppercase"
                  style={{
                    fontFamily: FONT, fontWeight: 900,
                    background: GRADIENT,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Your Bag Is Empty
                </p>
                <p className="mt-1.5 text-[11px] font-black uppercase tracking-[0.15em]" style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}>
                  Add products to get started
                </p>
              </div>
              <Link
                href="/shop"
                onClick={() => setIsCartOpen(false)}
                className="inline-flex items-center gap-2 border-[3px] border-black px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
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
                    className="flex gap-2 bg-white p-2"
                    style={{ border: '3px solid #111', boxShadow: '4px 4px 0 #111' }}
                  >
                    {/* Product image */}
                    {productHref ? (
                      <Link
                        href={productHref}
                        onClick={() => setIsCartOpen(false)}
                        className="relative h-20 w-20 shrink-0 overflow-hidden"
                      >
                        <Image src={imgSrc} alt={prod?.name ?? "Product"} fill sizes="80px" className="object-cover" />
                      </Link>
                    ) : (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden border-2 border-black">
                        <Image src={imgSrc} alt={prod?.name ?? "Product"} fill sizes="80px" className="object-cover" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
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
                        {(prod?.sku || unitPrice != null) && (
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.4)' }}>
                            {[prod?.sku, unitPrice != null ? `${(unitPrice * item.quantity).toFixed(2)} ${currency}` : null].filter(Boolean).join(' | ')}
                          </p>
                        )}
                      </div>

                      {/* Qty + DELETE row */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center overflow-hidden rounded-md border-[3px] border-black bg-white">
                          {(() => {
                            const maxQty = prod?.stock != null ? Math.max(1, prod.stock) : 99
                            return (
                              <>
                                <button
                                  type="button"
                                  className="flex h-10 w-9 items-center justify-center text-lg font-black text-black transition-all duration-150 hover:[background:linear-gradient(135deg,rgb(68,15,195)_0%,rgb(158,38,182)_50%,rgb(232,68,106)_100%)] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                  style={{ fontFamily: FONT, fontWeight: 900, cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer' }}
                                  disabled={item.quantity <= 1}
                                  onClick={() => void handleUpdateQuantity(item.id, item.quantity - 1)}
                                  aria-label="Decrease quantity"
                                >
                                  −
                                </button>
                                <span
                                  className="w-8 text-center text-sm font-black text-black"
                                  style={{ fontFamily: FONT, fontWeight: 900 }}
                                >
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="flex h-10 w-9 items-center justify-center text-lg font-black text-black transition-all duration-150 hover:[background:linear-gradient(135deg,rgb(68,15,195)_0%,rgb(158,38,182)_50%,rgb(232,68,106)_100%)] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                  style={{ fontFamily: FONT, fontWeight: 900, cursor: item.quantity >= maxQty ? 'not-allowed' : 'pointer' }}
                                  disabled={item.quantity >= maxQty}
                                  onClick={() => void handleUpdateQuantity(item.id, item.quantity + 1)}
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </>
                            )
                          })()}
                        </div>

                        <button
                          type="button"
                          className="cursor-pointer border-2 border-black bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[2px_2px_0_#111]"
                          style={{ fontFamily: FONT, fontWeight: 900 }}
                          onClick={() => void handleRemoveItem(item.id)}
                        >
                          DELETE
                        </button>
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
          <div style={{ borderTop: '4px solid #111', background: GRADIENT }}>
            {/* Subtotal row */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '4px solid rgba(0,0,0,0.25)' }}
            >
              <span
                className="text-sm font-black uppercase tracking-[0.2em] text-white"
                style={{ fontFamily: FONT, fontWeight: 900 }}
              >
                SUBTOTAL
              </span>
              <span
                className="text-lg font-black text-white"
                style={{ fontFamily: FONT, fontWeight: 900 }}
              >
                {cartSubtotal.toFixed(2)} {cartCurrency}
              </span>
            </div>

            {/* CTA */}
            <div className="px-5 py-3">
              <button
                type="button"
                className="w-full cursor-pointer border-[3px] border-black py-3 text-base font-black uppercase italic tracking-[0.08em] text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#111]"
                style={{
                  fontFamily: FONT, fontWeight: 900,
                  background: GRADIENT,
                  boxShadow: '3px 3px 0 #111',
                }}
                onClick={() => {
                  setIsCartOpen(false)
                  router.push("/checkout")
                }}
              >
                VIEW BAG &amp; CHECKOUT
              </button>
              <p
                className="mt-3 text-center text-[9px] font-black uppercase tracking-[0.16em] text-white/70"
                style={{ fontFamily: FONT }}
              >
                *TAXES ARE CALCULATED AT CHECKOUT*
              </p>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )

  return (
    <>
      {children({ cartCount, openCart: () => {
        window.dispatchEvent(new Event("cart:drawer:open"))
        setIsCartOpen(true)
      } })}
      {overlay}
    </>
  )
}
