"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import ProductCard, { Product } from "@/components/shop/product-card"

gsap.registerPlugin(ScrollTrigger)

export default function BestSellers({ products }: { products: Product[] }) {
  const [page, setPage] = useState(0)
  const [perView, setPerView] = useState(4)

  const intervalRef = useRef<any>(null)
  const AUTO_MS = 5000

  const sectionRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)

  const hasRevealedRef = useRef(false)

  useEffect(() => {
    const calcPerView = () => {
      if (window.innerWidth < 768) return 1
      if (window.innerWidth < 1024) return 2
      return 4
    }
    const update = () => setPerView(calcPerView())
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const pageCount = useMemo(
    () => Math.ceil(products.length / perView),
    [perView, products.length]
  )

  const clearAuto = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  const startAuto = () => {
    clearAuto()
    intervalRef.current = setInterval(() => {
      setPage((p) => (p + 1) % pageCount)
    }, AUTO_MS)
  }

  const goTo = (i: number) => {
    setPage(i)
    startAuto()
  }

  const animateCurrentPage = () => {
    if (!trackRef.current) return

    const panel = trackRef.current.querySelector(`[data-panel="${page}"]`)
    if (!panel) return

    const cards = panel.querySelectorAll(".bs-card")

    gsap.killTweensOf(cards)
    gsap.set(cards, { opacity: 0, y: 30, scale: 0.96 })

    gsap.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      ease: "power2.out",
      stagger: 0.12,
      overwrite: "auto",
    })
  }

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 75%",
      onEnter: () => {
        if (hasRevealedRef.current) return
        hasRevealedRef.current = true

        animateCurrentPage()
        startAuto() // 🔥 start auto only after reveal
      },
      onEnterBack: () => {
        if (hasRevealedRef.current) return
        hasRevealedRef.current = true

        animateCurrentPage()
        startAuto() // 🔥 start auto only after reveal
      },
    })

    return () => trigger.kill()
  }, [pageCount])

  useEffect(() => {
    return () => clearAuto()
  }, [])

  return (
    <section ref={sectionRef} className="py-8 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground text-center mb-2 text-balance">
          Meilleures Ventes
        </h2>
        <p className="text-center text-muted-foreground mb-6">
          Découvrez nos pièces les plus appréciées, sélectionnées pour leur style et leur qualité.
        </p>

        <div className="relative">
          <div className="overflow-x-hidden overflow-y-visible pb-6">
            <div
              ref={trackRef}
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${page * 100}%)` }}
            >
              {Array.from({ length: pageCount }).map((_, i) => {
                const start = i * perView
                const slice = products.slice(start, start + perView)

                return (
                  <div
                    key={i}
                    data-panel={i}
                    className="min-w-full grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 px-1 items-start"
                  >
                    {slice.map((product) => (
                      <div key={product.id} className="bs-card">
                        <ProductCard p={product} categories={[]} />
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Aller à la page ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === page
                  ? "w-8 bg-foreground"
                  : "w-2.5 bg-foreground/30 hover:bg-foreground/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}