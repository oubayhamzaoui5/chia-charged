"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

const ease: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

export default function LandingCtaBanner() {
  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      style={{ background: GRADIENT }}
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="flex flex-col items-center gap-8 text-center"
        >
          <h2
            className="text-[2.8rem] font-black uppercase leading-[0.88] tracking-tighter text-white md:text-[4.5rem] lg:text-[6rem]"
            style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em" }}
          >
            Ready To
            <br />
            <span style={{ color: "white" }}>
              Fuel Smarter?
            </span>
          </h2>
          <p
            className="max-w-xl text-sm font-black uppercase tracking-[0.12em]"
            style={{ fontFamily: FONT, fontWeight: 900, color: "white" }}
          >
            Join the hundreds of people who've swapped bad snacks for something that actually works.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
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
                href="/#flavors"
                className="shimmer-btn inline-flex h-[50px] items-center justify-center px-12 text-xs font-black uppercase tracking-[0.12em] text-white"
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
              href="/blog"
              className="shimmer-btn relative isolate inline-flex h-[56px] items-center gap-2.5 overflow-hidden rounded-sm border-3 border-black px-12 text-xs font-black uppercase tracking-[0.12em] text-black transition-all duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,0.6)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_rgba(0,0,0,0.6)]"
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                background: "white",
                boxShadow: "4px 4px 0 rgba(0,0,0,0.6)",
              }}
            >
              Read Articles
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
