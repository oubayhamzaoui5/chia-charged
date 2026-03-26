"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"

export default function HomeMarblePanelSection() {
  return (
    <section style={{ background: "#fff5f7" }} className="overflow-hidden py-16 md:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 lg:flex-row lg:gap-16 lg:px-10">

        {/* Product image */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative flex flex-1 justify-center"
        >
          <div className="relative h-72 w-72 md:h-[400px] md:w-[400px] lg:h-[460px] lg:w-[460px]">
            <div className="absolute inset-0 rounded-full blur-[80px] opacity-20" style={{ background: "#E8446A" }} />
            <Image
              src="/strawberry.png"
              alt="Strawberries n' Cream Pudding"
              fill
              className="relative z-10 object-contain drop-shadow-2xl"
            />
          </div>
        </motion.div>

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="flex-1"
        >
          <span
            className="mb-4 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(232,68,106,0.1)", color: "#E8446A" }}
          >
            Signature Flavor
          </span>

          <h2
            className="mb-4 text-4xl font-black leading-[1.05] text-slate-900 lg:text-5xl"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
          >
            Strawberries<br />n&apos; Cream
          </h2>

          <p className="mb-7 max-w-sm text-base leading-relaxed text-slate-500">
            Real strawberries. Creamy texture. Zero added sugar — pure indulgence that actually fuels you.
          </p>

          <div className="mb-8 flex flex-wrap gap-2">
            {["Real Strawberries", "0g Sugar", "Ready to Eat", "22g Protein"].map((tag) => (
              <span
                key={tag}
                className="rounded-full px-4 py-1.5 text-xs font-bold"
                style={{ background: "rgba(232,68,106,0.08)", color: "#E8446A" }}
              >
                {tag}
              </span>
            ))}
          </div>

          <Link
            href="/product/pudding-proteine-aux-graines-de-chia-saveur-fraises-et-creme"
            className="inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-bold text-white transition-opacity hover:opacity-85"
            style={{ background: "#E8446A", boxShadow: "0 4px 24px rgba(232,68,106,0.35)" }}
          >
            Shop Strawberry →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
