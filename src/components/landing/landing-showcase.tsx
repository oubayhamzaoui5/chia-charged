"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

export default function LandingShowcase() {
  return (
    <>
      {/* Strawberry showcase */}
      <section
        className="overflow-hidden border-y-3 border-black py-20 md:py-28"
        style={{ background: "#fff5f7" }}
      >
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-10 px-6 lg:flex-row lg:gap-16 lg:px-10">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative flex flex-1 justify-center"
          >
            <div className="relative h-72 w-72 md:h-[400px] md:w-[400px] lg:h-[480px] lg:w-[480px]">
              <Image
                src="/strawberry.png"
                alt="Pudding Proteine Chia Charged Fraises et Creme"
                fill
                className="relative z-10 object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.03]"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex-1"
          >
            <span
              className="mb-5 inline-flex rounded-sm border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white"
              style={{ fontFamily: FONT, fontWeight: 900, background: "#E8446A", boxShadow: "3px 3px 0 #111" }}
            >
              Signature Flavor
            </span>
            <h2
              className="mb-5 text-[2.5rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[3.5rem] lg:text-[4.5rem]"
              style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em", color: "#111" }}
            >
              Strawberries<br />n&apos; Cream
            </h2>
            <p className="mb-7 max-w-sm text-sm font-bold leading-relaxed" style={{ color: "rgba(0,0,0,0.5)" }}>
              Real strawberries. Creamy texture. Zero added sugar — pure indulgence that actually fuels you.
            </p>
            <div className="mb-8 flex flex-wrap gap-2">
              {["Real Strawberries", "0g Sugar", "Ready to Eat", "22g Protein/Serving"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-sm border-2 border-black/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider"
                  style={{ fontFamily: FONT, fontWeight: 900, color: "#E8446A" }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href="/product/pudding-proteine-aux-graines-de-chia-saveur-fraises-et-creme"
              className="shimmer-btn relative isolate inline-flex h-13 items-center justify-center overflow-hidden rounded-sm border-3 border-black px-8 text-sm font-black uppercase tracking-[0.12em] text-white transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#111] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#111]"
              style={{ fontFamily: FONT, fontWeight: 900, background: "#E8446A", boxShadow: "4px 4px 0 #111" }}
            >
              Shop Strawberry &#8594;
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Chocolate showcase */}
      <section
        className="overflow-hidden py-20 md:py-28"
        style={{
          backgroundColor: "#f5efe4",
          backgroundImage: "url('/texture.webp')",
          backgroundSize: "280px 280px",
        }}
      >
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-10 px-6 lg:flex-row-reverse lg:gap-16 lg:px-10">
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative flex flex-1 justify-center"
          >
            <div className="relative h-72 w-72 md:h-[400px] md:w-[400px] lg:h-[480px] lg:w-[480px]">
              <Image
                src="/chocolate.png"
                alt="Pudding Proteine Chia Charged Chocolat"
                fill
                className="relative z-10 object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.03]"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex-1"
          >
            <span
              className="mb-5 inline-flex rounded-sm border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white"
              style={{ fontFamily: FONT, fontWeight: 900, background: "#D4813A", boxShadow: "3px 3px 0 #111" }}
            >
              New Flavor
            </span>
            <h2
              className="mb-5 text-[2.5rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[3.5rem] lg:text-[4.5rem]"
              style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em", color: "#111" }}
            >
              Chocolate<br />Chips
            </h2>
            <p className="mb-7 max-w-sm text-sm font-bold leading-relaxed" style={{ color: "rgba(0,0,0,0.5)" }}>
              Rich, deep chocolate taste loaded with protein. Your cravings deserve more than compromise.
            </p>
            <div className="mb-8 flex flex-wrap gap-2">
              {["Rich Chocolate", "22g Protein/Serving", "MCT Oil", "Plant-Based"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-sm border-2 border-black/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider"
                  style={{ fontFamily: FONT, fontWeight: 900, color: "#D4813A" }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href="/shop"
              className="shimmer-btn relative isolate inline-flex h-13 items-center justify-center overflow-hidden rounded-sm border-3 border-black px-8 text-sm font-black uppercase tracking-[0.12em] text-white transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#111] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#111]"
              style={{ fontFamily: FONT, fontWeight: 900, background: "#D4813A", boxShadow: "4px 4px 0 #111" }}
            >
              Shop Chocolate &#8594;
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
