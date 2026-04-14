// components/navbar.tsx
"use client"

import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { NavbarCart } from "@/components/navbar-cart"
import { MegaMenu } from "@/components/mega-menu"
import {
  ShoppingBag,
  CircleUser,
  Menu,
  X,
  ChevronRight,
  ClipboardList,
  SlidersHorizontal,
  LogOut,
  Globe,
} from "lucide-react"

type Category = {
  id: string
  name: string
  slug: string
  order?: number
  parent?: string | string[] | null
  description?: string | null
}

interface NavbarProps {
  categories?: Category[]
  reserveSpace?: boolean
}

type AuthUser = {
  id: string
  surname?: string
  name?: string
  email?: string
  role?: string
}

const LANGUAGE_OPTIONS = [
  { code: "EN", label: "English" },
  { code: "FR", label: "French" },
  { code: "AR", label: "Arabic" },
  { code: "ES", label: "Spanish" },
]

function resolveRedirectPath(path?: string | null): string | null {
  if (!path) return null
  if (!path.startsWith("/")) return null
  if (path.startsWith("//")) return null
  try {
    const decoded = decodeURIComponent(path).toLowerCase().replace(/\\/g, "/")
    if (decoded.startsWith("//")) return null
    if (decoded.includes("javascript:") || decoded.includes("data:") || decoded.includes("vbscript:")) return null
  } catch {
    return null
  }
  return path
}

function compareCategoryOrder(a: Category, b: Category) {
  const aOrder = typeof a.order === "number" && Number.isFinite(a.order) ? a.order : 0
  const bOrder = typeof b.order === "number" && Number.isFinite(b.order) ? b.order : 0
  if (aOrder !== bOrder) return aOrder - bOrder
  return a.name.localeCompare(b.name)
}


export function Navbar(props: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const categoriesProp = props.categories ?? []
  const reserveSpace = props.reserveSpace ?? false

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false)
  const megaMenuTimeoutRef = useRef<number | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  )

  // Mobile panel state
  const [mobileShopOpen, setMobileShopOpen] = useState(false)
  const [mobileActiveCat, setMobileActiveCat] = useState<string | null>(null)
  const [mobileProducts, setMobileProducts] = useState<Record<string, { id: string; slug: string; name: string; imageUrls: string[]; price: number; promoPrice?: number | null }[]>>({})
  const [mobileLoadingCat, setMobileLoadingCat] = useState<string | null>(null)

  useEffect(() => {
    if (!isMenuOpen) {
      setMobileShopOpen(false)
      setMobileActiveCat(null)
    }
  }, [isMenuOpen])
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [language, setLanguage] = useState("EN")

  // internal categories state (from props OR fetched)
  const [internalCategories, setInternalCategories] =
    useState<Category[]>(categoriesProp)

  const desktopLangRef = useRef<HTMLDivElement | null>(null)
  const mobileLangRef = useRef<HTMLDivElement | null>(null)

  // profile dropdown state (desktop)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // profile dropdown positioning
  const [profileShiftX, setProfileShiftX] = useState(0)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const profileRootRef = useRef<HTMLDivElement | null>(null)

  // auth user (PocketBase)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isAuthResolved, setIsAuthResolved] = useState(false)

  const [showSignupPromo, setShowSignupPromo] = useState(true)
  const [hasPassedPromoBanner, setHasPassedPromoBanner] = useState(false)
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true)
  const [isCartPanelOpen, setIsCartPanelOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">("login")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [authFieldErrors, setAuthFieldErrors] = useState<Record<string, string>>({})
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotSent, setForgotSent] = useState(false)
  const authForgotPanelRef = useRef<HTMLDivElement | null>(null)
  const [signupSurname, setSignupSurname] = useState("")
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("")
  const [postLoginRedirect, setPostLoginRedirect] = useState<string | null>(null)
  const [authPanelHeight, setAuthPanelHeight] = useState<number | null>(null)
  const authLoginPanelRef = useRef<HTMLDivElement | null>(null)
  const authSignupPanelRef = useRef<HTMLDivElement | null>(null)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    window.dispatchEvent(new Event("signup-promo:visibility-change"))
  }, [])

  // Close mega menu on route change
  useEffect(() => {
    setIsDesktopMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    const authParam = params.get("auth")
    const authErrorParam = params.get("auth_error")

    if (authErrorParam) {
      const errorMessages: Record<string, string> = {
        google_not_configured: "Google sign-in is not configured yet. Please contact the admin.",
        oauth_init_failed: "Could not initiate Google sign-in. Please try again.",
        oauth_missing_params: "Google sign-in failed. Please try again.",
        oauth_state_mismatch: "Google sign-in failed (security check). Please try again.",
        oauth_no_record: "Google sign-in failed. No account found.",
        oauth_failed: "Google sign-in failed. Please try again.",
      }
      setAuthError(errorMessages[authErrorParam] ?? "Sign-in failed. Please try again.")
      setAuthMode("login")
      setIsAuthModalOpen(true)
      setIsProfileOpen(false)
      setIsMenuOpen(false)
      const url = new URL(window.location.href)
      url.searchParams.delete("auth_error")
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
      return
    }

    if (authParam !== "login" && authParam !== "signup") return

    const nextParam = resolveRedirectPath(params.get("next"))
    setPostLoginRedirect(nextParam)
    setAuthMode(authParam)
    setIsAuthModalOpen(true)
    setIsProfileOpen(false)
    setIsMenuOpen(false)
    setAuthError("")
    setAuthFieldErrors({})
    setAuthPassword("")

    const url = new URL(window.location.href)
    url.searchParams.delete("auth")
    url.searchParams.delete("next")
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
  }, [pathname])

  useEffect(() => {
    if (!isAuthModalOpen) return

    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAuthModalOpen(false)
        setAuthError("")
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isAuthModalOpen])

  useLayoutEffect(() => {
    if (!isAuthModalOpen) {
      setAuthPanelHeight(null)
      return
    }

    const activePanel =
      authMode === "login" ? authLoginPanelRef.current :
      authMode === "signup" ? authSignupPanelRef.current :
      authForgotPanelRef.current

    if (activePanel) {
      setAuthPanelHeight(activePanel.scrollHeight)
    }
  }, [isAuthModalOpen, authMode, authError, isAuthSubmitting])

  useEffect(() => {
    if (!isAuthModalOpen) return

    const updateHeight = () => {
      const activePanel =
        authMode === "login" ? authLoginPanelRef.current :
        authMode === "signup" ? authSignupPanelRef.current :
        authForgotPanelRef.current
      if (activePanel) {
        setAuthPanelHeight(activePanel.scrollHeight)
      }
    }

    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [isAuthModalOpen, authMode])

  useEffect(() => {
    const onScroll = () => {
      // Promo banner height is h-10 (2.5rem = 40px)
      setHasPassedPromoBanner(window.scrollY >= 40)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const email = (e as CustomEvent<{ email: string }>).detail?.email ?? ""
      setSignupEmail(email)
      openAuthModal(null, "signup")
    }
    window.addEventListener("open-signup-modal", handler)
    return () => window.removeEventListener("open-signup-modal", handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const scrollThreshold = 8

    const updateMobileNavVisibility = () => {
      const currentScrollY = window.scrollY

      if (
        isMenuOpen ||
        isProfileOpen ||
        isCartPanelOpen ||
        isAuthModalOpen ||
        isLangOpen
      ) {
        setIsMobileNavVisible(true)
        lastScrollYRef.current = currentScrollY
        return
      }

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

    lastScrollYRef.current = window.scrollY
    updateMobileNavVisibility()

    window.addEventListener("scroll", updateMobileNavVisibility, { passive: true })
    window.addEventListener("resize", updateMobileNavVisibility)
    return () => {
      window.removeEventListener("scroll", updateMobileNavVisibility)
      window.removeEventListener("resize", updateMobileNavVisibility)
    }
  }, [
    isMenuOpen,
    isProfileOpen,
    isCartPanelOpen,
    isAuthModalOpen,
    isLangOpen,
  ])

  const closeSignupPromo = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("signup-promo:visibility-change"))
    }
    setShowSignupPromo(false)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // ignore server logout errors and still clear client state
    }

    setCurrentUser(null)
    setIsProfileOpen(false)
    router.push("/")
  }

  const openAuthModal = (
    redirectTo?: string | null,
    mode: "login" | "signup" = "login"
  ) => {
    setAuthError("")
    setAuthFieldErrors({})
    setAuthMode(mode)
    if (mode === "login") {
      setAuthPassword("")
    } else {
      setSignupPassword("")
      setSignupPasswordConfirm("")
    }
    setPostLoginRedirect(resolveRedirectPath(redirectTo ?? null))
    setIsAuthModalOpen(true)
    setIsProfileOpen(false)
    setIsMenuOpen(false)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
    setAuthPassword("")
    setSignupPassword("")
    setSignupPasswordConfirm("")
    setAuthError("")
    setAuthFieldErrors({})
    setAuthMode("login")
    setForgotSent(false)
    setForgotEmail("")
  }

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isAuthSubmitting) return
    setAuthError("")
    setAuthFieldErrors({})
    setIsAuthSubmitting(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAuthError(data?.message ?? "Impossible d'envoyer l'email.")
        return
      }
      setForgotSent(true)
    } catch {
      setAuthError("Une erreur est survenue.")
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  const switchAuthMode = (mode: "login" | "signup" | "forgot") => {
    setAuthMode(mode)
    setAuthError("")
    setAuthFieldErrors({})
    if (mode === "forgot") {
      setForgotSent(false)
      return
    }
    if (mode === "login") {
      if (!authEmail && signupEmail) {
        setAuthEmail(signupEmail)
      }
      setAuthPassword("")
      return
    }
    if (!signupEmail && authEmail.includes("@")) {
      setSignupEmail(authEmail)
    }
    setSignupPassword("")
    setSignupPasswordConfirm("")
  }

  const handleAuthLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isAuthSubmitting) return

    setAuthError("")
    setAuthFieldErrors({})
    setIsAuthSubmitting(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: authEmail.trim(),
          password: authPassword,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAuthError(data?.message ?? "Sign-in failed.")
        if (data?.fieldErrors && typeof data.fieldErrors === "object") {
          setAuthFieldErrors(data.fieldErrors)
        }
        return
      }

      setCurrentUser((data?.user as AuthUser) ?? null)
      closeAuthModal()
      router.refresh()

      const safeRedirect = resolveRedirectPath(postLoginRedirect)
      if (safeRedirect) {
        router.push(safeRedirect)
        return
      }

      if ((data?.user as AuthUser | undefined)?.role === "admin") {
        router.push("/admin/products")
      }
    } catch {
      setAuthError("Something went wrong.")
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  const handleAuthSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isAuthSubmitting) return

    setAuthError("")
    setAuthFieldErrors({})
    setIsAuthSubmitting(true)

    try {
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail.trim(),
          password: signupPassword,
          passwordConfirm: signupPasswordConfirm,
          surname: signupSurname.trim(),
          name: signupName.trim(),
        }),
      })

      const registerData = await registerRes.json().catch(() => ({}))
      if (!registerRes.ok) {
        setAuthError(registerData?.message ?? "Sign-up failed.")
        if (registerData?.fieldErrors && typeof registerData.fieldErrors === "object") {
          setAuthFieldErrors(registerData.fieldErrors)
        }
        return
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: signupEmail.trim(),
          password: signupPassword,
        }),
      })

      const loginData = await loginRes.json().catch(() => ({}))
      if (!loginRes.ok) {
        setAuthError("Account created. Sign in with your credentials.")
        switchAuthMode("login")
        setAuthEmail(signupEmail.trim())
        return
      }

      setCurrentUser((loginData?.user as AuthUser) ?? null)
      closeAuthModal()
      router.refresh()

      const safeRedirect = resolveRedirectPath(postLoginRedirect)
      if (safeRedirect) {
        router.push(safeRedirect)
        return
      }

      if ((loginData?.user as AuthUser | undefined)?.role === "admin") {
        router.push("/admin/products")
      }
    } catch {
      setAuthError("Une erreur est survenue.")
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  // read auth session on mount
  useEffect(() => {
    let cancelled = false

    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" })
        if (!res.ok) {
          if (!cancelled) setCurrentUser(null)
          return
        }

        const data = await res.json()
        if (!cancelled) {
          setCurrentUser((data?.user as AuthUser) ?? null)
        }
      } catch {
        if (!cancelled) setCurrentUser(null)
      } finally {
        if (!cancelled) setIsAuthResolved(true)
      }
    }

    loadSession()
    return () => {
      cancelled = true
    }
  }, [])

  // sync props -> state & fetch once if no categories were passed
  useEffect(() => {
    if (categoriesProp.length > 0) {
      setInternalCategories(categoriesProp.slice().sort(compareCategoryOrder))
      return
    }

    const controller = new AbortController()

    const load = async () => {
      try {
        const res = await fetch("/api/shop/categories", {
          cache: "no-store",
          signal: controller.signal,
        })
        if (!res.ok) {
          throw new Error("Failed to fetch navbar categories")
        }
        const data = await res.json()
        const items = Array.isArray(data?.categories) ? data.categories : []

        const mapped: Category[] = items.map((c: any) => ({
          id: c.id,
          name: c.name ?? "",
          slug: c.slug ?? "",
          order: Number(c.order ?? 0),
          parent: c.parent ?? null,
          description: c.description ?? null,
        }))

        setInternalCategories(mapped.sort(compareCategoryOrder))
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Failed to fetch navbar categories", err)
        }
      }
    }

    load()

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // IMPORTANT: only once on mount

  // clamp profile dropdown horizontally when opened
  useEffect(() => {
    if (!isProfileOpen || !profileMenuRef.current) return

    const el = profileMenuRef.current
    const padding = 8 // margin from viewport edges

    const updateShift = () => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      let shift = 0

      if (rect.right > window.innerWidth - padding) {
        shift = window.innerWidth - padding - rect.right
      }

      if (rect.left < padding) {
        shift = padding - rect.left
      }

      setProfileShiftX(shift)
    }

    updateShift()
    requestAnimationFrame(updateShift)
    const t = window.setTimeout(updateShift, 60)
    window.addEventListener("resize", updateShift)
    window.addEventListener("scroll", updateShift, { passive: true })
    return () => {
      window.clearTimeout(t)
      window.removeEventListener("resize", updateShift)
      window.removeEventListener("scroll", updateShift)
    }
  }, [isProfileOpen])

  useEffect(() => {
    if (!isProfileOpen) return

    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (!profileRootRef.current?.contains(target)) {
        setIsProfileOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener("mousedown", onDocClick)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isProfileOpen])

  // close language menu on outside click
  useEffect(() => {
    if (!isLangOpen) return

    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node
      const inDesktopLang = desktopLangRef.current?.contains(target)
      const inMobileLang = mobileLangRef.current?.contains(target)
      if (!inDesktopLang && !inMobileLang) {
        setIsLangOpen(false)
      }
    }

    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [isLangOpen])

  // root categories
  const rootCategories = internalCategories.filter((cat) => {
    if (Array.isArray(cat.parent)) return cat.parent.length === 0
    return !cat.parent
  }).sort(compareCategoryOrder)

  // children
  const getCategoryChildren = (parentId: string) =>
    internalCategories.filter((cat) => {
      if (Array.isArray(cat.parent)) return cat.parent.includes(parentId)
      return cat.parent === parentId
    }).sort(compareCategoryOrder)

  // toggle category expansion
  const toggleCategory = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const next = new Set(expandedCategories)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpandedCategories(next)
  }

  const handleLanguageSelect = (code: string) => {
    setLanguage(code)
    setIsLangOpen(false)
  }

  // recursive category list
  const CategoryList = ({
    items,
    level = 0,
  }: {
    items: Category[]
    level?: number
  }) => (
    <div className={level > 0 ? "ml-4 mt-2 space-y-2" : "space-y-2"}>
      {items.map((category) => {
        const children = getCategoryChildren(category.id)
        const isExpanded = expandedCategories.has(category.id)

        return (
          <div key={category.id}>
            <div className="flex items-center justify-between">
              <Link
                href={`/shop/category/${category.slug}`}
                className="text-sm font-medium hover:opacity-70 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                {category.name}
              </Link>

              {children.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => toggleCategory(category.id, e)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-black/5"
                  aria-label="Show subcategories"
                >
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>
              )}
            </div>

            {isExpanded && children.length > 0 && (
              <CategoryList items={children} level={level + 1} />
            )}
          </div>
        )
      })}
    </div>
  )

  const LogoSwap = ({
    size = 60,
  }: {
    size?: number
    scale?: number
  }) => {
    const fs = Math.max(13, Math.round(size * 0.3))
    return (
      <span
        className="inline-flex items-center gap-1 select-none"
        style={{
          fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif",
          fontWeight: 900,
          fontSize: `${fs}px`,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        <span
        className="text-white"
        >
          CHIA
        </span>
        <span
          style={{
            background: 'linear-gradient(135deg, rgb(158,38,182) 20%, rgb(232,68,106) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            WebkitTextStroke: '1.5px #ffffff',

          }}
        >
          CHARGED
        </span>
      </span>
    )
  }

  const displayName =
    [currentUser?.surname, currentUser?.name].filter(Boolean).join(" ") ||
    currentUser?.email ||
    "Account"
  const fullName = [currentUser?.surname, currentUser?.name].filter(Boolean).join(" ").trim()
  const profileLabel = currentUser
    ? (fullName || currentUser.email || "Account")
    : "Log in"
  const NAVBAR_GRADIENT = "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)"
  const shouldShowSignupPromo = showSignupPromo
  const navSpacerClass = reserveSpace
    ? shouldShowSignupPromo
      ? "h-[100px] md:h-[112px]"
      : "h-[60px] md:h-[72px]"
    : null

    useLayoutEffect(() => {
      if (typeof document === "undefined") return
      const root = document.documentElement
      root.style.setProperty(
        "--navbar-offset-mobile",
        shouldShowSignupPromo ? "100px" : "60px"
      )
      root.style.setProperty(
        "--navbar-offset-desktop",
        shouldShowSignupPromo ? "112px" : "72px"
      )
      root.style.setProperty(
        "--mega-menu-top-desktop",
        shouldShowSignupPromo && !hasPassedPromoBanner ? "112px" : "72px"
      )
    }, [shouldShowSignupPromo, hasPassedPromoBanner])

  return (
    <NavbarCart currentUser={currentUser} onOpenChange={setIsCartPanelOpen}>
      {({ cartCount, openCart }) => (
    <>
      {shouldShowSignupPromo && (
        <div
          className="absolute inset-x-0 top-0 z-50 overflow-x-clip text-white"
          style={{
            background: "var(--accent)",
            backgroundClip: "padding-box",
          }}
        >
          <div className="mx-auto flex h-10 max-w-7xl items-center justify-center px-10 sm:px-8">
            <p
              className="max-w-full text-center text-[12px] leading-tight whitespace-normal md:text-sm md:whitespace-nowrap"
              style={{
                fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif",
                fontWeight: 900,
                color: "white",
                textShadow: "0 1px 10px rgba(0,0,0,0.25)",
              }}
            >
              FREE SHIPPING ON ORDERS $99+
            </p>
            <button
              type="button"
              onClick={closeSignupPromo}
              className="absolute right-2 sm:right-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center hover:opacity-70 transition-opacity"
              aria-label="Close promotion"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      <nav
        className={`left-0 right-0 z-40 text-white transition-transform duration-300 ${
          isMobileNavVisible ? "translate-y-0" : "-translate-y-full"
        } ${
          shouldShowSignupPromo
            ? hasPassedPromoBanner
              ? "fixed top-0"
              : "absolute top-10"
            : "fixed top-0"
        }`}
        style={{
          background: NAVBAR_GRADIENT,
          borderBottom: '3px solid #111',
          boxShadow: '0 2px 24px rgba(124,58,237,0.35)',
        }}
      >
        {/* Desktop */}
        <div className="hidden md:grid grid-cols-[auto_1fr_auto] items-center px-28 py-2 mx-auto">
          <Link href="/" className="flex items-center gap-3 justify-self-start mr-12">
            <LogoSwap size={140} />
          </Link>

          <div
            className=" flex items-center justify-start gap-6 text-[1rem] font-black uppercase tracking-[0.12em] text-white justify-self-start"
            style={{
              fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif",
              fontWeight: 900,
            }}
          >
            <div
              className="relative"
              onMouseEnter={() => {
                if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current)
                setIsDesktopMenuOpen(true)
              }}
              onMouseLeave={() => {
                megaMenuTimeoutRef.current = window.setTimeout(() => setIsDesktopMenuOpen(false), 300)
              }}
            >
              <button
                type="button"
                onClick={() => setIsDesktopMenuOpen((prev) => !prev)}
                className="cursor-pointer transition-all hover:tracking-[0.18em]"
                aria-expanded={isDesktopMenuOpen}
                aria-controls="desktop-navbar-shop"
              >
                SHOP
              </button>
              {/* Invisible bridge — extends hit area down to the mega menu */}
              {isDesktopMenuOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-[200vw] h-4" />
              )}
            </div>
            <Link href="/#story" className="transition-all hover:tracking-[0.18em]">
              OUR STORY
            </Link>
            <Link href="/#contact" className="transition-all hover:tracking-[0.18em]">
              CONTACT
            </Link>
            <Link href="/blog" className="transition-all hover:tracking-[0.18em]">
              BLOG
            </Link>
          </div>

          {/* Icons desktop */}
          <div className="flex items-center gap-2 justify-self-end">

            {/* Cart with badge */}
            <button
              type="button"
              className="relative inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-white transition-all hover:opacity-80 active:scale-95"
              aria-label="Cart"
              onClick={openCart}
            >
              <ShoppingBag size={32} strokeWidth={2} />
              {cartCount > 0 && (
                <span
                  className="absolute top-0 right-0 inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full text-white text-[10px] font-black px-1"
                  style={{ background: 'linear-gradient(135deg, rgb(68,15,195), rgb(232,68,106))', fontFamily: "'Arial Black', sans-serif" }}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {/* Profile + centered dropdown (click to toggle) */}
            <div
              className="relative"
              ref={profileRootRef}
            >
              <button
                type="button"
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-white transition-all hover:opacity-80 active:scale-95"
                aria-label="Account"
                onClick={() => {
                  if (!currentUser) {
                    openAuthModal(pathname)
                    return
                  }
                  setIsProfileOpen((v) => !v)
                }}
              >
                <CircleUser size={32} strokeWidth={2} />
                <span
                  className="max-w-[12rem] truncate text-[0.8rem] font-black uppercase tracking-[0.12em] text-white"
                  style={{ fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif", fontWeight: 900 }}
                >
                  {profileLabel}
                </span>
              </button>

              <AnimatePresence>
              {currentUser && isProfileOpen && (
                <div
                  ref={profileMenuRef}
                  className="absolute left-1/2 top-full mt-3 w-64 max-w-[calc(100vw-4rem)]"
                  style={{
                    transform: `translateX(calc(-50% + ${profileShiftX}px))`,
                    maxWidth: 'calc(100vw - 16px)',
                    width: 'min(16rem, calc(100vw - 16px))',
                  }}
                >
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                  className="overflow-hidden rounded-sm text-black"
                  style={{
                    transformOrigin: "top center",
                    border: '4px solid #111',
                    boxShadow: '6px 6px 0 #111',
                    fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif",
                  }}
                >
                  {/* Gradient header — mirrors the modal's left panel */}
                  <div
                    className="px-4 py-2"
                    style={{
                      background: 'linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)',
                      borderBottom: '4px solid #111',
                    }}
                  >
                    <div
                      className="truncate text-[13px] font-black uppercase tracking-[0.1em] text-white"
                    >
                      {displayName}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-[0.14em] text-white/60 mt-0.5 truncate">
                      {currentUser?.email}
                    </div>
                  </div>

                  {/* Menu items — cream background like modal's right panel */}
                  <div
                    className="space-y-2 px-3 py-3"
                    style={{ background: '#f5efe4', backgroundImage: "url('/texture.webp')", backgroundSize: '280px 280px' }}
                  >
                      {/* Full name / Profile */}
<Link
  href={currentUser?.role === "admin" ? "/admin" : "/orders"}
  className="flex items-center justify-between rounded-sm px-3 py-2.5 text-sm font-black uppercase tracking-wide bg-white border-[3px] border-black transition-all hover:shadow-[3px_3px_0_#111] hover:-translate-x-0.5 hover:-translate-y-0.5"
  onClick={() => setIsProfileOpen(false)}
>
  <div className="flex items-center gap-2">
    <CircleUser className="h-4 w-4" />
    <span className="truncate text-[11px]">{currentUser?.role === "admin" ? "Admin panel" : "My profile"}</span>
  </div>
  <ChevronRight className="h-3 w-3 opacity-60" />
</Link>

                      {/* Orders */}
                    {currentUser?.role !== "admin" && (
  <Link
    href="/orders"
    className="flex items-center justify-between rounded-sm px-3 py-2.5 text-sm font-black uppercase tracking-wide bg-white border-[3px] border-black transition-all hover:shadow-[3px_3px_0_#111] hover:-translate-x-0.5 hover:-translate-y-0.5"
    onClick={() => setIsProfileOpen(false)}
  >
    <div className="flex items-center gap-2">
      <ClipboardList className="h-4 w-4" />
      <span className="text-[11px]">My orders</span>
    </div>
    <ChevronRight className="h-3 w-3 opacity-60" />
  </Link>
)}

                      {/* Settings / Account */}
                      {currentUser?.role !== "admin" && (
                        <Link
                          href="/account"
                          className="flex items-center justify-between rounded-sm px-3 py-2.5 text-sm font-black uppercase tracking-wide bg-white border-[3px] border-black transition-all hover:shadow-[3px_3px_0_#111] hover:-translate-x-0.5 hover:-translate-y-0.5"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            <span className="text-[11px]">Account settings</span>
                          </div>
                          <ChevronRight className="h-3 w-3 opacity-60" />
                        </Link>
                      )}

                      {/* Logout */}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full cursor-pointer items-center justify-between rounded-sm px-3 py-2.5 text-sm font-black uppercase tracking-wide bg-white border-[3px] border-black transition-all hover:shadow-[3px_3px_0_#111] hover:-translate-x-0.5 hover:-translate-y-0.5"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut className="h-4 w-4 text-red-600" />
                          <span className="text-[11px] text-red-600">Sign out</span>
                        </div>
                      </button>
                    </div>
                </motion.div>
                </div>
              )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        {/* Mobile */}
        <div className="md:hidden relative">
          <div className="flex items-center gap-1.5 px-2 py-2">
            <div className="flex flex-1 items-center justify-center">
              <Link href="/" className="flex items-center" aria-label="Home">
                <LogoSwap size={90} />
              </Link>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-white transition-all hover:opacity-80"
                aria-label="Account"
                onClick={() => {
                  if (!currentUser) {
                    openAuthModal(pathname)
                    return
                  }
                  if (currentUser?.role === "admin") {
                    router.push("/admin")
                    return
                  }
                  setIsProfileOpen((v) => !v)
                }}
              >
                <CircleUser size={30} strokeWidth={2.25} />
              </button>

              <button
                type="button"
                onClick={openCart}
                aria-label="Cart"
                className="relative inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-white transition-all hover:opacity-80"
              >
                <ShoppingBag size={30} strokeWidth={2.25} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-2 -right-2 inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full text-white text-[10px] font-black px-1"
                    style={{ background: 'linear-gradient(135deg, rgb(68,15,195), rgb(232,68,106))', fontFamily: "'Arial Black', sans-serif" }}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen)
                }}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-white hover:bg-white/15 transition-all duration-300 ${isMenuOpen ? "rotate-90" : "rotate-0"}`}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
              </button>
            </div>
          </div>

        </div>
        {/* Mobile panel */}
        <div
          className={`text-white transition-all duration-300 ease-out md:hidden overflow-hidden ${
            isMenuOpen ? "max-h-[calc(100vh-60px)] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
          style={{
            background: 'linear-gradient(160deg, rgb(44,10,130) 0%, rgb(120,28,160) 45%, rgb(180,48,100) 100%)',
            borderTop: '2px solid rgba(255,255,255,0.18)',
          }}
          aria-hidden={!isMenuOpen}
        >
          {/* Subtle noise overlay */}
          <div className="pointer-events-none absolute inset-0" style={{ background: "url('/texture.webp')", backgroundSize: '280px', opacity: 0.07 }} />

          <div className="relative overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>

            {/* ── SHOP accordion ── */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
              <button
                type="button"
                onClick={() => setMobileShopOpen(v => !v)}
                className="flex w-full items-center justify-between px-5 py-4 cursor-pointer"
                style={{ fontFamily: "'Arial Black', 'Impact', sans-serif", fontWeight: 900, fontSize: '1rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                <span>SHOP</span>
                <ChevronRight
                  size={18}
                  strokeWidth={3}
                  className="transition-transform duration-300"
                  style={{ transform: mobileShopOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                />
              </button>

              {/* Categories list */}
              <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{ maxHeight: mobileShopOpen ? '2000px' : '0px' }}
              >
{internalCategories
                  .filter(cat => {
                    if (Array.isArray(cat.parent)) return cat.parent.length === 0
                    return !cat.parent
                  })
                  .sort((a, b) => {
                    const aO = typeof a.order === 'number' ? a.order : 0
                    const bO = typeof b.order === 'number' ? b.order : 0
                    return aO !== bO ? aO - bO : a.name.localeCompare(b.name)
                  })
                  .map(cat => {
                    const isExpanded = mobileActiveCat === cat.id
                    const catProducts = mobileProducts[cat.id] ?? []
                    const isLoading = mobileLoadingCat === cat.id

                    const toggleCat = async () => {
                      if (isExpanded) {
                        setMobileActiveCat(null)
                        return
                      }
                      setMobileActiveCat(cat.id)
                      if (!mobileProducts[cat.id]) {
                        setMobileLoadingCat(cat.id)
                        try {
                          const res = await fetch(`/api/products?category=${encodeURIComponent(cat.slug)}&limit=6`)
                          const data = await res.json()
                          setMobileProducts(prev => ({
                            ...prev,
                            [cat.id]: (data.products ?? []).slice(0, 6).map((p: any) => ({
                              id: p.id,
                              slug: p.slug,
                              name: p.name,
                              price: p.price,
                              promoPrice: p.promoPrice,
                              imageUrls: p.imageUrls ?? (p.imageUrl ? [p.imageUrl] : []),
                            }))
                          }))
                        } catch { /* silent */ } finally {
                          setMobileLoadingCat(null)
                        }
                      }
                    }

                    return (
                      <div key={cat.id} className="mx-4 mb-2">
                        {/* Category row */}
                        <button
                          type="button"
                          onClick={toggleCat}
                          className="flex w-full items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer"
                          style={{
                            background: isExpanded
                              ? 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.1) 100%)'
                              : 'rgba(255,255,255,0.07)',
                            border: isExpanded ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: isExpanded ? '0 4px 20px rgba(0,0,0,0.25)' : 'none',
                          }}
                        >
                          <span
                            className="text-white text-[13px] uppercase tracking-[0.1em]"
                            style={{ fontFamily: "'Arial Black', sans-serif", fontWeight: 900 }}
                          >
                            {cat.name}
                          </span>
                          <ChevronRight
                            size={16}
                            strokeWidth={2.5}
                            className="text-white/70 transition-transform duration-300"
                            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                          />
                        </button>

                        {/* Products grid */}
                        <div
                          className="overflow-hidden transition-all duration-400 ease-out"
                          style={{ maxHeight: isExpanded ? '600px' : '0px' }}
                        >
                          <div className="pt-2 pb-1">
{isLoading ? (
                              <div className="flex items-center justify-center py-6">
                                <div
                                  className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin"
                                />
                              </div>
                            ) : catProducts.length === 0 ? null : (
                              <div className="grid grid-cols-3 gap-2">
                                {catProducts.map(product => {
                                  const hasPromo = product.promoPrice != null && product.promoPrice > 0 && product.promoPrice < product.price
                                  const img = product.imageUrls[0] ?? '/aboutimg.webp'
                                  return (
                                    <Link
                                      key={product.id}
                                      href={`/product/${product.slug}`}
                                      onClick={() => setIsMenuOpen(false)}
                                      className="group flex flex-col overflow-hidden rounded-xl transition-all duration-200 active:scale-95"
                                      style={{
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        background: 'rgba(255,255,255,0.08)',
                                        backdropFilter: 'blur(10px)',
                                      }}
                                    >
                                      {/* Image */}
                                      <div
                                        className="relative aspect-square overflow-hidden"
                                        style={{ background: 'linear-gradient(135deg, rgba(68,15,195,0.6) 0%, rgba(232,68,106,0.4) 100%)' }}
                                      >
                                        <img
                                          src={img}
                                          alt={product.name}
                                          className="absolute inset-0 w-full h-full object-contain p-1.5 transition-transform duration-300 group-active:scale-105"
                                          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
                                        />
                                        {hasPromo && (
                                          <span
                                            className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-white text-[8px] font-black uppercase"
                                            style={{ fontFamily: "'Arial Black', sans-serif", background: '#e8446a', letterSpacing: '0.1em' }}
                                          >
                                            Sale
                                          </span>
                                        )}
                                      </div>
                                      {/* Name */}
                                      <div className="px-1.5 py-2">
                                        <p
                                          className="text-white text-[9px] uppercase leading-tight line-clamp-2 text-center"
                                          style={{ fontFamily: "'Arial Black', sans-serif", fontWeight: 900, letterSpacing: '0.05em' }}
                                        >
                                          {product.name}
                                        </p>
                                      </div>
                                    </Link>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                <div className="h-3" />
              </div>
            </div>

            {/* ── Static links ── */}
            {[
              { href: '/#story', label: 'Our Story' },
              { href: '/#contact', label: 'Contact' },
              { href: '/blog', label: 'Blog' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/5"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontWeight: 900,
                  fontSize: '1rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
                <ChevronRight size={14} strokeWidth={2.5} className="text-white/40" />
              </Link>
            ))}

            {/* Bottom safe area */}
            <div className="h-6" />
          </div>
        </div>
      </nav>

      {/* Desktop Mega Menu — fixed to viewport, full screen height */}
      <div
        className="hidden md:block"
        onMouseEnter={() => {
          if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current)
          setIsDesktopMenuOpen(true)
        }}
        onMouseLeave={() => {
          megaMenuTimeoutRef.current = window.setTimeout(() => setIsDesktopMenuOpen(false), 300)
        }}
      >
        <MegaMenu
          isOpen={isDesktopMenuOpen}
          categories={internalCategories}
          onClose={() => setIsDesktopMenuOpen(false)}
        />
      </div>

      {navSpacerClass ? <div aria-hidden className={navSpacerClass} /> : null}

      {(() => {
        const MODAL_FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
        const MODAL_GRADIENT = "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)"
        const inputCls = "w-full rounded-sm border-[3px] border-black bg-white px-4 py-2.5 text-sm font-semibold text-black outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(124,58,237,0.18)] placeholder:text-black/25 placeholder:font-normal"
        const labelCls = "block text-[9px] font-black uppercase tracking-[0.2em] mb-1.5"

        const leftContent = {
          login:  { lines: ["Welcome", "Back."],      sub: "Sign in to track orders & fuel your day." },
          signup: { lines: ["Join The", "Movement."], sub: "Start your chia-powered journey today." },
          forgot: { lines: ["Reset &",  "Return."],   sub: "We'll send a reset link to your inbox." },
        }[authMode]

        return (
          <AnimatePresence>
          {isAuthModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeAuthModal}
            />

            <motion.div
              className="relative flex w-full max-w-[820px] overflow-hidden rounded-sm"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
              style={{ border: "4px solid #111", boxShadow: "10px 10px 0 #111" }}
            >
              {/* ── LEFT: gradient brand panel ── */}
              <div
                className="relative hidden w-[38%] shrink-0 flex-col justify-between overflow-hidden p-8 sm:flex"
                style={{ background: MODAL_GRADIENT, minHeight: 500 }}
              >
                {/* Watermark */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-4 bottom-[-5%] select-none"
                  style={{ fontSize: "15rem", fontFamily: MODAL_FONT, fontWeight: 900, color: "rgba(255,255,255,0.06)", lineHeight: 0.85 }}
                >
                  CC
                </div>

                {/* Brand badge */}
                <div>
                  <div
                    className="mb-6 inline-flex items-center gap-2 px-3 py-1.5"
                    style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)" }}
                  >
                    <span className="h-2 w-2 rounded-full bg-white/80" />
                    <span
                      className="text-[9px] uppercase tracking-[0.25em] text-white/90"
                      style={{ fontFamily: MODAL_FONT, fontWeight: 900 }}
                    >
                      Chia Charged
                    </span>
                  </div>

                  <motion.h2
                    key={authMode}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                    className="text-[2.5rem] uppercase leading-[0.88] tracking-tighter text-white"
                    style={{ fontFamily: MODAL_FONT, fontWeight: 900 }}
                  >
                    {leftContent.lines[0]}<br />{leftContent.lines[1]}
                  </motion.h2>
                  <motion.p
                    key={authMode + "-sub"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.08 }}
                    className="mt-3 text-[10px] uppercase tracking-[0.15em] text-white/50"
                    style={{ fontFamily: MODAL_FONT, fontWeight: 900 }}
                  >
                    {leftContent.sub}
                  </motion.p>
                </div>

                {/* Stats strip */}
                <div className="flex gap-5 border-t border-white/15 pt-5">
                  {[["22g", "Protein/Serving"], ["12g", "Fiber"], ["100%", "Natural"]].map(([val, label]) => (
                    <div key={label}>
                      <p className="text-base uppercase leading-none text-white" style={{ fontFamily: MODAL_FONT, fontWeight: 900 }}>{val}</p>
                      <p className="text-[8px] uppercase tracking-[0.15em] text-white/40" style={{ fontFamily: MODAL_FONT, fontWeight: 900 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── RIGHT: form panel ── */}
              <div
                className="relative flex flex-1 flex-col justify-center px-8 py-9"
                style={{ background: "#f5efe4", backgroundImage: "url('/texture.webp')", backgroundSize: "280px 280px" }}
              >
                {/* Close */}
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="absolute right-1 top-1 z-10 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-sm transition-all hover:scale-[0.92]"
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={3} />
                </button>

                {/* Mode tabs */}
                <div className="mb-6 flex overflow-hidden rounded-sm border-[3px] border-black" style={{ boxShadow: "3px 3px 0 #111" }}>
                  {(["login", "signup"] as const).map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => switchAuthMode(m)}
                      className="flex-1 cursor-pointer py-2.5 text-[9px] font-black uppercase tracking-[0.18em] transition-all"
                      style={{
                        fontFamily: MODAL_FONT,
                        background: authMode === m ? MODAL_GRADIENT : "#fff",
                        color: authMode === m ? "#fff" : "#111",
                        borderRight: i === 0 ? "2px solid #111" : "none",
                      }}
                    >
                      {m === "login" ? "Sign In" : "Sign Up"}
                    </button>
                  ))}
                </div>

                {/* Header */}
                <div className="mb-5">
                  <p
                    className="text-[9px] font-black uppercase tracking-[0.22em]"
                    style={{ fontFamily: MODAL_FONT, background: MODAL_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                  >
                    {authMode === "forgot" ? "Password Reset" : authMode === "login" ? "Welcome Back" : "New Account"}
                  </p>
                  <h2
                    className="mt-0.5 text-[1.7rem] font-black uppercase leading-none tracking-tighter text-black"
                    style={{ fontFamily: MODAL_FONT, fontWeight: 900 }}
                  >
                    {authMode === "login" ? "Sign In." : authMode === "signup" ? "Join Us." : "Reset."}
                  </h2>
                </div>

                {/* Error */}
                {authError && (
                  <div
                    className="mb-4 rounded-sm border-2 border-red-500 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
                    style={{ fontFamily: MODAL_FONT }}
                  >
                    {authError}
                  </div>
                )}

                {/* Sliding panels */}
                <div
                  className="relative overflow-visible transition-[height] duration-300 ease-out"
                  style={authPanelHeight != null ? { height: `${authPanelHeight}px` } : undefined}
                >
                  {/* LOGIN */}
                  <div
                    ref={authLoginPanelRef}
                    className={`transition-transform duration-300 ease-out ${
                      authMode === "login"
                        ? "relative translate-x-0 opacity-100"
                        : "pointer-events-none absolute inset-0 -translate-x-4 opacity-0"
                    }`}
                  >
                    <form className="space-y-3" onSubmit={handleAuthLogin}>
                      <div>
                        <label htmlFor="auth-email" className={labelCls} style={{ fontFamily: MODAL_FONT }}>
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input id="auth-email" type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className={inputCls} placeholder="you@domain.com" />
                        {authFieldErrors.identifier && <p className="mt-1 text-[10px] font-semibold text-red-600">{authFieldErrors.identifier}</p>}
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label htmlFor="auth-password" className={labelCls} style={{ fontFamily: MODAL_FONT, marginBottom: 0 }}>
                            Password <span className="text-red-500">*</span>
                          </label>
                          <button type="button" onClick={() => switchAuthMode("forgot")} className="cursor-pointer text-[9px] font-black uppercase tracking-wider text-black/40 transition-colors hover:text-black" style={{ fontFamily: MODAL_FONT }}>
                            Forgot?
                          </button>
                        </div>
                        <input id="auth-password" type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
                        {authFieldErrors.password && <p className="mt-1 text-[10px] font-semibold text-red-600">{authFieldErrors.password}</p>}
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthSubmitting}
                        className="mt-1 h-12 w-full cursor-pointer rounded-sm border-[3px] border-black text-sm font-black uppercase tracking-[0.1em] text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#111] disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ fontFamily: MODAL_FONT, background: MODAL_GRADIENT, boxShadow: "3px 3px 0 #111" }}
                      >
                        {isAuthSubmitting ? "Signing in..." : "Sign In →"}
                      </button>
                    </form>

                    <div className="mt-3">
                      <a
                        href="/api/auth/oauth/google"
                        className="inline-flex w-full h-10 cursor-pointer items-center justify-center gap-2 rounded-sm border-2 border-black bg-white text-xs font-black uppercase tracking-wide text-black transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#111]"
                        style={{ fontFamily: MODAL_FONT, boxShadow: "2px 2px 0 #111" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Continue with Google</span>
                      </a>
                    </div>

                    <p className="mt-4 text-center text-xs font-semibold text-black/50">
                      No account yet?{" "}
                      <button type="button" onClick={() => switchAuthMode("signup")} className="cursor-pointer font-black uppercase tracking-wide text-black underline underline-offset-2 transition-opacity hover:opacity-70" style={{ fontFamily: MODAL_FONT }}>Sign up</button>
                    </p>
                  </div>

                  {/* SIGNUP */}
                  <div
                    ref={authSignupPanelRef}
                    className={`transition-transform duration-300 ease-out ${
                      authMode === "signup"
                        ? "relative translate-x-0 opacity-100"
                        : "pointer-events-none absolute inset-0 translate-x-4 opacity-0"
                    }`}
                  >
                    <form className="space-y-3" onSubmit={handleAuthSignup}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="signup-surname" className={labelCls} style={{ fontFamily: MODAL_FONT }}>First name <span className="text-red-500">*</span></label>
                          <input id="signup-surname" type="text" required minLength={2} value={signupSurname} onChange={(e) => setSignupSurname(e.target.value)} className={inputCls} placeholder="First" />
                          {authFieldErrors.surname && <p className="mt-1 text-[10px] font-semibold text-red-600">{authFieldErrors.surname}</p>}
                        </div>
                        <div>
                          <label htmlFor="signup-name" className={labelCls} style={{ fontFamily: MODAL_FONT }}>Last name <span className="text-red-500">*</span></label>
                          <input id="signup-name" type="text" required minLength={2} value={signupName} onChange={(e) => setSignupName(e.target.value)} className={inputCls} placeholder="Last" />
                          {authFieldErrors.name && <p className="mt-1 text-[10px] font-semibold text-red-600">{authFieldErrors.name}</p>}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="signup-email" className={labelCls} style={{ fontFamily: MODAL_FONT }}>Email <span className="text-red-500">*</span></label>
                        <input id="signup-email" type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className={inputCls} placeholder="you@domain.com" />
                        {authFieldErrors.email && <p className="mt-1 text-[10px] font-semibold text-red-600">{authFieldErrors.email}</p>}
                      </div>

                      <div>
                        <label htmlFor="signup-password" className={labelCls} style={{ fontFamily: MODAL_FONT }}>Password <span className="text-red-500">*</span></label>
                        <input id="signup-password" type="password" required minLength={8} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className={inputCls} placeholder="Min. 8 characters" />
                        {authFieldErrors.password && <p className="mt-1 text-[10px] font-semibold text-red-600">{authFieldErrors.password}</p>}
                      </div>

                      <div>
                        <label htmlFor="signup-password-confirm" className={labelCls} style={{ fontFamily: MODAL_FONT }}>Confirm password <span className="text-red-500">*</span></label>
                        <input id="signup-password-confirm" type="password" required minLength={8} value={signupPasswordConfirm} onChange={(e) => setSignupPasswordConfirm(e.target.value)} className={inputCls} placeholder="Repeat password" />
                        {authFieldErrors.passwordConfirm && <p className="mt-1 text-[10px] font-semibold text-red-600">{authFieldErrors.passwordConfirm}</p>}
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthSubmitting}
                        className="mt-1 h-12 w-full cursor-pointer rounded-sm border-[3px] border-black text-sm font-black uppercase tracking-[0.1em] text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#111] disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ fontFamily: MODAL_FONT, background: MODAL_GRADIENT, boxShadow: "3px 3px 0 #111" }}
                      >
                        {isAuthSubmitting ? "Creating..." : "Create Account →"}
                      </button>
                    </form>

                    <p className="mt-4 text-center text-xs font-semibold text-black/50">
                      Already have an account?{" "}
                      <button type="button" onClick={() => switchAuthMode("login")} className="cursor-pointer font-black uppercase tracking-wide text-black underline underline-offset-2 transition-opacity hover:opacity-70" style={{ fontFamily: MODAL_FONT }}>Sign in</button>
                    </p>
                  </div>

                  {/* FORGOT */}
                  <div
                    ref={authForgotPanelRef}
                    className={`transition-transform duration-300 ease-out ${
                      authMode === "forgot"
                        ? "relative translate-x-0 opacity-100"
                        : "pointer-events-none absolute inset-0 translate-x-4 opacity-0"
                    }`}
                  >
                    {forgotSent ? (
                      <div className="rounded-sm border-2 border-black bg-white px-4 py-6 text-center" style={{ boxShadow: "4px 4px 0 #111" }}>
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center border-2 border-black" style={{ background: MODAL_GRADIENT }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <p className="text-sm font-black uppercase tracking-wide text-black" style={{ fontFamily: MODAL_FONT }}>Email Sent!</p>
                        <p className="mt-1 text-xs font-semibold text-black/50">Check your inbox for the reset link.</p>
                      </div>
                    ) : (
                      <form className="space-y-3" onSubmit={handleForgotPassword}>
                        <div>
                          <label htmlFor="forgot-email" className={labelCls} style={{ fontFamily: MODAL_FONT }}>Email <span className="text-red-500">*</span></label>
                          <input id="forgot-email" type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className={inputCls} placeholder="you@domain.com" />
                        </div>
                        <button
                          type="submit"
                          disabled={isAuthSubmitting}
                          className="mt-1 h-12 w-full cursor-pointer rounded-sm border-[3px] border-black text-sm font-black uppercase tracking-[0.1em] text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#111] disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ fontFamily: MODAL_FONT, background: MODAL_GRADIENT, boxShadow: "3px 3px 0 #111" }}
                        >
                          {isAuthSubmitting ? "Sending..." : "Send Reset Link →"}
                        </button>
                      </form>
                    )}
                    <p className="mt-4 text-center text-xs font-semibold text-black/50">
                      <button type="button" onClick={() => switchAuthMode("login")} className="cursor-pointer font-black uppercase tracking-wide text-black underline underline-offset-2 transition-opacity hover:opacity-70" style={{ fontFamily: MODAL_FONT }}>← Back to sign in</button>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          )}
          </AnimatePresence>
        )
      })()}
    </>
      )}
    </NavbarCart>
  )
}
