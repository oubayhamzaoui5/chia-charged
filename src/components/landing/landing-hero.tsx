"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)"

export default function LandingHero() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative w-full overflow-hidden">
      {/* Radial glow overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.18) 0%, transparent 55%)" }}
      />

      {/* Decorative giant watermark — desktop only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[8%] top-[5%] hidden select-none lg:block"
        style={{
          fontSize: "42rem",
          lineHeight: 0.8,
          fontFamily: FONT,
          fontWeight: 900,
          color: "rgba(255,255,255,0.04)",
        }}
      >
        CC
      </div>

      <div className="relative mx-auto flex w-full max-w-[1400px] flex-col items-center gap-3 px-6 pb-6 pt-6 md:px-10 lg:flex-row lg:items-start lg:gap-10 lg:pb-8 lg:pt-20">

        {/* LEFT: Copy */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          className="order-2 flex flex-1 flex-col items-center text-center lg:order-none lg:items-start lg:text-left"
        >
          <h1
            className="mb-4 text-[1.85rem] font-black uppercase leading-[0.85] tracking-tighter sm:text-[3.6rem] lg:mb-12 lg:text-[6rem]"
            style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em", color: "white" }}
          >
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="block"
            >
              Not Your
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="block"
            >
              Average Pudding.
            </motion.span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={loaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-4 flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
          >
            <span
              className="inline-flex w-full sm:w-auto transition-all duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0"
              style={{
                background: GRADIENT,
                padding: "3px",
                borderRadius: "6px",
                boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
              }}
            >
              <Link
                href="#flavors"
                className="shimmer-btn inline-flex h-[44px] w-full items-center justify-center px-8 text-xs font-black uppercase tracking-[0.12em] text-white sm:h-[50px] sm:px-12"
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  background: GRADIENT,
                  borderRadius: "4px",
                }}
              >
                SHOP NOW &#8594;
              </Link>
            </span>
            <Link
              href="#story"
              className="shimmer-btn relative isolate inline-flex h-[44px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-sm border-3 border-black px-8 text-xs font-black uppercase tracking-[0.12em] text-black transition-all duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,0.6)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_rgba(0,0,0,0.6)] sm:h-[56px] sm:w-auto sm:px-12"
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                background: "white",
                boxShadow: "4px 4px 0 rgba(0,0,0,0.6)",
              }}
            >
              Our Story
              <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={loaded ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="flex items-center gap-0 rounded-sm border-3 border-black bg-white"
            style={{ boxShadow: "4px 4px 0 rgba(0,0,0,0.3)" }}
          >
            {[
              ["22g", "Protein"],
              ["12g", "Fiber"],
              ["0%", "Junk"],
              ["MCT", "Oil"],
            ].map(([stat, label], i) => (
              <div
                key={label}
                className={`flex flex-col items-center px-3 py-2 text-center sm:px-6 sm:py-3 ${i > 0 ? "border-l-2 border-black" : ""}`}
              >
                <span
                  className="text-sm font-black sm:text-xl"
                  style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                >
                  {stat}
                </span>
                <span
                  className="text-[7px] font-black uppercase tracking-[0.18em] sm:text-[9px]"
                  style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* MOBILE + TABLET: Product showcase — shown FIRST on mobile (hidden lg+) */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={loaded ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
          className="order-1 relative w-full lg:hidden"
          style={{ minHeight: 300 }}
        >
          {/* White glow behind products */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: "80%",
              height: "80%",
              background: "radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, transparent 60%)",
              filter: "blur(30px)",
            }}
          />

          {/* Strawberry — front-right */}
          <motion.div
            initial={{ opacity: 0, x: 30, rotate: 5 }}
            animate={loaded ? { opacity: 1, x: 0, rotate: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="absolute -right-[16%] top-1/2 -translate-y-1/2 z-20"
            style={{ width: 330, height: 374 }}
          >
            <Image
              src="/product1.webp"
              alt="Chia Charged Pudding Fraises et Creme"
              fill
              priority
              className="object-contain"
              style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.28))" }}
            />
          </motion.div>

          {/* Chocolate — back-left */}
          <motion.div
            initial={{ opacity: 0, x: -30, rotate: -5 }}
            animate={loaded ? { opacity: 1, x: 0, rotate: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.42 }}
            className="absolute -left-[16%] top-1/2 -translate-y-1/2 z-10"
            style={{ width: 310, height: 332 }}
          >
            <Image
              src="/product2.webp"
              alt="Chia Charged Pudding Chocolat"
              fill
              priority
              className="object-contain"
              style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.28))" }}
            />
          </motion.div>

    
        </motion.div>

        {/* RIGHT: Product showcase — desktop lg+ only */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={loaded ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative hidden flex-1 items-center justify-center lg:flex"
          style={{ minHeight: 520 }}
        >
          {/* White glow behind products */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: "70%",
              height: "70%",
              background: "radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 60%)",
              filter: "blur(30px)",
            }}
          />
          {/* Strawberry — back-right */}
          <motion.div
            initial={{ opacity: 0, x: 30, rotate: 5 }}
            animate={loaded ? { opacity: 1, x: 0, rotate: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="absolute right-[-6%] top-[2%] z-10 h-[354px] w-[354px] sm:h-[426px] sm:w-[426px] lg:h-[540px] lg:w-[540px]"
          >
            <Image
              src="/product1.webp"
              alt="Chia Charged Pudding Fraises et Creme — 22g proteine par portion"
              fill
              priority
              className="relative z-10 object-contain drop-shadow-2xl"
              style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.25))" }}
            />
          </motion.div>

          {/* Chocolate — front-left */}
          <motion.div
            initial={{ opacity: 0, x: -30, rotate: -5 }}
            animate={loaded ? { opacity: 1, x: 0, rotate: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.42 }}
            className="absolute bottom-[0%] left-[-4%] z-0 h-[306px] w-[306px] sm:h-[378px] sm:w-[378px] lg:h-[462px] lg:w-[462px]"
          >
            <Image
              src="/product2.webp"
              alt="Chia Charged Pudding Chocolat — riche en proteine et fibre"
              fill
              priority
              className="relative z-10 object-contain drop-shadow-2xl"
              style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.25))" }}
            />
          </motion.div>

          {/* Floating pills — left side */}
          <div
            className="badge-float-a absolute left-[0%] top-[28%] z-20 flex items-center gap-1.5 rounded-sm border-3 border-black px-3 py-1.5"
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              background: "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(237,224,255,0.9) 100%)",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
              color: "#111",
            }}
          >
            22g Protein/Serving
          </div>
          <div
            className="badge-float-b absolute left-[4%] bottom-[28%] z-20 flex items-center gap-1.5 rounded-sm border-3 border-black px-3 py-1.5"
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              background: "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,224,230,0.9) 100%)",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
              color: "#111",
            }}
          >
            100% Natural
          </div>
          {/* Floating pills — right side */}
          <div
            className="badge-float-c absolute right-[2%] top-[18%] z-20 flex items-center gap-1.5 rounded-sm border-3 border-black px-3 py-1.5"
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              background: "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,230,210,0.9) 100%)",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
              color: "#111",
            }}
          >
            Chia Seed
          </div>
          <div
            className="badge-float-d absolute right-[8%] bottom-[20%] z-20 flex items-center gap-1.5 rounded-sm border-3 border-black px-3 py-1.5"
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              background: "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(224,235,255,0.9) 100%)",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
              color: "#111",
            }}
          >
            MCT Oil
          </div>
        </motion.div>
      </div>

    </section>
  )
}
