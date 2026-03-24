"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

const PURPLE = "rgb(124,58,237)"
const PURPLE_GLOW = "rgba(124,58,237,0.25)"

export default function HomeTestHero() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t) }, [])

  return (
    <section
      className="relative w-full overflow-hidden flex items-center"
      style={{
        background: "linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 50%, #f0fdf4 100%)",
        minHeight: "100svh",
      }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute right-1/3 top-0 h-[600px] w-[600px] -translate-y-1/4 rounded-full blur-[130px]" style={{ background: "rgba(124,58,237,0.12)" }} />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-[400px] w-[400px] translate-y-1/3 rounded-full blur-[100px]" style={{ background: "rgba(232,68,106,0.10)" }} />
      <div className="pointer-events-none absolute right-0 top-1/2 h-[300px] w-[300px] rounded-full blur-[80px]" style={{ background: "rgba(106,191,105,0.10)" }} />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-10 px-6 py-24 md:px-10 lg:min-h-screen lg:flex-row lg:gap-6 lg:py-0">

        {/* ── LEFT: Copy ── */}
        <div className={`flex flex-1 flex-col items-center text-center transition-all duration-700 lg:items-start lg:text-left ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>

          <span
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ background: "rgba(124,58,237,0.1)", color: PURPLE }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: PURPLE }} />
            Chia Seed Protein Pudding
          </span>

          <h1
            className="mb-5 text-5xl font-black leading-[1.02] tracking-tight text-slate-900 sm:text-6xl lg:text-[4.5rem]"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
          >
            Fuel Smarter.{" "}
            <br className="hidden sm:block" />
            <span
              className="italic"
              style={{
                background: "linear-gradient(135deg, rgb(232,68,106) 0%, rgb(212,58,237) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Taste Better.
            </span>
          </h1>

          <p className="mb-8 max-w-[360px] text-base leading-relaxed text-slate-500">
            22g protein. Zero junk. Two flavors you&apos;ll obsess over.
          </p>

          <div className="mb-10 flex flex-wrap items-center gap-3">
            <Link
              href="/boutique"
              className="shimmer-btn relative isolate inline-flex h-12 items-center justify-center overflow-hidden rounded-full px-8 text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-95"
              style={{ background: PURPLE, boxShadow: `0 4px 24px ${PURPLE_GLOW}` }}
            >
              Shop Now →
            </Link>
            <Link
              href="#flavors"
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-700 transition-all hover:border-violet-200 hover:text-violet-700 hover:shadow-sm"
            >
              Our Flavors
            </Link>
          </div>

          {/* Stats strip */}
          <div className="flex items-center divide-x divide-slate-200">
            {[["22g", "Protein"], ["12g", "Fiber"], ["0g", "Added Sugar"], ["MCT", "Oil"]].map(([stat, label]) => (
              <div key={label} className="flex flex-col items-center px-5 first:pl-0 lg:items-start">
                <span className="text-xl font-black text-slate-900" style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>{stat}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Both products stacked ── */}
        <div
          className={`relative flex flex-1 items-center justify-center transition-all duration-1000 delay-200 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          style={{ minHeight: 420 }}
        >
          {/* Strawberry — back-right */}
          <div className="absolute right-[4%] top-[4%] h-[280px] w-[280px] sm:h-[340px] sm:w-[340px] lg:h-[400px] lg:w-[400px]">
            <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ background: "rgb(232,68,106)" }} />
            <Image src="/strawberry.png" alt="Strawberries n' Cream" fill priority className="relative z-10 object-contain drop-shadow-2xl" />
          </div>

          {/* Chocolate — front-left */}
          <div className="absolute bottom-[4%] left-[4%] z-10 h-[240px] w-[240px] sm:h-[295px] sm:w-[295px] lg:h-[350px] lg:w-[350px]">
            <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ background: "rgb(212,129,58)" }} />
            <Image src="/chocolate.png" alt="Chocolate Chips" fill priority className="relative z-10 object-contain drop-shadow-2xl" />
          </div>

          {/* Floating pills */}
          <div className="badge-float-a absolute left-[2%] top-[18%] z-20 flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="whitespace-nowrap text-[11px] font-bold text-slate-800">Plant-Based</span>
          </div>
          <div className="badge-float-c absolute right-[2%] bottom-[22%] z-20 flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="whitespace-nowrap text-[11px] font-bold text-slate-800">MCT Oil</span>
          </div>
        </div>
      </div>
    </section>
  )
}
