"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  CreditCard,
  Save,
  X,
  ChevronRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
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
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"
const GUEST_CART_KEY = "guest_cart"
const SIGNUP_PROMO_DISMISSED_KEY = "signup_promo_dismissed_v1"
const DEFAULT_CURRENCY = "USD"

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PT", name: "Portugal" },
  { code: "IE", name: "Ireland" },
  { code: "AT", name: "Austria" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "HU", name: "Hungary" },
  { code: "RO", name: "Romania" },
  { code: "GR", name: "Greece" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "HK", name: "Hong Kong" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "TH", name: "Thailand" },
  { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "TR", name: "Turkey" },
  { code: "IL", name: "Israel" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "TN", name: "Tunisia" },
  { code: "DZ", name: "Algeria" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "GH", name: "Ghana" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "NZ", name: "New Zealand" },
] as const

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const buyNow = searchParams.get("buyNow") === "1"
  const buyNowProductId = searchParams.get("productId")
  const buyNowQty = Math.max(1, Number(searchParams.get("qty") ?? "1") || 1)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [profileEmail, setProfileEmail] = useState("")

  const [country, setCountry] = useState("")
  const [address, setAddress] = useState("")
  const [address2, setAddress2] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [notes, setNotes] = useState("")

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
    setIsPromoBannerVisible(!isLoggedIn && !isDismissed)
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) {
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
    setAddress(selected.address || "")
    setAddress2(selected.address2 || "")
    setCity(selected.city || "")
    setPostalCode(selected.postalCode || "")
    setNotes(selected.notes || "")
    setCountry(selected.country || "")
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
  const shipping = cartItems.length > 0 ? (country === "US" ? 5 : country ? 20 : 0) : 0
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
        address.trim() &&
        city.trim() &&
        country.trim()
      ),
    [firstName, lastName, address, city, country]
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

    if (!firstName.trim() || !lastName.trim()) {
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
        country: country.trim(),
        address: address.trim(),
        address2: address2.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        notes: notes.trim(),
        shipping,
        items: itemsPayload,
        total: cartTotal,
        currency: cartCurrency,
      }

      const orderRes = await fetch("/api/shop/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      })
      const orderData = await orderRes.json().catch(() => ({}))
      if (!orderRes.ok) {
        throw new Error(orderData?.message || "Checkout failed. Please try again.")
      }

      // Stripe redirect
      if (typeof orderData?.url === "string" && orderData.url) {
        if (!buyNow) {
          if (isLoggedIn) {
            await Promise.allSettled(
              cartItems
                .filter((it) => it.source === "pb")
                .map((it) =>
                  fetch(`/api/shop/cart?itemId=${encodeURIComponent(it.id)}`, { method: "DELETE" })
                )
            )
          } else {
            setGuestCart([])
          }
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cart:updated"))
        }
        window.location.href = orderData.url
        return
      }

      // Test mode
      const createdOrderId = typeof orderData?.orderId === "string" ? orderData.orderId : ""

      if (!buyNow) {
        if (isLoggedIn) {
          await Promise.allSettled(
            cartItems
              .filter((it) => it.source === "pb")
              .map((it) =>
                fetch(`/api/shop/cart?itemId=${encodeURIComponent(it.id)}`, { method: "DELETE" })
              )
          )
        } else {
          setGuestCart([])
        }
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart:updated"))
      }

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
    fontWeight: 900,
    fontSize: '13px',
    border: '3px solid #111',
    background: '#fff',
    padding: '12px 16px',
    outline: 'none',
    width: '100%',
    letterSpacing: '0.02em',
  }

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
                className="text-[2.2rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[3rem]"
                style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: '-0.03em', color: '#111' }}
              >
                Order{' '}
                <span
                  style={{
                    background: GRADIENT,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Details.
                </span>
              </h1>
              <p
                className="mt-3 text-xs font-black uppercase tracking-[0.15em]"
                style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
              >
                Complete your information to finalize the purchase.
              </p>
            </header>

            {/* CONTACT Section */}
            <section
              className="overflow-hidden bg-white"
              style={{
                border: '4px solid #111',
                borderRadius: '2px',
                boxShadow: '8px 8px 0 #111',
              }}
            >
              <div
                className="flex items-center gap-3 border-b-3 border-black p-5"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center border-2 border-black text-white"
                  style={{ background: GRADIENT, boxShadow: '2px 2px 0 #111' }}
                >
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <h2
                  className="text-base font-black uppercase tracking-tight"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                >
                  Contact
                </h2>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label
                      className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.15em]"
                      style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}
                    >
                      First Name <span style={{ color: '#C62828' }}>*</span>
                    </label>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.15em]"
                      style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}
                    >
                      Last Name <span style={{ color: '#C62828' }}>*</span>
                    </label>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="Smith"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.15em]"
                    style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    style={inputStyle}
                    placeholder="john.smith@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => { void syncEmailToProfile(false) }}
                  />
                </div>
              </div>
            </section>

            {/* SHIPPING Section */}
            <section
              className="overflow-hidden bg-white"
              style={{
                border: '4px solid #111',
                borderRadius: '2px',
                boxShadow: '8px 8px 0 #111',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-3 border-black p-5">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center border-2 border-black text-white"
                    style={{ background: GRADIENT, boxShadow: '2px 2px 0 #111' }}
                  >
                    <Truck className="h-5 w-5" />
                  </div>
                  <h2
                    className="text-base font-black uppercase tracking-tight"
                    style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                  >
                    Shipping
                  </h2>
                </div>

                {isLoggedIn && addresses.length > 0 && (
                  <select
                    className="cursor-pointer border-2 border-black px-3 py-1.5 text-[10px] font-black uppercase tracking-wider"
                    style={{
                      fontFamily: FONT,
                      fontWeight: 900,
                      background: '#fff',
                      boxShadow: '2px 2px 0 #111',
                    }}
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>{a.city} - {a.address.slice(0, 26)}...</option>
                    ))}
                    <option value="new">+ New address</option>
                  </select>
                )}
              </div>

              <div className="space-y-5 p-5">
                {/* Country selector FIRST */}
                <div>
                  <label
                    className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.15em]"
                    style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}
                  >
                    Country <span style={{ color: '#C62828' }}>*</span>
                  </label>
                  <select
                    style={inputStyle}
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value)
                      setState("")
                    }}
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  {country && (
                    <p
                      className="mt-1.5 text-[10px] font-black uppercase tracking-wider"
                      style={{ fontFamily: FONT, fontWeight: 900, color: country === "US" ? '#2E7D32' : 'rgba(0,0,0,0.4)' }}
                    >
                      {country === "US" ? "Shipping: $5.00" : "International shipping: $20.00"}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.15em]"
                    style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}
                  >
                    Address Line 1 <span style={{ color: '#C62828' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="Street, number, apartment..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.15em]"
                    style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}
                  >
                    Address Line 2 <span style={{ color: 'rgba(0,0,0,0.25)' }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="Suite, unit, building, floor..."
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label
                      className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.15em]"
                      style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}
                    >
                      City <span style={{ color: '#C62828' }}>*</span>
                    </label>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="New York"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.15em]"
                      style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}
                    >
                      {country === "US" ? "ZIP Code" : "Postal Code"} <span style={{ color: '#C62828' }}>*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      style={inputStyle}
                      placeholder={country === "US" ? "10001" : "00000"}
                      value={postalCode}
                      onChange={(e) => {
                        if (country === "US") {
                          setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))
                        } else {
                          setPostalCode(e.target.value.slice(0, 10))
                        }
                      }}
                    />
                  </div>
                </div>

                {/* State — dropdown for US, text for others */}
                <div>
                  <label
                    className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.15em]"
                    style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}
                  >
                    {country === "US" ? "State" : "State / Province / Region"}
                    {country === "US" && <span style={{ color: '#C62828' }}> *</span>}
                  </label>
                  {country === "US" ? (
                    <select
                      style={inputStyle}
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    >
                      <option value="">Select state...</option>
                      {US_STATES.map((s) => (
                        <option key={s.code} value={s.code}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="State / Province / Region"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.15em]"
                    style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}
                  >
                    Special instructions
                  </label>
                  <textarea
                    rows={2}
                    style={{ ...inputStyle, resize: 'none' }}
                    placeholder="Door code, floor, neighbor..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {isLoggedIn && (
                  <button
                    onClick={handleSaveAddress}
                    disabled={!canSaveAddress}
                    className="flex cursor-pointer items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:opacity-80 disabled:opacity-30"
                    style={{
                      fontFamily: FONT,
                      fontWeight: 900,
                      background: GRADIENT,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    <Save size={14} style={{ color: 'rgb(124,58,237)' }} />
                    {isSavingAddress ? "Saving..." : "Save this address"}
                  </button>
                )}
              </div>
            </section>

            {/* PAYMENT Section */}
            <section
              className="overflow-hidden bg-white"
              style={{
                border: '4px solid #111',
                borderRadius: '2px',
                boxShadow: '8px 8px 0 #111',
              }}
            >
              <div className="flex items-center gap-3 border-b-3 border-black p-5">
                <div
                  className="flex h-10 w-10 items-center justify-center border-2 border-black text-white"
                  style={{ background: GRADIENT, boxShadow: '2px 2px 0 #111' }}
                >
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2
                  className="text-base font-black uppercase tracking-tight"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                >
                  Payment
                </h2>
              </div>

              <div className="space-y-3 p-5">
                {stripeConfigured ? (
                  <div
                    className="flex items-center gap-3 border-3 border-black p-4"
                    style={{ background: '#EDE7F6', boxShadow: '3px 3px 0 #111' }}
                  >
                    <div className="h-5 w-5 border-4 border-black bg-white" style={{ borderRadius: '50%' }}>
                      <div className="m-auto mt-[1px] h-2 w-2 bg-black" style={{ borderRadius: '50%' }} />
                    </div>
                    <span
                      className="text-xs font-black uppercase tracking-wider"
                      style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                    >
                      Card Payment (Stripe)
                    </span>
                    <CreditCard size={16} className="ml-auto" />
                  </div>
                ) : (
                  <>
                    <div
                      className="flex items-center gap-3 border-3 border-black p-4"
                      style={{ background: '#FFF8E1', boxShadow: '3px 3px 0 #111' }}
                    >
                      <div className="h-5 w-5 border-4 border-black bg-white" style={{ borderRadius: '50%' }}>
                        <div className="m-auto mt-[1px] h-2 w-2 bg-black" style={{ borderRadius: '50%' }} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="text-xs font-black uppercase tracking-wider"
                          style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                        >
                          Test Mode
                        </span>
                        <span
                          className="text-[10px] font-bold"
                          style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.45)' }}
                        >
                          No payment processor configured. Orders will be placed in test mode.
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN — Order Summary */}
          <aside className={`lg:sticky ${isPromoBannerVisible ? "lg:top-32" : "lg:top-28"} space-y-6`}>
            <div
              className="overflow-hidden bg-white"
              style={{
                border: '4px solid #111',
                borderRadius: '2px',
                boxShadow: '8px 8px 0 #111',
              }}
            >
              {/* Summary header */}
              <div className="flex items-center justify-between border-b-3 border-black p-5">
                <h3
                  className="text-base font-black uppercase tracking-tight"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                >
                  Summary
                </h3>
                <span
                  className="border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                  style={{ fontFamily: FONT, fontWeight: 900, background: GRADIENT, boxShadow: '2px 2px 0 #111' }}
                >
                  {cartItems.length} item{cartItems.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Cart items */}
              <div className="max-h-[400px] divide-y-2 divide-black/10 overflow-y-auto p-5">
                {cartItems.map((item) => (
                  <div key={item.id} className="group flex gap-4 py-3 first:pt-0 last:pb-0">
                    <div
                      className="relative h-20 w-20 flex-shrink-0 overflow-hidden border-2 border-black"
                      style={{ boxShadow: '3px 3px 0 #111' }}
                    >
                      {item.product?.images?.[0] && (
                        <Image
                          src={pbFileUrl(item.product.id, item.product.images[0])}
                          alt={item.product.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="absolute left-1 top-1 border-2 border-black bg-white p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X size={10} />
                      </button>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <h4
                        className="truncate text-sm font-black uppercase tracking-tight"
                        style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                      >
                        {item.product?.name}
                      </h4>
                      <p
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.35)' }}
                      >
                        Qty: {item.quantity}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <div
                          className="flex items-center border-2 border-black"
                          style={{ boxShadow: '2px 2px 0 #111' }}
                        >
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="cursor-pointer px-2 py-1 transition-colors hover:bg-black/5"
                          >
                            <Minus size={12} />
                          </button>
                          <span
                            className="w-6 text-center text-xs font-black"
                            style={{ fontFamily: FONT, fontWeight: 900 }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="cursor-pointer px-2 py-1 transition-colors hover:bg-black/5"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span
                          className="text-sm font-black"
                          style={{
                            fontFamily: FONT,
                            fontWeight: 900,
                            background: GRADIENT,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          ${(getUnitPrice(item.product) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t-3 border-black p-5" style={{ background: 'rgba(0,0,0,0.02)' }}>
                <div className="flex justify-between">
                  <span
                    className="text-[10px] font-black uppercase tracking-wider"
                    style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
                  >
                    Subtotal
                  </span>
                  <span
                    className="text-sm font-black"
                    style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                  >
                    ${cartSubtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className="text-[10px] font-black uppercase tracking-wider"
                    style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
                  >
                    Shipping
                  </span>
                  <span
                    className="text-sm font-black"
                    style={{ fontFamily: FONT, fontWeight: 900, color: '#2E7D32' }}
                  >
                    {country ? `+$${shipping.toFixed(2)}` : "Select country"}
                  </span>
                </div>
                <div className="flex items-end justify-between border-t-2 border-black/10 pt-3">
                  <span
                    className="text-sm font-black uppercase"
                    style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                  >
                    Total
                  </span>
                  <span
                    className="text-2xl font-black tracking-tighter"
                    style={{
                      fontFamily: FONT,
                      fontWeight: 900,
                      background: GRADIENT,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Confirm button */}
              <div className="p-5 pt-0">
                <button
                  disabled={isPlacingOrder || cartItems.length === 0 || !isRequiredFieldsValid}
                  onClick={handleConfirmOrder}
                  className="shimmer-btn relative w-full cursor-pointer overflow-hidden border-3 border-black py-4 text-sm font-black uppercase tracking-[0.12em] text-white transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    background: GRADIENT,
                    boxShadow: '4px 4px 0 #111',
                  }}
                >
                  {isPlacingOrder
                    ? "Processing..."
                    : stripeConfigured
                    ? "Pay with Stripe \u2192"
                    : "Place Test Order \u2192"}
                </button>
              </div>
            </div>

            {orderError && (
              <div
                className="overflow-hidden bg-white"
                style={{
                  border: '4px solid #C62828',
                  borderRadius: '2px',
                  boxShadow: '6px 6px 0 #C62828',
                }}
              >
                <div className="flex items-start gap-3 p-4">
                  <div
                    className="mt-0.5 h-3 w-3 flex-shrink-0 border-2 border-[#C62828]"
                    style={{ background: '#FFEBEE' }}
                  />
                  <div>
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.15em]"
                      style={{ fontFamily: FONT, fontWeight: 900, color: '#C62828' }}
                    >
                      Attention required
                    </p>
                    <p
                      className="mt-1 text-xs font-bold"
                      style={{ fontFamily: FONT, color: '#111' }}
                    >
                      {orderError}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Order flow overlay */}
      {orderFlowStage !== "idle" && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div
            className="w-[90%] max-w-sm bg-white p-8"
            style={{
              border: '4px solid #111',
              boxShadow: '12px 12px 0 #111',
            }}
          >
            <div className="flex flex-col items-center text-center">
              {orderFlowStage === "loading" ? (
                <>
                  <div
                    className="flex h-16 w-16 items-center justify-center border-3 border-black text-white"
                    style={{ background: GRADIENT, boxShadow: '4px 4px 0 #111' }}
                  >
                    <Loader2 className="h-7 w-7 animate-spin" />
                  </div>
                  <h4
                    className="mt-5 text-lg font-black uppercase tracking-tight"
                    style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                  >
                    Processing...
                  </h4>
                  <p
                    className="mt-2 text-[10px] font-black uppercase tracking-wider"
                    style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
                  >
                    Please wait a moment
                  </p>
                </>
              ) : (
                <>
                  <div
                    className="flex h-16 w-16 items-center justify-center border-3 border-black"
                    style={{ background: '#E8F5E9', boxShadow: '4px 4px 0 #111' }}
                  >
                    <CheckCircle2 className="h-8 w-8" style={{ color: '#2E7D32' }} />
                  </div>
                  <h4
                    className="mt-5 text-lg font-black uppercase tracking-tight"
                    style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                  >
                    Order Confirmed
                  </h4>
                  <p
                    className="mt-2 text-[10px] font-black uppercase tracking-wider"
                    style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
                  >
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
