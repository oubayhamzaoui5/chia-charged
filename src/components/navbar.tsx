// components/navbar.tsx
"use client"

import { useState, useEffect, useLayoutEffect, useRef } from "react"
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
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [language, setLanguage] = useState("EN")

  // internal categories state (from props OR fetched)
  const [internalCategories, setInternalCategories] =
    useState<Category[]>(categoriesProp)

  const desktopLangRef = useRef<HTMLDivElement | null>(null)
  const mobileLangRef = useRef<HTMLDivElement | null>(null)

  // profile dropdown state (desktop)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileTimeoutRef = useRef<number | null>(null)

  // profile dropdown positioning
  const [profileShiftX, setProfileShiftX] = useState(0)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

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

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAuthModalOpen(false)
        setAuthPassword("")
        setAuthError("")
        setAuthFieldErrors({})
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
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

  const handleProfileEnter = () => {
    if (!currentUser) return
    if (profileTimeoutRef.current) {
      window.clearTimeout(profileTimeoutRef.current)
    }
    setIsProfileOpen(true)
  }

  const handleProfileLeave = () => {
    if (!currentUser) return
    if (profileTimeoutRef.current) {
      window.clearTimeout(profileTimeoutRef.current)
    }
    profileTimeoutRef.current = window.setTimeout(() => {
      setIsProfileOpen(false)
    }, 150)
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

  const handleSocialLoginClick = (provider: "google" | "facebook") => {
    const label = provider === "google" ? "Google" : "Facebook"
    setAuthError(`${label} sign-in coming soon.`)
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

      // Auto-login after successful registration
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
                href={`/boutique/categorie/${category.slug}`}
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
            background: 'linear-gradient(135deg, rgb(185,58,210) 20%, rgb(232,68,106) 100%)',
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
            background: "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)",
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
              className="absolute right-2 sm:right-4 inline-flex h-7 w-7 items-center justify-center hover:opacity-70 transition-opacity"
              aria-label="Close promotion"
            >
              <X size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      <nav
        className={`left-0 right-0 bg-accent z-40 text-white transition-transform duration-300 ${
          isMobileNavVisible ? "translate-y-0" : "-translate-y-full"
        } ${
          shouldShowSignupPromo
            ? hasPassedPromoBanner
              ? "fixed top-0"
              : "absolute top-10"
            : "fixed top-0"
        }`}
        style={{
          borderBottom: '3px solid #111',
          boxShadow: '0 2px 24px rgba(124,58,237,0.35)',
        }}
      >
        {/* Desktop */}
        <div className="hidden md:grid grid-cols-[auto_1fr_auto] items-center px-12 py-2 mx-auto">
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
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl text-white transition-all hover:opacity-80 active:scale-95"
              aria-label="Cart"
              onClick={openCart}
            >
              <ShoppingBag size={32} strokeWidth={2} />
              {cartCount > 0 && (
                <span
                  className="absolute top-0 right-0 inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full text-white text-[10px] font-black px-1"
                  style={{ background: 'linear-gradient(135deg, rgb(124,58,237), rgb(232,68,106))', fontFamily: "'Arial Black', sans-serif" }}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {/* Profile + centered dropdown with delay */}
            <div
              className="relative"
              onMouseEnter={currentUser ? handleProfileEnter : undefined}
              onMouseLeave={currentUser ? handleProfileLeave : undefined}
            >
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-white transition-all hover:opacity-80 active:scale-95"
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
              </button>

              {currentUser && isProfileOpen && (
                <div
                  ref={profileMenuRef}
                  className="absolute left-1/2 top-full mt-3 w-64 max-w-[calc(100vw-4rem)] space-y-2 rounded-2xl px-3 py-3 text-black overflow-hidden bg-accent"
                  style={{
                    transform: `translateX(calc(-50% + ${profileShiftX}px))`,
                    border: '4px solid #111',
                    boxShadow: '6px 6px 0 #111',
                    fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif",
                    maxWidth: 'calc(100vw - 16px)',
                    width: 'min(16rem, calc(100vw - 16px))',
                  }}
                >
                  <div
                    className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] pb-2 text-white"
                    style={{ borderBottom: '4px solid #111' }}
                  >
                    My account
                  </div>

                  <div className="space-y-1">
                      {/* Full name / Profile */}
<Link
  href={currentUser?.role === "admin" ? "/admin" : "/commandes"}
  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold tracking-wide bg-white border-2 border-black transition-all hover:shadow-[2px_2px_0_#111] hover:-translate-x-px hover:-translate-y-px"
  onClick={() => setIsProfileOpen(false)}
>
  <div className="flex items-center gap-2">
    <CircleUser className="h-4 w-4" />
    <span className="truncate">{displayName}</span>
  </div>
  <ChevronRight className="h-3 w-3 opacity-60" />
</Link>

                      {/* Orders */}
                    {currentUser?.role !== "admin" && (
  <Link
    href="/commandes"
    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold tracking-wide bg-white border-2 border-black transition-all hover:shadow-[2px_2px_0_#111] hover:-translate-x-px hover:-translate-y-px"
    onClick={() => setIsProfileOpen(false)}
  >
    <div className="flex items-center gap-2">
      <ClipboardList className="h-4 w-4" />
      <span>My orders</span>
    </div>
    <ChevronRight className="h-3 w-3 opacity-60" />
  </Link>
)}

                      {/* Settings / Account */}
                      {currentUser?.role !== "admin" && (
                        <Link
                          href="/mon-compte"
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold tracking-wide bg-white border-2 border-black transition-all hover:shadow-[2px_2px_0_#111] hover:-translate-x-px hover:-translate-y-px"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            <span>Account settings</span>
                          </div>
                          <ChevronRight className="h-3 w-3 opacity-60" />
                        </Link>
                      )}

                      {/* Logout */}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold tracking-wide bg-white border-2 border-black transition-all hover:shadow-[2px_2px_0_#111] hover:-translate-x-px hover:-translate-y-px"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut className="h-4 w-4 text-red-600" />
                          <span className="text-red-600">Sign out</span>
                        </div>
                      </button>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Mobile */}
        <div className="md:hidden relative">
          <div className="flex items-center gap-1.5 px-2 py-2">
            <div className="flex flex-1 items-center justify-center">
              <Link href="/" className="flex items-center" aria-label="Home">
                <LogoSwap size={32} />
              </Link>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-white transition-all hover:opacity-80"
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
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl text-white transition-all hover:opacity-80"
              >
                <ShoppingBag size={30} strokeWidth={2.25} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-2 -right-2 inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full text-white text-[10px] font-black px-1"
                    style={{ background: 'linear-gradient(135deg, rgb(124,58,237), rgb(232,68,106))', fontFamily: "'Arial Black', sans-serif" }}
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
          className={`text-white transition-all duration-300 ease-out md:hidden ${
            isMenuOpen ? "max-h-[calc(100vh-80px)] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
          style={{
            background: 'rgba(30,8,60,0.97)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.15)',
          }}
          aria-hidden={!isMenuOpen}
        >
          <div className="overflow-y-auto p-4">

            {/* Mobile links */}
            <div className="space-y-4">
              <Link
                href="/boutique"
                onClick={() => setIsMenuOpen(false)}
                className="block text-sm font-semibold text-white hover:text-white tracking-wide transition-colors py-1"
              >
                SHOP
              </Link>

              <Link
                href="/#story"
                onClick={() => setIsMenuOpen(false)}
                className="block text-sm font-semibold text-white hover:text-white tracking-wide transition-colors py-1"
              >
                OUR STORY
              </Link>

              <Link
                href="/#contact"
                onClick={() => setIsMenuOpen(false)}
                className="block text-sm font-semibold text-white hover:text-white tracking-wide transition-colors py-1"
              >
                CONTACT
              </Link>

              <Link
                href="/blog"
                onClick={() => setIsMenuOpen(false)}
                className="block text-sm font-semibold text-white hover:text-white tracking-wide transition-colors py-1"
              >
                BLOG
              </Link>
            </div>

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

      {isAuthModalOpen && (() => {
        const MODAL_FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
        const MODAL_GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"
        const inputCls = "w-full border-[3px] border-black bg-white px-3 py-2.5 text-sm font-semibold text-black outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(124,58,237,0.2)] placeholder:text-black/30 placeholder:font-normal"
        const labelCls = "block text-[10px] font-black uppercase tracking-[0.15em] mb-1"
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeAuthModal}
            />

            <div
              className="relative w-full max-w-[560px] overflow-visible text-black"
              style={{
                background: "#f5efe4",
                backgroundImage: "url('/texture.webp')",
                backgroundSize: "280px 280px",
                border: "4px solid #111",
                boxShadow: "10px 10px 0 #111",
              }}
            >
              {/* Top gradient bar */}
              <div className="h-1.5 w-full" style={{ background: MODAL_GRADIENT }} />

              {/* Close button */}
              <button
                type="button"
                onClick={closeAuthModal}
                className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-black bg-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#111]"
                aria-label="Close"
              >
                <X size={14} strokeWidth={3} />
              </button>

              <div className="px-9 pb-9 pt-8">
                {/* Header */}
                <div className="mb-5">
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{ fontFamily: MODAL_FONT, background: MODAL_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                  >
                    Chia Charged
                  </p>
                  <h2
                    className="mt-1 text-[1.75rem] font-black uppercase leading-none tracking-tighter"
                    style={{ fontFamily: MODAL_FONT, fontWeight: 900, color: "#111" }}
                  >
                    {authMode === "login" ? "Sign In." : authMode === "signup" ? "Join Us." : "Reset."}
                  </h2>
                  <p className="mt-1.5 text-xs font-semibold text-black/50">
                    {authMode === "login"
                      ? "Track your orders & manage your account."
                      : authMode === "signup"
                      ? "Create your account and start fueling smarter."
                      : "Enter your email to receive a reset link."}
                  </p>
                </div>

                {/* Error */}
                {authError && (
                  <div
                    className="mb-4 border-2 border-red-500 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
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
                  {/* LOGIN PANEL */}
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
                        <input
                          id="auth-email"
                          type="email"
                          required
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className={inputCls}
                          placeholder="you@domain.com"
                        />
                        {authFieldErrors.identifier ? (
                          <p className="mt-1 text-[10px] font-semibold text-red-600">
                            {authFieldErrors.identifier}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label htmlFor="auth-password" className={labelCls} style={{ fontFamily: MODAL_FONT }}>
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="auth-password"
                          type="password"
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className={inputCls}
                          placeholder="••••••••"
                        />
                        {authFieldErrors.password ? (
                          <p className="mt-1 text-[10px] font-semibold text-red-600">
                            {authFieldErrors.password}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => switchAuthMode("forgot")}
                          className="cursor-pointer text-[10px] font-black uppercase tracking-wider text-black/40 transition-colors hover:text-black"
                          style={{ fontFamily: MODAL_FONT }}
                        >
                          Forgot password?
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthSubmitting}
                        className="mt-1 h-11 w-full cursor-pointer border-[3px] border-black text-sm font-black uppercase tracking-[0.1em] text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#111] disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ fontFamily: MODAL_FONT, background: MODAL_GRADIENT, boxShadow: "3px 3px 0 #111" }}
                      >
                        {isAuthSubmitting ? "Signing in..." : "Sign In →"}
                      </button>
                    </form>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSocialLoginClick("google")}
                        className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white text-xs font-black uppercase tracking-wide text-black transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#111]"
                        style={{ fontFamily: MODAL_FONT, boxShadow: "2px 2px 0 #111" }}
                      >
                        <span className="text-sm">G</span>
                        <span>Google</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSocialLoginClick("facebook")}
                        className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white text-xs font-black uppercase tracking-wide text-black transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#111]"
                        style={{ fontFamily: MODAL_FONT, boxShadow: "2px 2px 0 #111" }}
                      >
                        <span className="text-sm">f</span>
                        <span>Facebook</span>
                      </button>
                    </div>

                    <p className="mt-4 text-center text-xs font-semibold text-black/50">
                      No account yet?{" "}
                      <button
                        type="button"
                        onClick={() => switchAuthMode("signup")}
                        className="cursor-pointer font-black uppercase tracking-wide text-black underline underline-offset-2 transition-opacity hover:opacity-70"
                        style={{ fontFamily: MODAL_FONT }}
                      >
                        Sign up
                      </button>
                    </p>
                  </div>

                  {/* SIGNUP PANEL */}
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
                          <label htmlFor="signup-surname" className={labelCls} style={{ fontFamily: MODAL_FONT }}>
                            First name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="signup-surname"
                            type="text"
                            required
                            minLength={2}
                            value={signupSurname}
                            onChange={(e) => setSignupSurname(e.target.value)}
                            className={inputCls}
                            placeholder="First name"
                          />
                          {authFieldErrors.surname ? (
                            <p className="mt-1 text-[10px] font-semibold text-red-600">
                              {authFieldErrors.surname}
                            </p>
                          ) : null}
                        </div>
                        <div>
                          <label htmlFor="signup-name" className={labelCls} style={{ fontFamily: MODAL_FONT }}>
                            Last name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="signup-name"
                            type="text"
                            required
                            minLength={2}
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            className={inputCls}
                            placeholder="Last name"
                          />
                          {authFieldErrors.name ? (
                            <p className="mt-1 text-[10px] font-semibold text-red-600">
                              {authFieldErrors.name}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="signup-email" className={labelCls} style={{ fontFamily: MODAL_FONT }}>
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="signup-email"
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className={inputCls}
                          placeholder="you@domain.com"
                        />
                          {authFieldErrors.email ? (
                            <p className="mt-1 text-[10px] font-semibold text-red-600">
                              {authFieldErrors.email}
                            </p>
                          ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="signup-password" className={labelCls} style={{ fontFamily: MODAL_FONT }}>
                            Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="signup-password"
                            type="password"
                            required
                            minLength={8}
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className={inputCls}
                            placeholder="••••••••"
                          />
                          {authFieldErrors.password ? (
                            <p className="mt-1 text-[10px] font-semibold text-red-600">
                              {authFieldErrors.password}
                            </p>
                          ) : null}
                        </div>
                        <div>
                          <label htmlFor="signup-password-confirm" className={labelCls} style={{ fontFamily: MODAL_FONT }}>
                            Confirm <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="signup-password-confirm"
                            type="password"
                            required
                            minLength={8}
                            value={signupPasswordConfirm}
                            onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                            className={inputCls}
                            placeholder="••••••••"
                          />
                          {authFieldErrors.passwordConfirm ? (
                            <p className="mt-1 text-[10px] font-semibold text-red-600">
                              {authFieldErrors.passwordConfirm}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthSubmitting}
                        className="mt-1 h-11 w-full cursor-pointer border-[3px] border-black text-sm font-black uppercase tracking-[0.1em] text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#111] disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ fontFamily: MODAL_FONT, background: MODAL_GRADIENT, boxShadow: "3px 3px 0 #111" }}
                      >
                        {isAuthSubmitting ? "Creating..." : "Create Account →"}
                      </button>
                    </form>

                    <p className="mt-4 text-center text-xs font-semibold text-black/50">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => switchAuthMode("login")}
                        className="cursor-pointer font-black uppercase tracking-wide text-black underline underline-offset-2 transition-opacity hover:opacity-70"
                        style={{ fontFamily: MODAL_FONT }}
                      >
                        Sign in
                      </button>
                    </p>
                  </div>

                  {/* FORGOT PANEL */}
                  <div
                    ref={authForgotPanelRef}
                    className={`transition-transform duration-300 ease-out ${
                      authMode === "forgot"
                        ? "relative translate-x-0 opacity-100"
                        : "pointer-events-none absolute inset-0 translate-x-4 opacity-0"
                    }`}
                  >
                    {forgotSent ? (
                      <div
                        className="border-2 border-black bg-white px-4 py-5 text-center"
                        style={{ boxShadow: "4px 4px 0 #111" }}
                      >
                        <p
                          className="text-sm font-black uppercase tracking-wide text-black"
                          style={{ fontFamily: MODAL_FONT }}
                        >
                          Email Sent!
                        </p>
                        <p className="mt-1 text-xs font-semibold text-black/50">
                          Check your inbox and click the link to reset your password.
                        </p>
                      </div>
                    ) : (
                      <form className="space-y-3" onSubmit={handleForgotPassword}>
                        <div>
                          <label htmlFor="forgot-email" className={labelCls} style={{ fontFamily: MODAL_FONT }}>
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="forgot-email"
                            type="email"
                            required
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className={inputCls}
                            placeholder="you@domain.com"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isAuthSubmitting}
                          className="mt-1 h-11 w-full cursor-pointer border-[3px] border-black text-sm font-black uppercase tracking-[0.1em] text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#111] disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ fontFamily: MODAL_FONT, background: MODAL_GRADIENT, boxShadow: "3px 3px 0 #111" }}
                        >
                          {isAuthSubmitting ? "Sending..." : "Send Reset Link →"}
                        </button>
                      </form>
                    )}
                    <p className="mt-4 text-center text-xs font-semibold text-black/50">
                      <button
                        type="button"
                        onClick={() => switchAuthMode("login")}
                        className="cursor-pointer font-black uppercase tracking-wide text-black underline underline-offset-2 transition-opacity hover:opacity-70"
                        style={{ fontFamily: MODAL_FONT }}
                      >
                        ← Back to sign in
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </>
      )}
    </NavbarCart>
  )
}

