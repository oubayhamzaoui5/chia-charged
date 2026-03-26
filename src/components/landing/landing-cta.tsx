"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

export default function LandingCta() {
  return (
    <section
      className="relative overflow-hidden border-y-3 border-black py-20 md:py-28"
      style={{ background: GRADIENT }}
    >
      {/* Decorative watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[5%] -top-[10%] select-none"
        style={{
          fontSize: "36rem",
          lineHeight: 0.8,
          fontFamily: FONT,
          fontWeight: 900,
          color: "rgba(255,255,255,0.06)",
        }}
      >
        CC
      </div>

      <div className="relative mx-auto flex max-w-[1400px] flex-col items-center gap-10 px-6 lg:flex-row lg:gap-16 lg:px-10">
        {/* Product images */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative flex flex-1 items-center justify-center"
          style={{ minHeight: 320 }}
        >
          <div className="absolute left-[8%] top-[5%] h-[200px] w-[200px] sm:h-[260px] sm:w-[260px] lg:h-[300px] lg:w-[300px]">
            <Image
              src="/strawberry.png"
              alt="Chia Charged Fraises"
              fill
              className="object-contain drop-shadow-2xl"
            />
          </div>
          <div className="absolute bottom-[5%] right-[8%] h-[180px] w-[180px] sm:h-[230px] sm:w-[230px] lg:h-[270px] lg:w-[270px]">
            <Image
              src="/chocolate.png"
              alt="Chia Charged Chocolat"
              fill
              className="object-contain drop-shadow-2xl"
            />
          </div>
        </motion.div>

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left"
        >
          <h2
            className="mb-6 text-[2.5rem] font-black uppercase leading-[0.88] tracking-tighter text-white md:text-[3.5rem] lg:text-[4.5rem]"
            style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em" }}
          >
            Ready to<br />
            <span style={{ color: "rgba(255,255,255,0.5)" }}>Charge</span> Your Day?
          </h2>
          <p
            className="mb-8 max-w-md text-sm font-black uppercase leading-relaxed tracking-[0.1em] text-white/50"
            style={{ fontFamily: FONT, fontWeight: 900 }}
          >
            Join hundreds who transformed their routine with Chia Charged.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/shop"
              className="shimmer-btn relative isolate inline-flex h-14 items-center justify-center overflow-hidden rounded-sm border-3 border-black px-10 text-sm font-black uppercase tracking-[0.15em] text-black transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,0.6)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_rgba(0,0,0,0.6)]"
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                background: "white",
                boxShadow: "4px 4px 0 rgba(0,0,0,0.6)",
              }}
            >
              Shop Now &#8594;
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-14 items-center justify-center rounded-sm border-3 border-white/30 px-8 text-sm font-black uppercase tracking-[0.12em] text-white/80 transition-all duration-200 hover:border-white/50 hover:text-white"
              style={{ fontFamily: FONT, fontWeight: 900 }}
            >
              Contact Us
            </Link>
          </div>

          {/* Trust signals */}
          <div className="mt-10 flex flex-wrap items-center gap-6">
            {["Fast Delivery", "Natural Ingredients", "Satisfaction Guaranteed"].map((text) => (
              <div key={text} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white/60" />
                <span
                  className="text-[9px] font-black uppercase tracking-[0.15em] text-white/40"
                  style={{ fontFamily: FONT, fontWeight: 900 }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
