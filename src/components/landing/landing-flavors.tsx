"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

type FlavorPriceMap = Record<
  string,
  {
    price: number
    basePrice: number
    promoPrice: number | null
    hasPromo: boolean
    currency: string
  }
>

const flavors = [
  {
    id: "strawberry",
    slug: "strawberries-n-cream-cc-str-4",
    name: "Strawberries n' Cream",
    tagline: "Sweet, fruity & creamy",
    badge: "NEW !",
    image: "/strawberry.webp",
    href: "/product/strawberries-n-cream-cc-str-4",
    price: "14.90",
    accent: "#E8446A",
    rotate: "-1.2deg",
  },
  {
    id: "chocolate",
    slug: "chocolate-chip-cc-chklt-4",
    name: "Chocolate Chips",
    tagline: "Rich, indulgent & satisfying",
    badge: "NEW !",
    image: "/chocolate.webp",
    href: "/product/chocolate-chip-cc-chklt-4",
    price: "14.90",
    accent: "#D4813A",
    rotate: "1.2deg",
  },
]

const cardEase: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.15, ease: cardEase },
  }),
}

export default function LandingFlavors({
  flavorPriceBySlug = {},
}: {
  flavorPriceBySlug?: FlavorPriceMap
}) {
  return (
    <section
      id="flavors"
      className="py-20 md:py-28"
      style={{
        backgroundColor: "#f5efe4",
        backgroundImage: "url('/texture.webp')",
        backgroundSize: "280px 280px",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <h2
            className="text-[2.8rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[4rem] lg:text-[5rem]"
            style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em", color: "#111" }}
          >
            Choose Your{" "}
            <span
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Flavor.
            </span>
          </h2>
          <p
            className="mt-3 text-sm font-black uppercase tracking-[0.15em]"
            style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
          >
            Two Flavors. One Obsession.
          </p>
        </motion.div>

        {/* Flavor cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {flavors.map((flavor, i) => {
            const dynamicPricing = flavorPriceBySlug[flavor.slug]
            const displayCurrency = dynamicPricing?.currency ?? "$"
            const displayPrice = dynamicPricing
              ? dynamicPricing.price.toFixed(2)
              : flavor.price
            const hasPromo = Boolean(dynamicPricing?.hasPromo)
            const oldPrice = hasPromo ? `${displayCurrency}${dynamicPricing!.basePrice.toFixed(2)}` : null

            return (
            <motion.div
              key={flavor.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={cardVariants}
            >
              <Link
                href={flavor.href}
                className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1"
                style={{
                  border: "4px solid #111",
                  borderRadius: "14px",
                  boxShadow: "8px 8px 0 #111",
                  transform: `rotate(${flavor.rotate})`,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.boxShadow = "12px 12px 0 #111"
                  ;(e.currentTarget as HTMLElement).style.transform = "rotate(0deg)"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.boxShadow = "8px 8px 0 #111"
                  ;(e.currentTarget as HTMLElement).style.transform = `rotate(${flavor.rotate})`
                }}
              >
                {hasPromo && (
                  <span
                    className="absolute right-3 top-3 z-20 inline-flex h-6 items-center rounded-sm border-2 border-red-900/40 bg-red-600 px-2 text-[10px] font-black uppercase leading-none tracking-[0.14em] text-white"
                    style={{ fontFamily: FONT, fontWeight: 900 }}
                  >
                    Promo
                  </span>
                )}

                {/* Gradient image area */}
                <div
                  className="relative flex flex-col items-center"
                  style={{ background: GRADIENT }}
                >
                  {/* Radial glow */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: "radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.14) 0%, transparent 65%)" }}
                  />

                  {/* Badge */}
                  <div className="relative z-10 flex w-full p-5 pb-0">
                    <span
                      className="inline-flex h-6 items-center rounded-sm border-2 border-white/30 bg-white/15 px-3 text-[10px] font-black uppercase leading-none tracking-[0.18em] text-white backdrop-blur-sm"
                      style={{ fontFamily: FONT, fontWeight: 900 }}
                    >
                      {flavor.badge}
                    </span>
                  </div>

                  {/* Image */}
                  <div className="relative z-10 mx-auto flex h-96 w-96 items-center justify-center md:h-[460px] md:w-[460px] lg:h-[520px] lg:w-[520px]">
                    <div className="relative h-96 w-96 transition-transform duration-500 group-hover:scale-[1.06] md:h-[460px] md:w-[460px] lg:h-[520px] lg:w-[520px]">
                      <div
                        className="absolute inset-4 rounded-full opacity-30 blur-2xl"
                        style={{ background: "rgba(255,255,255,0.25)" }}
                      />
                      <Image
                        src={flavor.image}
                        alt={`Chia Charged ${flavor.name}`}
                        fill
                        unoptimized
                        className="object-contain drop-shadow-2xl"
                        sizes="(max-width: 768px) 224px, 360px"
                        priority
                      />
                    </div>
                  </div>
                </div>

                {/* White info area */}
                <div className="relative bg-white px-5 pt-5 pb-5">
                  <h3
                    className="text-[1.6rem] font-black uppercase leading-[0.9] tracking-tighter md:text-[2rem]"
                    style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                  >
                    {flavor.name}
                  </h3>
                  <p
                    className="mt-1.5 text-xs font-black uppercase tracking-[0.12em]"
                    style={{ fontFamily: FONT, fontWeight: 900, color: flavor.accent }}
                  >
                    {flavor.tagline}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {["22g Protein/Serving", "12g Fiber", "MCT Oil"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-sm border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white"
                        style={{ fontFamily: FONT, fontWeight: 900, background: GRADIENT, boxShadow: "2px 2px 0 #111" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-2xl font-black"
                        style={{ fontFamily: FONT, fontWeight: 900, color: flavor.accent }}
                      >
                        {displayCurrency}
                        {displayPrice}
                      </span>
                      {hasPromo && oldPrice && (
                        <span
                          className="text-sm font-black text-black/40 line-through"
                          style={{ fontFamily: FONT, fontWeight: 900 }}
                        >
                          {oldPrice}
                        </span>
                      )}
                    </div>
                    <div
                      className="inline-flex items-center gap-2 rounded-sm border-3 border-black px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white transition-all"
                      style={{
                        fontFamily: FONT,
                        fontWeight: 900,
                        background: GRADIENT,
                        boxShadow: "3px 3px 0 #111",
                      }}
                    >
                      Shop Now &#8594;
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
