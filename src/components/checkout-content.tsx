"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { parseShippingPolicy, type ShippingPolicy } from "@/lib/shipping"
import { mergeGuestCartAfterAuth } from "@/lib/shop/client-api"
import {
  CreditCard,
  Save,
  X,
  ChevronRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Loader2,
  CheckCircle2,
} from "lucide-react"

type CartProduct = {
  id: string
  slug: string
  name: string
  sku?: string
  images?: string[]
  price?: number
  promoPrice?: number | null
  currency?: string
}

type CartItem = {
  id: string
  quantity: number
  product: CartProduct | null
  source?: "pb" | "guest"
}

type GuestCartItem = {
  productId: string
  quantity: number
}

type UserAddress = {
  id: string
  address: string
  city: string
  postalCode?: string
  notes?: string
  country?: string
  state?: string
  address2?: string
}

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)"
const GUEST_CART_KEY = "guest_cart"
const SIGNUP_PROMO_DISMISSED_KEY = "signup_promo_dismissed_v1"
const DEFAULT_CURRENCY = "USD"
const CHECKOUT_ATTEMPT_KEY = "checkout_attempt_v1"

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "DC", name: "Washington D.C." }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
] as const

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

function pbFileUrl(productId: string, filename: string) {
  const base =
    process.env.NEXT_PUBLIC_PB_URL ??
    process.env.POCKETBASE_URL ??
    "http://127.0.0.1:8090"
  return `${base}/api/files/products/${productId}/${encodeURIComponent(filename)}`
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function isPlaceholderEmail(value: string) {
  return normalizeEmail(value).endsWith("@placeholder.local")
}

function getUnitPrice(product: CartProduct | null): number {
  if (!product) return 0
  const price = typeof product.price === "number" ? product.price : 0
  const promo = typeof product.promoPrice === "number" ? product.promoPrice : null
  if (promo != null && promo > 0 && promo < price) return promo
  return price
}

export function CheckoutContent() {
  const storeSettings = useStoreSettings()
  const router = useRouter()
  const searchParams = useSearchParams()
  const buyNow = searchParams.get("buyNow") === "1"
  const buyNowProductId = searchParams.get("productId")
  const buyNowQty = Math.max(1, Number(searchParams.get("qty") ?? "1") || 1)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [profileEmail, setProfileEmail] = useState("")

  const country = "US"
  const [address, setAddress] = useState("")
  const [address2, setAddress2] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [notes, setNotes] = useState("")

  const [isNavbarVisible, setIsNavbarVisible] = useState(true)
  const lastScrollYRef = useRef(0)
  const checkoutAttemptRef = useRef<string | null>(null)
  const cancelHandledRef = useRef(false)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState("new")
  const [isSavingAddress, setIsSavingAddress] = useState(false)

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [isPromoBannerVisible, setIsPromoBannerVisible] = useState(false)
  const [orderFlowStage, setOrderFlowStage] = useState<"idle" | "loading" | "success">("idle")
  const [stripeConfigured, setStripeConfigured] = useState(false)
  const [shippingPolicy, setShippingPolicy] = useState<ShippingPolicy | null>(null)
  const [shippingError, setShippingError] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get("cancelled") !== "1" || cancelHandledRef.current) return
    cancelHandledRef.current = true
    const orderId = searchParams.get("orderId") ?? ""
    if (!/^[A-Za-z0-9]{15}$/.test(orderId)) {
      void Promise.resolve().then(() => setOrderError("Payment was cancelled. Your cart is unchanged."))
      return
    }
    void fetch(`/api/shop/orders/${encodeURIComponent(orderId)}/cancel`, { method: "POST" })
      .then(async response => {
        if (response.ok) {
          window.sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY)
          checkoutAttemptRef.current = null
          void mergeGuestCartAfterAuth()
          setOrderError("Payment was cancelled. Your cart is unchanged and ready to retry.")
        } else {
          setOrderError("Payment cancellation is being confirmed. Your cart is unchanged.")
        }
      })
      .catch(() => setOrderError("Payment cancellation is being confirmed. Your cart is unchanged."))
  }, [searchParams])

  async function loadShipping() {
    setShippingError(null)
    try {
      const response = await fetch("/api/shop/shipping", { cache: "no-store" })
      if (!response.ok) throw new Error("Shipping unavailable")
      const data = await response.json()
      setShippingPolicy(parseShippingPolicy(data.policy))
    } catch {
      setShippingPolicy(null)
      setShippingError("Shipping is temporarily unavailable. Please try again.")
    }
  }

  // Fetch callback owns shipping request state; running once on mount is intentional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadShipping() }, [])

  useEffect(() => {
    const threshold = 8
    const onScroll = () => {
      const currentY = window.scrollY
      const delta = currentY - lastScrollYRef.current
      if (delta > threshold) setIsNavbarVisible(false)
      else if (delta < -threshold) setIsNavbarVisible(true)
      lastScrollYRef.current = currentY
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Load Stripe config
  useEffect(() => {
    fetch('/api/shop/stripe/config')
      .then(r => r.json())
      .then(data => setStripeConfigured(!!data?.configured))
      .catch(() => setStripeConfigured(false))
  }, [])

  useEffect(() => {
    let cancelled = false

    const applyModel = (model: Record<string, any> | null) => {
      if (!model) return

      if (typeof model.email === "string") {
        const nextEmail = model.email.trim()
        if (nextEmail) {
          setProfileEmail(nextEmail)
          if (!isPlaceholderEmail(nextEmail)) {
            setEmail((prev) => prev || nextEmail)
          }
        }
      }
      if (typeof model.surname === "string" && model.surname.trim()) {
        setFirstName((prev) => prev || model.surname.trim())
      }
      if (typeof model.name === "string" && model.name.trim()) {
        setLastName((prev) => prev || model.name.trim())
      }
      if (typeof model.firstName === "string" && model.firstName.trim()) {
        setFirstName((prev) => prev || model.firstName.trim())
      }
      if (typeof model.lastName === "string" && model.lastName.trim()) {
        setLastName((prev) => prev || model.lastName.trim())
      }
    }

    const syncAuthState = async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" })
        if (!res.ok) {
          if (cancelled) return
          setIsLoggedIn(false)
          setAuthUserId(null)
          return
        }
        const data = await res.json()
        const user = data?.user
        if (cancelled) return
        if (user?.id) {
          setIsLoggedIn(true)
          setAuthUserId(String(user.id))
          applyModel(user)
          return
        }
      } catch {
        // ignore and fallback to logged out state
      }

      if (cancelled) return
      setIsLoggedIn(false)
      setAuthUserId(null)
    }

    void syncAuthState()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const dismissedUntilRaw = window.localStorage.getItem(SIGNUP_PROMO_DISMISSED_KEY)
    const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0
    const isDismissed =
      !!dismissedUntilRaw && Number.isFinite(dismissedUntil) && Date.now() < dismissedUntil
    // Visibility depends on browser-only persisted dismissal state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPromoBannerVisible(!isLoggedIn && !isDismissed)
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) {
      // Clear account-owned addresses immediately after sign-out.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAddresses([])
      setSelectedAddressId("new")
      return
    }

    let cancelled = false

    const loadAddresses = async () => {
      try {
        const res = await fetch("/api/shop/addresses", {
          method: "GET",
          cache: "no-store",
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.message || "Failed to load addresses.")
        }
        const data = await res.json()
        const rows = Array.isArray(data?.items) ? data.items : []
        if (cancelled) return
        const mapped: UserAddress[] = rows.map((row: any) => ({
          id: String(row.id),
          address: String(row.address ?? ""),
          city: String(row.city ?? ""),
          postalCode: typeof row.postalCode === "string" ? row.postalCode : "",
          notes: typeof row.notes === "string" ? row.notes : "",
          country: typeof row.country === "string" ? row.country : "",
          state: typeof row.state === "string" ? row.state : "",
          address2: typeof row.address2 === "string" ? row.address2 : "",
        }))
        setAddresses(mapped)
        if (mapped.length > 0) {
          setSelectedAddressId(mapped[0].id)
        }
      } catch (err: any) {
        if (!cancelled) {
          setAddresses([])
          setOrderError(err?.message || "Failed to load addresses.")
        }
      }
    }

    void loadAddresses()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (selectedAddressId === "new") return
    const selected = addresses.find((a) => a.id === selectedAddressId)
    if (!selected) return
    if (selected.country && selected.country.toUpperCase() !== "US") {
      // Reject a persisted legacy non-US address before copying it into checkout.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrderError("Please enter a US delivery address.")
      setSelectedAddressId("new")
      return
    }
    setAddress(selected.address || "")
    setAddress2(selected.address2 || "")
    setCity(selected.city || "")
    setPostalCode(selected.postalCode || "")
    setNotes(selected.notes || "")

    setState(selected.state || "")
  }, [addresses, selectedAddressId])

  useEffect(() => {
    let cancelled = false

    const loadBuyNow = async () => {
      const PB_ID_RE = /^[a-zA-Z0-9]{15}$/
      if (!buyNow || !buyNowProductId || !PB_ID_RE.test(buyNowProductId)) return false
      try {
        const res = await fetch(`/api/shop/products/id/${buyNowProductId}`, { cache: "no-store" })
        if (!res.ok) {
          if (!cancelled) setCartItems([])
          return true
        }
        const payload = await res.json()
        const p = payload?.product
        const product: CartProduct = {
          id: p.id,
          slug: p.slug ?? "",
          name: p.name ?? "",
          sku: p.sku ?? "",
          images: Array.isArray(p.images) ? p.images : [],
          price: typeof p.price === "number" ? p.price : undefined,
          promoPrice: typeof p.promoPrice === "number" ? p.promoPrice : null,
          currency: p.currency ?? DEFAULT_CURRENCY,
        }
        if (!cancelled) {
          setCartItems([{ id: p.id, quantity: buyNowQty, product, source: "guest" }])
        }
      } catch {
        if (!cancelled) setCartItems([])
      }
      return true
    }

    const loadCart = async () => {
      const loadedBuyNow = await loadBuyNow()
      if (loadedBuyNow) return

      try {
        if (isLoggedIn) {
          const res = await fetch("/api/shop/cart", { method: "GET", cache: "no-store" })
          if (!res.ok) {
            if (!cancelled) setCartItems([])
            return
          }
          const data = await res.json()
          const items = Array.isArray(data?.items) ? data.items : []
          if (cancelled) return

          const mapped: CartItem[] = items.map((it: any) => {
            const prod = it.product
            const product: CartProduct | null = prod
              ? {
                  id: prod.id,
                  slug: prod.slug ?? "",
                  name: prod.name ?? "",
                  sku: prod.sku ?? "",
                  images: Array.isArray(prod.images) ? prod.images : [],
                  price: typeof prod.price === "number" ? prod.price : undefined,
                  promoPrice: typeof prod.promoPrice === "number" ? prod.promoPrice : null,
                  currency: prod.currency ?? DEFAULT_CURRENCY,
                }
              : null

            return { id: it.id, quantity: Number(it.quantity ?? 1), product, source: "pb" }
          })

          setCartItems(mapped)
          return
        }

        const guest = getGuestCart()
        if (guest.length === 0) {
          if (!cancelled) setCartItems([])
          return
        }

        const result: CartItem[] = []
        const PB_ID_RE = /^[a-zA-Z0-9]{15}$/
        for (const item of guest) {
          if (!PB_ID_RE.test(item.productId)) continue
          try {
            const res = await fetch(`/api/shop/products/id/${item.productId}`, { cache: "no-store" })
            if (!res.ok) continue
            const payload = await res.json()
            const prod = payload?.product
            const product: CartProduct = {
              id: prod.id,
              slug: prod.slug ?? "",
              name: prod.name ?? "",
              sku: prod.sku ?? "",
              images: Array.isArray(prod.images) ? prod.images : [],
              price: typeof prod.price === "number" ? prod.price : undefined,
              promoPrice: typeof prod.promoPrice === "number" ? prod.promoPrice : null,
              currency: prod.currency ?? DEFAULT_CURRENCY,
            }

            result.push({ id: item.productId, quantity: item.quantity, product, source: "guest" })
          } catch {
            // ignore a single broken product
          }
        }

        if (!cancelled) setCartItems(result)
      } catch {
        if (!cancelled) setCartItems([])
      }
    }

    void loadCart()
    return () => {
      cancelled = true
    }
  }, [buyNow, buyNowProductId, buyNowQty, isLoggedIn])

  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + getUnitPrice(item.product) * item.quantity, 0),
    [cartItems]
  )
  const cartCurrency = "USD"
  const shipping = cartItems.length > 0 && shippingPolicy ? shippingPolicy.rateCents / 100 : 0
  const cartTotal = cartSubtotal + shipping

  const canSaveAddress = useMemo(() => {
    if (!isLoggedIn) return false
    return Boolean(address.trim() && city.trim())
  }, [isLoggedIn, address, city])

  const isPostalCodeValid = useMemo(() => {
    const pc = postalCode.trim()
    if (!pc) return false
    if (country === "US") return /^\d{5}$/.test(pc)
    return pc.length > 0
  }, [postalCode, country])

  const isRequiredFieldsValid = useMemo(
    () =>
      Boolean(
        firstName.trim() &&
        lastName.trim() &&
        country.trim() &&
        address.trim() &&
        city.trim() &&
        isPostalCodeValid &&
        (country !== "US" || state.trim())
      ),
    [firstName, lastName, country, address, city, isPostalCodeValid, state]
  )

  const syncEmailToProfile = async (showError = true) => {
    if (!isLoggedIn) return true

    const nextEmail = email.trim()
    if (!nextEmail || isPlaceholderEmail(nextEmail)) return true
    if (normalizeEmail(nextEmail) === normalizeEmail(profileEmail)) return true

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || "Failed to update your email.")
      }
      const data = await res.json().catch(() => ({}))
      const updatedEmail =
        typeof data?.user?.email === "string" && data.user.email.trim()
          ? data.user.email.trim()
          : nextEmail
      setProfileEmail(updatedEmail)
      setEmail(updatedEmail)
      return true
    } catch (err: any) {
      if (showError) {
        setOrderError(err?.message || "Failed to update your email.")
      }
      return false
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) {
      await handleRemoveItem(itemId)
      return
    }

    if (buyNow) {
      setCartItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, quantity: newQty } : it)))
      return
    }

    try {
      if (isLoggedIn) {
        const res = await fetch("/api/shop/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, quantity: newQty }),
        })
        if (!res.ok) return
        setCartItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, quantity: newQty } : it)))
      } else {
        const current = getGuestCart()
        const idx = current.findIndex((it) => it.productId === itemId)
        if (idx === -1) return
        current[idx].quantity = newQty
        setGuestCart(current)
        setCartItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, quantity: newQty } : it)))
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart:updated"))
      }
    } catch {
      // ignore quantity update failures in UI flow
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (buyNow) {
      setCartItems((prev) => prev.filter((it) => it.id !== itemId))
      return
    }

    try {
      if (isLoggedIn) {
        const res = await fetch(`/api/shop/cart?itemId=${encodeURIComponent(itemId)}`, {
          method: "DELETE",
        })
        if (!res.ok) return
      } else {
        const next = getGuestCart().filter((it) => it.productId !== itemId)
        setGuestCart(next)
      }
      setCartItems((prev) => prev.filter((it) => it.id !== itemId))
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart:updated"))
      }
    } catch {
      // ignore delete failures in UI flow
    }
  }

  const handleSaveAddress = async () => {
    if (!canSaveAddress || isSavingAddress) return
    setOrderError(null)

    try {
      setIsSavingAddress(true)
      if (!isLoggedIn || !authUserId) {
        setOrderError("Please log in again to save your address.")
        return
      }

      const payload = {
        address: address.trim(),
        address2: address2.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        notes: notes.trim(),
        country: country.trim(),
        state: state.trim(),
      }

      if (selectedAddressId !== "new") {
        const res = await fetch("/api/shop/addresses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedAddressId, ...payload }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.message || "Failed to update address.")
        }
        setAddresses((prev) =>
          prev.map((a) => (a.id === selectedAddressId ? { ...a, ...payload } : a))
        )
      } else {
        const res = await fetch("/api/shop/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.message || "Failed to save address.")
        }
        const data = await res.json()
        const created = data?.item
        const mapped: UserAddress = {
          id: String(created.id),
          address: String(created.address ?? payload.address),
          address2: String(created.address2 ?? payload.address2),
          city: String(created.city ?? payload.city),
          postalCode: String(created.postalCode ?? payload.postalCode),
          notes: String(created.notes ?? payload.notes),
          country: String(created.country ?? payload.country),
          state: String(created.state ?? payload.state),
        }
        setAddresses((prev) => [mapped, ...prev])
        setSelectedAddressId(mapped.id)
      }
    } catch (err: any) {
      setOrderError(err?.message || "Failed to save address.")
    } finally {
      setIsSavingAddress(false)
    }
  }

  const handleConfirmOrder = async () => {
    setOrderError(null)

    if (!shippingPolicy) {
      setOrderError("Shipping is unavailable. Please reload the shipping rate before continuing.")
      return
    }

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setOrderError("Please fill in your contact information.")
      return
    }
    if (!country.trim()) {
      setOrderError("Please select your country.")
      return
    }
    if (!address.trim() || !city.trim()) {
      setOrderError("Please enter your shipping address.")
      return
    }
    if (cartItems.length === 0) {
      setOrderError("Your cart is empty.")
      return
    }

    try {
      setIsPlacingOrder(true)
      setOrderFlowStage("loading")
      const didSyncEmail = await syncEmailToProfile(true)
      if (!didSyncEmail) {
        setOrderFlowStage("idle")
        return
      }

      const itemsPayload = cartItems.map((item) => ({
        id: item.product?.id,
        productId: item.product?.id,
        name: item.product?.name ?? "Product",
        sku: item.product?.sku ?? "",
        unitPrice: getUnitPrice(item.product),
        quantity: Math.max(1, Number(item.quantity || 1)),
      }))

      const orderPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country: country.trim(),
        address: address.trim(),
        address2: address2.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        notes: notes.trim(),
        shippingVersion: shippingPolicy.version,
        items: itemsPayload,
        currency: cartCurrency,
      }

      const payloadSignature = JSON.stringify(orderPayload)
      let checkoutAttemptKey = checkoutAttemptRef.current
      if (typeof window !== "undefined" && !checkoutAttemptKey) {
        try {
          const stored = JSON.parse(window.sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY) || "null")
          if (stored?.payload === payloadSignature && typeof stored?.key === "string") checkoutAttemptKey = stored.key
        } catch { /* Start a fresh attempt below. */ }
      }
      if (!checkoutAttemptKey) checkoutAttemptKey = crypto.randomUUID()
      checkoutAttemptRef.current = checkoutAttemptKey
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify({ key: checkoutAttemptKey, payload: payloadSignature }))
      }

      const orderRes = await fetch("/api/shop/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": checkoutAttemptKey,
        },
        body: JSON.stringify(orderPayload),
      })
      const orderData = await orderRes.json().catch(() => ({}))
      if (!orderRes.ok) {
        if (orderData?.resetCheckoutAttempt === true) {
          checkoutAttemptRef.current = null
          if (typeof window !== "undefined") window.sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY)
        }
        if (orderRes.status === 409 && orderData.policy) {
          setShippingPolicy(parseShippingPolicy(orderData.policy))
        }
        if (orderRes.status === 503) {
          setShippingPolicy(null)
          setShippingError("Shipping is temporarily unavailable. Please try again.")
        }
        throw new Error(orderData?.message || "Checkout failed. Please try again.")
      }
      if (typeof window !== "undefined" && typeof orderData?.orderId === "string") {
        window.sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify({ key: checkoutAttemptKey, payload: payloadSignature, orderId: orderData.orderId }))
      }

      // Stripe redirect
      if (typeof orderData?.url === "string" && orderData.url) {
        window.location.href = orderData.url
        return
      }

      // Test mode
      const createdOrderId = typeof orderData?.orderId === "string" ? orderData.orderId : ""

      await new Promise((resolve) => window.setTimeout(resolve, 1000))
      setOrderFlowStage("success")
      await new Promise((resolve) => window.setTimeout(resolve, 800))
      router.push(createdOrderId ? `/checkout/confirmation?id=${encodeURIComponent(createdOrderId)}` : "/")
    } catch (err: any) {
      setOrderFlowStage("idle")
      const message = err?.data?.message || err?.message || "Checkout failed. Please try again."
      setOrderError(String(message))
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: '13px',
    border: '3px solid #111',
    borderRadius: '2px',
    background: '#fff',
    padding: '10px 14px',
    outline: 'none',
    width: '100%',
    letterSpacing: '0.02em',
    transition: 'box-shadow 0.15s ease',
  }
  const inputCls = "focus:shadow-[0_0_0_3px_rgba(124,58,237,0.18)]"
  const labelCls = "mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em]"

  return (
    <div
      className="min-h-screen pb-20"
      style={{
        fontFamily: FONT,
        backgroundColor: '#f5efe4',
        backgroundImage: "url('/texture.webp')",
        backgroundSize: '280px 280px',
      }}
    >
      <div
        className={`mx-auto max-w-7xl px-4 md:px-8 ${
          isPromoBannerVisible ? "pt-28 md:pt-32" : "pt-28 md:pt-32"
        }`}
      >
        {/* Breadcrumb */}
        <nav
          className="mb-8 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[10px] font-black uppercase tracking-[0.15em]"
          style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
        >
          <span className="transition-colors hover:text-black cursor-pointer">Cart</span>
          <ChevronRight className="h-3 w-3" />
          <span style={{ color: '#111' }}>Information</span>
          <ChevronRight className="h-3 w-3" />
          <span>Payment</span>
          <ChevronRight className="h-3 w-3" />
          <span>Shipping</span>
        </nav>

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_420px]">
          {/* LEFT COLUMN — Form */}
          <div className="space-y-8">
            {/* Header */}
            <header className="mb-2">
              <h1
                className="text-[2.4rem] font-black uppercase leading-none tracking-tighter md:text-[3.2rem]"
                style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: '-0.03em', color: '#111' }}
              >
                Order{' '}
                <span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Details.
                </span>
              </h1>
              <p
                className="mt-2 text-[9px] font-black uppercase tracking-[0.2em]"
                style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
              >
                Complete your information to finalize the purchase.
              </p>
            </header>

            {/* CONTACT Section */}
            <section
              className="overflow-hidden"
              style={{ border: '4px solid #111', borderRadius: '2px', boxShadow: '6px 6px 0 #111' }}
            >
              {/* Gradient header — like modal */}
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ background: GRADIENT, borderBottom: '4px solid #111' }}
              >
                <ShoppingBag className="h-4 w-4 text-white" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: FONT, fontWeight: 900 }}>
                  Contact
                </h2>
              </div>

              <div
                className="space-y-4 p-5"
                style={{ background: '#f5efe4', backgroundImage: "url('/texture.webp')", backgroundSize: '280px 280px' }}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="checkout-firstName" className={labelCls} style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.45)' }}>
                      First Name <span style={{ color: '#C62828' }}>*</span>
                    </label>
                    <input autoComplete="given-name" id="checkout-firstName" name="firstName" type="text" className={inputCls} style={inputStyle} placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="checkout-lastName" className={labelCls} style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.45)' }}>
                      Last Name <span style={{ color: '#C62828' }}>*</span>
                    </label>
                    <input autoComplete="family-name" id="checkout-lastName" name="lastName" type="text" className={inputCls} style={inputStyle} placeholder="Smith" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="checkout-email" className={labelCls} style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.45)' }}>
                      Email <span style={{ color: '#C62828' }}>*</span>
                    </label>
                    <input id="checkout-email" name="email" type="email" autoComplete="email" required className={inputCls} style={inputStyle} placeholder="you@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => { void syncEmailToProfile(false) }} />
                  </div>
                  <div>
                    <label htmlFor="checkout-phone" className={labelCls} style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.45)' }}>
                      Phone <span style={{ color: 'rgba(0,0,0,0.25)' }}>(optional)</span>
                    </label>
                    <input id="checkout-phone" name="phone" type="tel" autoComplete="tel" className={inputCls} style={inputStyle} placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
              </div>
            </section>

            {/* SHIPPING Section */}
            <section
              className="overflow-hidden"
              style={{ border: '4px solid #111', borderRadius: '2px', boxShadow: '6px 6px 0 #111' }}
            >
              <div
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                style={{ background: GRADIENT, borderBottom: '4px solid #111' }}
              >
                <div className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-white" />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: FONT, fontWeight: 900 }}>
                    Shipping
                  </h2>
                </div>
                {isLoggedIn && addresses.length > 0 && (
                  <select
                    className="cursor-pointer border-2 border-black/40 px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white"
                    style={{ fontFamily: FONT, fontWeight: 900, background: 'rgba(0,0,0,0.25)', borderRadius: '2px' }}
                    aria-label="Saved shipping address" value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id} className="text-black bg-white">{a.city} - {a.address.slice(0, 26)}...</option>
                    ))}
                    <option value="new" className="text-black bg-white">+ New address</option>
                  </select>
                )}
              </div>

              <div
                className="space-y-4 p-5"
                style={{ background: '#f5efe4', backgroundImage: "url('/texture.webp')", backgroundSize: '280px 280px' }}
              >
                <div>
                  <label className={labelCls} style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.45)' }}>
                    Country <span style={{ color: '#C62828' }}>*</span>
                  </label>
                  <p className={inputCls} style={inputStyle}>United States</p>
                  <p className="mt-1.5 text-xs text-black/60">US delivery only. {shippingPolicy ? `Shipping: $${(shippingPolicy.rateCents / 100).toFixed(2)} per order.` : shippingError ? "Shipping is temporarily unavailable." : "Loading shipping rate…"}</p>
                </div>

                <div>
                  <label htmlFor="checkout-address" className={labelCls} style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.45)' }}>
                    Address Line 1 <span style={{ color: '#C62828' }}>*</span>
                  </label>
                  <input autoComplete="address-line1" id="checkout-address" name="address" type="text" className={inputCls} style={inputStyle} placeholder="Street, number, apartment..." value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>

                <div>
                  <label htmlFor="checkout-address2" className={labelCls} style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.45)' }}>
                    Address Line 2 <span style={{ color: 'rgba(0,0,0,0.25)' }}>(optional)</span>
                  </label>
                  <input autoComplete="address-line2" id="checkout-address2" name="address2" type="text" className={inputCls} style={inputStyle} placeholder="Suite, unit, building, floor..." value={address2} onChange={(e) => setAddress2(e.target.value)} />
                </div>

                <div>
                  <label htmlFor="checkout-state" className={labelCls} style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.45)' }}>
                    {country === "US" ? "State" : "State / Province / Region"}
                    {country === "US" && <span style={{ color: '#C62828' }}> *</span>}
                  </label>
                  {country === "US" ? (
                    <select autoComplete="address-level1" id="checkout-state" name="state" className={inputCls} style={inputStyle} value={state} onChange={(e) => setState(e.target.value)}>
                      <option value="">Select state...</option>
                      {US_STATES.map((s) => (<option key={s.code} value={s.code}>{s.name}</option>))}
                    </select>
                  ) : (
                    <input autoComplete="address-level1" id="checkout-state" name="state" type="text" className={inputCls} style={inputStyle} placeholder="State / Province / Region" value={state} onChange={(e) => setState(e.target.value)} />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-city" className={labelCls} style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.45)' }}>
                      City <span style={{ color: '#C62828' }}>*</span>
                    </label>
                    <input autoComplete="address-level2" id="checkout-city" name="city" type="text" className={inputCls} style={inputStyle} placeholder="New York" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="checkout-postalCode" className={labelCls} style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.45)' }}>
                      {country === "US" ? "ZIP Code" : "Postal Code"} <span style={{ color: '#C62828' }}>*</span>
                    </label>
                    <input autoComplete="postal-code" id="checkout-postalCode" name="postalCode"
                      type="text"
                      inputMode="numeric"
                      className={inputCls}
                      style={inputStyle}
                      placeholder={country === "US" ? "10001" : "00000"}
                      value={postalCode}
                      onChange={(e) => {
                        if (country === "US") setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))
                        else setPostalCode(e.target.value.slice(0, 10))
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-notes" className={labelCls} style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.45)' }}>
                    Special instructions
                  </label>
                  <textarea id="checkout-notes" name="notes" rows={2} className={inputCls} style={{ ...inputStyle, resize: 'none' }} placeholder="Door code, floor, neighbor..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                {isLoggedIn && (
                  <button
                    onClick={handleSaveAddress}
                    disabled={!canSaveAddress}
                    className="flex cursor-pointer items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:opacity-80 disabled:opacity-30"
                    style={{ fontFamily: FONT, fontWeight: 900, background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                  >
                    <Save size={13} style={{ color: 'rgb(68,15,195)' }} />
                    {isSavingAddress ? "Saving..." : "Save this address"}
                  </button>
                )}
              </div>
            </section>

            {/* PAYMENT Section */}
            <section
              className="overflow-hidden"
              style={{ border: '4px solid #111', borderRadius: '2px', boxShadow: '6px 6px 0 #111' }}
            >
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ background: GRADIENT, borderBottom: '4px solid #111' }}
              >
                <ShieldCheck className="h-4 w-4 text-white" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: FONT, fontWeight: 900 }}>
                  Payment
                </h2>
              </div>

              <div
                className="space-y-4 p-5"
                style={{ background: '#f5efe4', backgroundImage: "url('/texture.webp')", backgroundSize: '280px 280px' }}
              >
                {stripeConfigured ? (
                  <div
                    className="flex items-center gap-3 border-[3px] border-black px-4 py-3"
                    style={{ background: '#fff', boxShadow: '3px 3px 0 #111', borderRadius: '2px' }}
                  >
                    <div className="h-4 w-4 shrink-0 border-[3px] border-black" style={{ borderRadius: '50%', background: GRADIENT }}>
                      <div className="m-auto mt-[2px] h-1.5 w-1.5 bg-white" style={{ borderRadius: '50%' }} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}>
                      Credit Card
                    </span>
                    <span className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider" style={{ background: '#635BFF', color: '#fff', fontFamily: FONT }}>
                      <svg width="10" height="10" viewBox="0 0 32 32" fill="none"><path d="M14.2 12.6c0-1.1.9-1.5 2.3-1.5 2.1 0 4.7.6 6.8 1.7V7.3C21.1 6.5 18.8 6 16.5 6 11.2 6 7.7 8.7 7.7 13c0 6.5 9 5.5 9 8.3 0 1.3-1.1 1.7-2.6 1.7-2.3 0-5.2-.9-7.5-2.2v5.6c2.6 1.1 5.2 1.6 7.5 1.6 5.4 0 9.2-2.7 9.2-7.1-.1-7-9.1-5.8-9.1-8.3z" fill="white"/></svg>
                      Stripe
                    </span>
                  </div>
                ) : (
                  <div
                    className="flex items-start gap-3 border-[3px] border-black p-4"
                    style={{ background: '#fff', boxShadow: '3px 3px 0 #111', borderRadius: '2px' }}
                  >
                    <div className="mt-0.5 h-4 w-4 shrink-0 border-[3px] border-black bg-white" style={{ borderRadius: '50%' }}>
                      <div className="m-auto mt-[2px] h-1.5 w-1.5 bg-black" style={{ borderRadius: '50%' }} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}>Payments unavailable</span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.4)' }}>
                        Card checkout is temporarily unavailable. Please try again later.
                      </span>
                    </div>
                  </div>
                )}

                {/* Security note */}
                <div className="flex items-center gap-2">
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M6 0L0 2.5v4C0 9.9 2.6 13 6 14c3.4-1 6-4.1 6-7.5v-4L6 0z" fill="rgba(0,0,0,0.2)"/></svg>
                  <span className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.35)' }}>
                    Card payments are processed by Stripe
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN — Order Summary */}
          <aside
            className="lg:sticky space-y-5 transition-[top] duration-300"
            style={{
              top: isNavbarVisible
                ? isPromoBannerVisible ? '8rem' : '7rem'
                : '1rem',
            }}
          >
            <div
              className="overflow-hidden"
              style={{ border: '4px solid #111', borderRadius: '2px', boxShadow: '6px 6px 0 #111' }}
            >
              {/* Gradient header — like modal left panel */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ background: GRADIENT, borderBottom: '4px solid #111' }}
              >
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: FONT, fontWeight: 900 }}>
                  Your Order
                </h3>
                <span
                  className="border-[2px] border-white/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-white"
                  style={{ fontFamily: FONT, fontWeight: 900, borderRadius: '2px' }}
                >
                  {cartItems.length} item{cartItems.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Cart items */}
              <div
                className="max-h-[360px] divide-y divide-black/10 overflow-y-auto px-4 py-4"
                style={{ background: '#f5efe4', backgroundImage: "url('/texture.webp')", backgroundSize: '280px 280px' }}
              >
                {cartItems.map((item) => (
                  <div key={item.id} className="group flex gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden border-[3px] border-black">
                      {item.product?.images?.[0] && (
                        <Image src={pbFileUrl(item.product.id, item.product.images[0])} alt={item.product.name} fill className="object-cover" />
                      )}
                      <button
                        aria-label={`Remove ${item.product?.name ?? "product"} from bag`} onClick={() => handleRemoveItem(item.id)}
                        className="absolute left-0.5 top-0.5 border-[2px] border-black bg-white p-0.5 opacity-100 transition-opacity"
                      >
                        <X size={9} />
                      </button>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <h4 className="truncate text-[11px] font-black uppercase tracking-tight" style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}>
                        {item.product?.name}
                      </h4>
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center overflow-hidden rounded-sm border-[3px] border-black bg-white">
                          <button
                            aria-label="Decrease quantity" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center text-sm font-black transition-all hover:[background:linear-gradient(135deg,rgb(68,15,195)_0%,rgb(158,38,182)_50%,rgb(232,68,106)_100%)] hover:text-white"
                            style={{ fontFamily: FONT, fontWeight: 900 }}
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-xs font-black" style={{ fontFamily: FONT, fontWeight: 900 }}>{item.quantity}</span>
                          <button
                            aria-label="Increase quantity" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center text-sm font-black transition-all hover:[background:linear-gradient(135deg,rgb(68,15,195)_0%,rgb(158,38,182)_50%,rgb(232,68,106)_100%)] hover:text-white"
                            style={{ fontFamily: FONT, fontWeight: 900 }}
                          >
                            +
                          </button>
                        </div>
                        <span
                          className="text-sm font-black"
                          style={{ fontFamily: FONT, fontWeight: 900, background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                        >
                          ${(getUnitPrice(item.product) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t-[3px] border-black px-5 py-4" style={{ background: 'rgba(245,239,228,0.7)' }}>
                <div className="flex justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}>Subtotal</span>
                  <span className="text-sm font-black" style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}>${cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}>Shipping</span>
                  <span className="text-sm font-black" style={{ fontFamily: FONT, fontWeight: 900, color: '#2E7D32' }}>
                    {shippingPolicy ? `+$${shipping.toFixed(2)}` : shippingError ? "Unavailable" : "Loading…"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}>Sales tax</span>
                  <span className="text-right text-[10px] font-black uppercase" style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.55)' }}>Calculated by Stripe</span>
                </div>
                <div className="flex items-end justify-between border-t-[2px] border-black/10 pt-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}>Before tax</span>
                  <span
                    className="text-2xl font-black tracking-tighter"
                    style={{ fontFamily: FONT, fontWeight: 900, background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                  >
                    {shippingPolicy ? `$${cartTotal.toFixed(2)}` : "—"}
                  </span>
                </div>
              </div>

              {storeSettings.firstOrderDiscountEnabled && <p className="px-5 pb-4 text-sm text-black">
                Eligible verified accounts receive {storeSettings.firstOrderDiscountPercent}% off regular-price items on their first paid order. Any eligible discount is applied on the payment page; the estimate above is before this offer.
              </p>}
              <p className="px-5 pb-4 text-sm text-black"><Link href="/policies/terms" className="underline">Terms of sale</Link> · <Link href="/policies/returns" className="underline">Returns</Link> · <Link href="/policies/privacy" className="underline">Privacy</Link></p>
              {shippingError && <div role="alert" className="px-5 pb-4 text-sm text-red-700">
                <p>{shippingError}</p>
                <button type="button" onClick={() => void loadShipping()} className="mt-2 font-semibold underline">Retry shipping rate</button>
              </div>}

              {/* Confirm button */}
              <div className="px-5 pb-5">
                <button
                  disabled={!stripeConfigured || isPlacingOrder || !shippingPolicy || cartItems.length === 0 || !isRequiredFieldsValid}
                  onClick={handleConfirmOrder}
                  className="relative w-full cursor-pointer border-[3px] border-black py-3.5 text-sm font-black uppercase italic tracking-[0.1em] text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#111] disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ fontFamily: FONT, fontWeight: 900, background: GRADIENT, boxShadow: '3px 3px 0 #111', borderRadius: '2px' }}
                >
                  {isPlacingOrder ? "Processing..." : stripeConfigured ? "Pay with Stripe →" : "Payments unavailable"}
                </button>
                <p className="mt-2.5 text-center text-[9px] font-black uppercase tracking-[0.15em]" style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.3)' }}>
                  *Taxes are calculated at checkout*
                </p>
              </div>
            </div>

            {orderError && (
              <div
                className="overflow-hidden"
                style={{ border: '4px solid #C62828', borderRadius: '2px', boxShadow: '4px 4px 0 #C62828' }}
              >
                <div
                  className="px-4 py-3"
                  style={{ background: 'rgba(198,40,40,0.9)', borderBottom: '3px solid #C62828' }}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: FONT, fontWeight: 900 }}>Attention required</p>
                </div>
                <div className="px-4 py-3" style={{ background: '#fff' }}>
                  <p className="text-xs font-bold" style={{ fontFamily: FONT, color: '#111' }}>{orderError}</p>
                </div>
              </div>
            )}
          </aside>
        </div>

      </div>

      {/* Order flow overlay */}
      {orderFlowStage !== "idle" && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-[90%] max-w-xs overflow-hidden"
            style={{ border: '4px solid #111', borderRadius: '2px', boxShadow: '8px 8px 0 #111' }}
          >
            {/* Gradient header strip */}
            <div className="px-5 py-3" style={{ background: GRADIENT, borderBottom: '4px solid #111' }}>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/80" style={{ fontFamily: FONT }}>
                {orderFlowStage === "loading" ? "Processing order" : "Order confirmed"}
              </p>
            </div>
            {/* Body */}
            <div
              className="flex flex-col items-center px-6 py-8 text-center"
              style={{ background: '#f5efe4', backgroundImage: "url('/texture.webp')", backgroundSize: '280px 280px' }}
            >
              {orderFlowStage === "loading" ? (
                <>
                  <div
                    className="flex h-14 w-14 items-center justify-center border-[3px] border-black text-white"
                    style={{ background: GRADIENT, boxShadow: '3px 3px 0 #111', borderRadius: '2px' }}
                  >
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                  <h4 className="mt-4 text-base font-black uppercase tracking-tight" style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}>
                    Processing...
                  </h4>
                  <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.2em]" style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}>
                    Please wait a moment
                  </p>
                </>
              ) : (
                <>
                  <div
                    className="flex h-14 w-14 items-center justify-center border-[3px] border-black"
                    style={{ background: '#E8F5E9', boxShadow: '3px 3px 0 #111', borderRadius: '2px' }}
                  >
                    <CheckCircle2 className="h-7 w-7" style={{ color: '#2E7D32' }} />
                  </div>
                  <h4 className="mt-4 text-base font-black uppercase tracking-tight" style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}>
                    Order Confirmed
                  </h4>
                  <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.2em]" style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}>
                    Redirecting...
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
