"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

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

      {/* Decorative giant watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[8%] top-[5%] select-none"
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


      <div className="relative mx-auto flex w-full max-w-[1400px] flex-col items-center gap-6 px-6 pb-10 pt-8 md:px-10 lg:flex-row lg:items-start lg:gap-10 lg:pb-8 lg:pt-20">
        {/* LEFT: Copy */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left"
        >
          <h1
            className="mb-12 text-[3.2rem] font-black uppercase leading-[0.85] tracking-tighter sm:text-[4.5rem] lg:text-[6rem]"
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
            className="mb-6 flex flex-wrap items-center gap-4"
          >
            <span
              className="inline-flex transition-all duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0"
              style={{
                background: GRADIENT,
                padding: "3px",
                borderRadius: "6px",
                boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
              }}
            >
              <Link
                href="/boutique"
                className="shimmer-btn inline-flex h-[50px] items-center justify-center px-10 text-sm font-black uppercase tracking-[0.15em] text-white"
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  background: GRADIENT,
                  borderRadius: "4px",
                }}
              >
                Shop Now &#8594;
              </Link>
            </span>
            <Link
              href="#flavors"
              className="inline-flex h-[56px] items-center justify-center px-8 text-sm font-black uppercase tracking-[0.12em] text-white transition-all duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0"
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                border: "4px solid white",
                backgroundColor: "transparent",
                borderRadius: "4px",
                boxShadow: "4px 4px 0 rgba(0,0,0,0.2)",
              }}
            >
              Our Flavors
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
                className={`flex flex-col items-center px-4 py-3 sm:px-6 ${i > 0 ? "border-l-2 border-black" : ""}`}
              >
                <span
                  className="text-xl font-black sm:text-2xl"
                  style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                >
                  {stat}
                </span>
                <span
                  className="text-[8px] font-black uppercase tracking-[0.18em] sm:text-[9px]"
                  style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT: Product showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={loaded ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative flex flex-1 items-center justify-center"
          style={{ minHeight: 440 }}
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
          {/* Strawberry â€” back-right */}
          <motion.div
            initial={{ opacity: 0, x: 30, rotate: 5 }}
            animate={loaded ? { opacity: 1, x: 0, rotate: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="absolute right-[-1%] top-[2%] z-10 h-[295px] w-[295px] sm:h-[355px] sm:w-[355px] lg:h-[450px] lg:w-[450px]"
          >
            <Image
              src="/strawberry.png"
              alt="Chia Charged Pudding Fraises et Creme â€” 22g proteine par pot"
              fill
              priority
              className="relative z-10 object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.04]"
              style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.25))" }}
            />
          </motion.div>

          {/* Chocolate â€” front-left */}
          <motion.div
            initial={{ opacity: 0, x: -30, rotate: -5 }}
            animate={loaded ? { opacity: 1, x: 0, rotate: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.42 }}
            className="absolute bottom-[0%] left-[-1%] z-0 h-[255px] w-[255px] sm:h-[315px] sm:w-[315px] lg:h-[385px] lg:w-[385px]"
          >
            <Image
              src="/chocolate.png"
              alt="Chia Charged Pudding Chocolat â€” riche en proteine et fibre"
              fill
              priority
              className="relative z-10 object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.04]"
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
            22g Protein
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
            className="badge-float-d absolute right-[0%] bottom-[20%] z-20 flex items-center gap-1.5 rounded-sm border-3 border-black px-3 py-1.5"
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
