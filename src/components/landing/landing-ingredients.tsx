"use client"

import { motion } from "framer-motion"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

const ingredients = [
  { name: "Chia Seeds", desc: "Rich in omega-3, fiber and antioxidants. The ultimate superfood.", emoji: "🌱" },
  { name: "Plant Protein", desc: "22g of high-quality protein for muscle recovery.", emoji: "💪" },
  { name: "MCT Oil", desc: "Healthy fats for energy, focus and metabolism.", emoji: "⚡" },
  { name: "Real Fruit", desc: "Real strawberries or real chocolate — never artificial flavors.", emoji: "🍓" },
]

export default function LandingIngredients() {
  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      style={{
        backgroundColor: "#f5efe4",
        backgroundImage: "url('/texture.webp')",
        backgroundSize: "280px 280px",
      }}
    >
      {/* Decorative watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[3%] bottom-[5%] select-none"
        style={{
          fontSize: "28rem",
          lineHeight: 0.8,
          fontFamily: FONT,
          fontWeight: 900,
          background: GRADIENT,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          opacity: 0.04,
        }}
      >
        ★
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
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
            What&apos;s{" "}
            <span
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Inside.
            </span>
          </h2>
          <p
            className="mt-3 text-sm font-black uppercase tracking-[0.15em]"
            style={{ fontFamily: FONT, fontWeight: 900, color: "rgba(0,0,0,0.35)" }}
          >
            Simple, pure, powerful ingredients.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {ingredients.map((item, i) => {
            const rotations = ["-1.5deg", "1deg", "-0.8deg", "1.3deg"]
            const rot = rotations[i % rotations.length]
            return (
              <motion.div
                key={item.name}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } },
                }}
                className="group p-6 text-center transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1"
                style={{
                  background: "white",
                  border: "4px solid #111",
                  borderRadius: "14px",
                  boxShadow: "8px 8px 0 #111",
                  transform: `rotate(${rot})`,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.boxShadow = "12px 12px 0 #111"
                  ;(e.currentTarget as HTMLElement).style.transform = "rotate(0deg)"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.boxShadow = "8px 8px 0 #111"
                  ;(e.currentTarget as HTMLElement).style.transform = `rotate(${rot})`
                }}
              >
                <div className="mb-4 text-4xl transition-transform duration-300 group-hover:scale-110">
                  {item.emoji}
                </div>
                <h3
                  className="mb-2 text-sm font-black uppercase tracking-wide"
                  style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                >
                  {item.name}
                </h3>
                <p className="text-sm font-semibold leading-relaxed" style={{ color: "rgba(0,0,0,0.45)" }}>
                  {item.desc}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
