"use client"

import Link from "next/link"
import { useState } from "react"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

export default function Footer() {
  const [footerEmail, setFooterEmail] = useState("")

  function handleFooterSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!footerEmail.trim()) return
    const captured = footerEmail.trim()
    setFooterEmail("")
    window.dispatchEvent(new CustomEvent("open-signup-modal", { detail: { email: captured } }))
  }

  return (
    <footer aria-label="Site footer">
      <div
        className="relative overflow-hidden border-t-3 border-black"
        style={{ background: GRADIENT }}
      >
        {/* Decorative watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[6%] -top-[15%] select-none"
          style={{
            fontSize: "34rem",
            lineHeight: 0.8,
            fontFamily: FONT,
            fontWeight: 900,
            color: "rgba(255,255,255,0.06)",
          }}
        >
          CC
        </div>

        <div className="relative mx-auto max-w-[1400px] px-6 pb-10 pt-16 md:px-10">
          {/* ── Top row: brand + newsletter ── */}
          <div className="mb-14 flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2
                className="text-[2.5rem] font-black uppercase leading-[0.88] tracking-tighter text-white md:text-[3.5rem]"
                style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em" }}
              >
                CHIA{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, rgb(185,58,210) 20%, rgb(232,68,106) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    WebkitTextStroke: "1.5px #ffffff",
                  }}
                >
                  CHARGED
                </span>
              </h2>
              <p
                className="mt-3 max-w-xs text-xs font-black uppercase leading-relaxed tracking-[0.12em] text-white"
                style={{ fontFamily: FONT, fontWeight: 900 }}
              >
                High-protein chia seed pudding. Real ingredients. Real results.
              </p>
            </div>

            {/* Newsletter signup */}
            <div className="w-full max-w-md">
              <p
                className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-white"
                style={{ fontFamily: FONT, fontWeight: 900 }}
              >
                Sign up to get 10% off your first order
              </p>
              <form className="flex" onSubmit={handleFooterSignup}>
                <input
                  type="email"
                  required
                  value={footerEmail}
                  onChange={e => setFooterEmail(e.target.value)}
                  placeholder="Your email"
                  className="h-13 flex-1 border-3 border-r-0 border-white bg-white/95 px-4 text-sm font-bold text-black outline-none placeholder:text-black/30"
                  style={{ borderRadius: "4px 0 0 4px" }}
                />
                <button
                  type="submit"
                  className="shimmer-btn relative isolate h-13 overflow-hidden border-3 border-white px-6 text-xs font-black uppercase tracking-widest text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
                  style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    background: GRADIENT,
                    borderRadius: "0 4px 4px 0",
                    cursor: "pointer",
                  }}
                >
                  Sign Up
                </button>
              </form>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="mb-12 h-[3px] w-full bg-white/10" />

          {/* ── Link columns ── */}
          <div className="mb-14 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {/* Shop */}
            <div>
              <p
                className="mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                style={{ fontFamily: FONT, fontWeight: 900 }}
              >
                Shop
              </p>
              <nav className="flex flex-col gap-3">
                {[
                  { label: "All Products", href: "/shop" },
                  { label: "Strawberries n' Cream", href: "/shop" },
                  { label: "New Flavors", href: "/new-arrivals" },
                  { label: "Bundles & Deals", href: "/promotions" },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 hover:translate-x-1"
                    style={{ fontFamily: FONT, fontWeight: 700 }}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Support */}
            <div>
              <p
                className="mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                style={{ fontFamily: FONT, fontWeight: 900 }}
              >
                Support
              </p>
              <nav className="flex flex-col gap-3">
                {[
                  { label: "Contact Us", href: "/#contact" },
                  { label: "Shipping Info", href: "/#faq" },
                  { label: "Returns", href: "/#faq" },
                  { label: "FAQ", href: "/#faq" },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 hover:translate-x-1"
                    style={{ fontFamily: FONT, fontWeight: 700 }}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Company */}
            <div>
              <p
                className="mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                style={{ fontFamily: FONT, fontWeight: 900 }}
              >
                Company
              </p>
              <nav className="flex flex-col gap-3">
                {[
                  { label: "About Us", href: "/about" },
                  { label: "Blog", href: "/blog" },
                  { label: "Privacy Policy", href: "/#faq" },
                  { label: "Terms", href: "/#faq" },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 hover:translate-x-1"
                    style={{ fontFamily: FONT, fontWeight: 700 }}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Socials */}
            <div>
              <p
                className="mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                style={{ fontFamily: FONT, fontWeight: 900 }}
              >
                Follow Us
              </p>
              <div className="flex flex-wrap gap-3">
                {/* Instagram */}
                <a
                  href="#"
                  aria-label="Instagram"
                  className="shimmer-btn relative isolate flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-sm border-3 border-white text-white transition-all duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_rgba(255,255,255,1)] hover:brightness-105 active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_rgba(255,255,255,0.9)]"
                  style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    background: "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 100%)",
                    color: "white",
                  }}
                >
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                {/* Facebook */}
                <a
                  href="#"
                  aria-label="Facebook"
                  className="shimmer-btn relative isolate flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-sm border-3 border-white text-white transition-all duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_rgba(255,255,255,1)] hover:brightness-105 active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_rgba(255,255,255,0.9)]"
                  style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    background: "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 100%)",
                    color: "white",
                  }}
                >
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                {/* TikTok */}
                <a
                  href="#"
                  aria-label="TikTok"
                  className="shimmer-btn relative isolate flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-sm border-3 border-white text-white transition-all duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_rgba(255,255,255,1)] hover:brightness-105 active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_rgba(255,255,255,0.9)]"
                  style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    background: "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 100%)",
                    color: "white",
                  }}
                >
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
            <p
              className="text-[10px] font-black uppercase tracking-[0.15em] text-white"
              style={{ fontFamily: FONT, fontWeight: 900 }}
            >
              &copy; 2026 Chia Charged. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-white/30" />
              <span
                className="text-[10px] font-black uppercase tracking-[0.18em] text-white"
                style={{ fontFamily: FONT, fontWeight: 900 }}
              >
                Real Food. Real Fuel.
              </span>
              <span className="h-2 w-2 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
