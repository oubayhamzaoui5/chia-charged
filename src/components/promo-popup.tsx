'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"
const STORAGE_KEY = 'cc_promo_dismissed_at'
const DELAY_MS = 3500
const COOLDOWN_MS = 2 * 60 * 60 * 1000 // 2 hours

export default function PromoPopup() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    async function initPopup() {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        if (res.ok && data?.user?.id) return
      } catch {
        // fallback to popup behavior if auth check fails
      }

      try {
        const dismissed = localStorage.getItem(STORAGE_KEY)
        if (dismissed && Date.now() - Number(dismissed) < COOLDOWN_MS) return
      } catch {
        // SSR / privacy mode
      }

      timer = setTimeout(() => {
        if (!cancelled) setVisible(true)
      }, DELAY_MS)
    }

    void initPopup()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (visible) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.paddingRight = `${scrollbarWidth}px`
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [visible])

  function handleClose() {
    setVisible(false)
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* ignore */ }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    const captured = email.trim()
    handleClose()
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-signup-modal', { detail: { email: captured } }))
    }, 350)
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.88, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div
              className="relative flex w-full max-w-[860px] overflow-hidden rounded-sm"
              style={{ border: '4px solid #111', boxShadow: '10px 10px 0 #111' }}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                aria-label="Close"
                className="absolute right-3 top-3 z-20 flex h-11 w-11 cursor-pointer items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
              >
                <X size={22} strokeWidth={2.5} />
              </button>

              {/* LEFT — image panel */}
              <div className="relative hidden w-[42%] shrink-0 sm:block" style={{ minHeight: 500 }}>
                <Image
                  src="/popup-promo.webp"
                  alt="Chia Charged — 10% off your first order"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Bottom badge */}
                <div
                  className="absolute bottom-5 left-4 right-4 px-4 py-3"
                  style={{ background: '#fff', border: '3px solid #111', boxShadow: '4px 4px 0 #111' }}
                >
                  <p
                    className="text-[9px] uppercase tracking-[0.2em] text-black/40"
                    style={{ fontFamily: FONT, fontWeight: 900 }}
                  >
                    Real Ingredients
                  </p>
                  <p
                    className="mt-0.5 text-[13px] uppercase leading-tight"
                    style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                  >
                    22g Protein/Serving &middot; 12g Fiber &middot; MCT Oil
                  </p>
                </div>
              </div>

              {/* RIGHT — content panel */}
              <div
                className="relative flex flex-1 flex-col justify-center overflow-hidden px-7 py-10 sm:px-10"
                style={{ background: GRADIENT }}
              >
                {/* Watermark */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-6 top-[-10%] select-none"
                  style={{
                    fontSize: '18rem',
                    fontFamily: FONT,
                    fontWeight: 900,
                    color: 'rgba(255,255,255,0.06)',
                    lineHeight: 0.85,
                  }}
                >
                  CC
                </div>

                <div className="relative z-10">
                  {/* Eyebrow badge */}
                  <div
                    className="mb-5 inline-flex items-center gap-2 px-3 py-1.5"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: '2px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <span className="h-2 w-2 rounded-full bg-white/80" />
                    <span
                      className="text-[9px] uppercase tracking-[0.25em] text-white/90"
                      style={{ fontFamily: FONT, fontWeight: 900 }}
                    >
                      Exclusive Welcome Offer
                    </span>
                  </div>

                  <>
                      {/* Headline */}
                      <h2
                        className="mb-1 text-[3rem] uppercase leading-[0.88] tracking-tighter text-white sm:text-[3.4rem]"
                        style={{ fontFamily: FONT, fontWeight: 900 }}
                      >
                        Get
                      </h2>
                      <div className="mb-2">
                        <span
                          className="inline-block px-2 py-0.5 text-[3rem] uppercase leading-[0.88] tracking-tighter sm:text-[3.4rem]"
                          style={{
                            fontFamily: FONT,
                            fontWeight: 900,
                            color: '#111',
                            background: '#fff',
                            transform: 'rotate(-1.5deg)',
                            display: 'inline-block',
                          }}
                        >
                          10% Off
                        </span>
                      </div>
                      <p
                        className="mb-1 text-[1.25rem] uppercase leading-tight text-white/90"
                        style={{ fontFamily: FONT, fontWeight: 900 }}
                      >
                        Your First Order
                      </p>
                      <p
                        className="mb-7 text-[10px] uppercase tracking-[0.15em] text-white/45"
                        style={{ fontFamily: FONT, fontWeight: 900 }}
                      >
                        Join the Chia Charged community
                      </p>

                      {/* Email form */}
                      <form onSubmit={handleSubmit} className="space-y-3">
                        <div
                          className="flex items-stretch"
                          style={{
                            border: '3px solid #111',
                            background: '#fff',
                            boxShadow: '4px 4px 0 #111',
                          }}
                        >
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-semibold text-black outline-none placeholder:text-black/30"
                          />
                          <button
                            type="submit"
                            className="shrink-0 cursor-pointer px-5 py-3 text-[11px] uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
                            style={{
                              fontFamily: FONT,
                              fontWeight: 900,
                              background: '#111',
                              borderLeft: '3px solid #111',
                            }}
                          >
                            Claim
                          </button>
                        </div>
                        <p
                          className="text-[9px] uppercase tracking-[0.1em] text-white/35"
                          style={{ fontFamily: FONT, fontWeight: 900 }}
                        >
                          No spam. Unsubscribe anytime. Valid on first order only.
                        </p>
                      </form>

                      {/* Stats strip */}
                      <div className="mt-8 flex gap-6 border-t border-white/15 pt-5">
                        {[
                          ['1000+', 'Customers'],
                          ['22g', 'Protein/Serving'],
                          ['100%', 'Natural'],
                        ].map(([val, label]) => (
                          <div key={label}>
                            <p
                              className="text-lg uppercase leading-none text-white"
                              style={{ fontFamily: FONT, fontWeight: 900 }}
                            >
                              {val}
                            </p>
                            <p
                              className="text-[8px] uppercase tracking-[0.15em] text-white/40"
                              style={{ fontFamily: FONT, fontWeight: 900 }}
                            >
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                  </>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
