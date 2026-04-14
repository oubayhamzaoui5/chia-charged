"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)"
const ease = [0.34, 1.56, 0.64, 1] as [number, number, number, number]

export default function LandingCtaFuel() {
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
            <span style={{ color: "white" }}>Fuel Smarter?</span>
          </h2>
          <p
            className="max-w-xl text-sm font-black uppercase tracking-[0.12em]"
            style={{ fontFamily: FONT, fontWeight: 900, color: "white" }}
          >
            Join the hundreds of people who've swapped bad snacks for something that actually works.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => document.getElementById("flavors")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg border-4 border-black bg-white px-8 py-4 text-xs font-black uppercase tracking-[0.15em] text-black transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                boxShadow: "5px 5px 0 #111",
              }}
            >
              Shop Now
              <ArrowRight size={14} />
            </button>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2.5 rounded-lg border-4 border-white bg-transparent px-8 py-4 text-xs font-black uppercase tracking-[0.15em] text-white transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                boxShadow: "5px 5px 0 rgba(0,0,0,0.25)",
              }}
            >
              Read Articles
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
