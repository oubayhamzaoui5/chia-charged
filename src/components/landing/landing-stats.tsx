"use client"

import { motion } from "framer-motion"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

const stats = [
  { value: "500+", label: "Happy Customers" },
  { value: "22g", label: "Protein Per Serving" },
  { value: "100%", label: "Natural Ingredients" },
  { value: "4.8", label: "Average Rating", suffix: "★" },
]

export default function LandingStats() {
  return (
    <section className="relative border-b-3 border-black">
      <div className="mx-auto max-w-[1400px] px-6 py-10 md:py-14">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="flex flex-wrap items-center justify-center gap-0"
        >
          {stats.map(({ value, label, suffix }, i) => (
            <motion.div
              key={label}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
              }}
              className={`flex flex-col items-center px-6 py-2 text-center sm:px-10 md:px-14 ${
                i > 0 ? "border-l-2 border-white/20" : ""
              }`}
            >
              <span
                className="text-3xl font-black text-white sm:text-4xl"
                style={{ fontFamily: FONT, fontWeight: 900 }}
              >
                {value}
                {suffix && <span className="text-white/80">{suffix}</span>}
              </span>
              <span
                className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/60"
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
