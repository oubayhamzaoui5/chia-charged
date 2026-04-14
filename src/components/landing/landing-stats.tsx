"use client"

import { motion } from "framer-motion"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"

const stats = [
  { value: "500+", label: "Happy Customers" },
  { value: "22g", label: "Protein Per Serving" },
  { value: "100%", label: "Natural Ingredients" },
  { value: "4.8", label: "Average Rating", suffix: "★" },
]

export default function LandingStats() {
  return (
    <section className="relative border-b-3 border-black">
      <div className="mx-auto max-w-[1400px] px-6 py-6 md:py-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-2 gap-0 md:flex md:flex-wrap md:items-center md:justify-center"
        >
          {stats.map(({ value, label, suffix }, i) => (
            <motion.div
              key={label}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
              }}
              className={[
                "flex flex-col items-center px-4 py-4 text-center md:px-14 md:py-2",
                i % 2 === 1 ? "border-l-2 border-white/20" : "",
                i >= 2 ? "border-t-2 border-white/20 md:border-t-0" : "",
                i > 0 ? "md:border-l-2 md:border-white/20" : "",
              ].filter(Boolean).join(" ")}
            >
              <span
                className="text-2xl font-black text-white sm:text-3xl md:text-4xl"
                style={{ fontFamily: FONT, fontWeight: 900 }}
              >
                {value}
                {suffix && <span className="text-white/80">{suffix}</span>}
              </span>
              <span
                className="mt-1 text-[8px] font-black uppercase tracking-[0.15em] text-white/60 sm:text-[9px] sm:tracking-[0.18em]"
                style={{ fontFamily: FONT, fontWeight: 900 }}
              >
                {label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
