"use client"

import { motion } from "framer-motion"
import { Zap, Leaf, ShieldCheck, Droplets, Heart, Sparkles } from "lucide-react"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)"

const features = [
  {
    icon: Zap,
    stat: "22g",
    unit: "Protein/Serving",
    title: "High Protein, Real Results",
    desc: "Fuel muscle recovery, stay satiated, and power through your day — every single serving.",
    rotate: "-1deg",
  },
  {
    icon: Leaf,
    stat: "12g",
    unit: "Fiber",
    title: "Gut-Friendly Fiber",
    desc: "Chia gel slows digestion, stabilises blood sugar, and keeps you full for hours.",
    rotate: "0.5deg",
  },
  {
    icon: ShieldCheck,
    stat: "0%",
    unit: "Junk",
    title: "Clean Ingredients Only",
    desc: "No artificial sweeteners. No fillers. No compromises — ever.",
    rotate: "-0.8deg",
  },
  {
    icon: Droplets,
    stat: "MCT",
    unit: "Oil",
    title: "MCT Oil Energy",
    desc: "Healthy fats that boost metabolism and mental focus all day long.",
    rotate: "1.2deg",
  },
  {
    icon: Heart,
    stat: "Low",
    unit: "Added Sugar",
    title: "Lower Added Sugar",
    desc: "Lightly sweetened for balance, with flavor that still hits.",
    rotate: "-0.5deg",
  },
  {
    icon: Sparkles,
    stat: "100%",
    unit: "Plant-Based",
    title: "Fully Plant-Based",
    desc: "No dairy, no eggs, no animal products. Pure, nutritious, works for everyone.",
    rotate: "0.8deg",
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const cardEase: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: cardEase },
  },
}

export default function LandingBenefits() {
  return (
    <section
      className="border-y-3 border-black px-3 py-10 md:px-4 md:py-24"
      style={{ background: GRADIENT }}
    >
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 md:mb-14"
        >
          <h2
            className="text-[1.9rem] font-black uppercase leading-[0.88] tracking-tighter text-white md:text-[3.5rem] lg:text-[5rem]"
            style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em" }}
          >
            Why Chia Charged?
          </h2>
          <p
            className="mt-3 text-sm font-black uppercase tracking-[0.15em] text-white"
            style={{ fontFamily: FONT, fontWeight: 900 }}
          >
            Every jar is designed to fuel your body with the best
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6"
        >
          {features.map(({ icon: Icon, stat, unit, title, desc, rotate }) => (
            <motion.div key={title} variants={cardVariants}>
              <div
                className="group relative overflow-hidden p-3 md:p-7"
                style={{
                  background: "white",
                  border: "4px solid #111",
                  borderRadius: "14px",
                  boxShadow: "8px 8px 0 rgba(0,0,0,0.6)",
                  transform: `rotate(${rotate})`,
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.boxShadow = "12px 12px 0 rgba(0,0,0,0.6)"
                  ;(e.currentTarget as HTMLElement).style.transform = "rotate(0deg) translate(-4px, -4px)"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.boxShadow = "8px 8px 0 rgba(0,0,0,0.6)"
                  ;(e.currentTarget as HTMLElement).style.transform = `rotate(${rotate})`
                }}
              >
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center md:mb-4 md:h-14 md:w-14">
                <Icon className="h-5 w-5 md:h-8 md:w-8" strokeWidth={2.5} style={{ color: "rgb(68,15,195)" }} />
              </div>
              <div className="mb-2 flex items-baseline gap-1 md:mb-3 md:gap-1.5">
                <span
                  className="text-xl font-black md:text-4xl"
                  style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                >
                  {stat}
                </span>
                <span
                  className="text-[9px] font-black uppercase tracking-wider md:text-xs"
                  style={{ fontFamily: FONT, fontWeight: 900, color: "rgba(0,0,0,0.25)" }}
                >
                  {unit}
                </span>
              </div>
              <h3
                className="mb-1.5 text-[10px] font-black uppercase tracking-wide md:mb-2 md:text-sm"
                style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
              >
                {title}
              </h3>
              <p className="text-[10px] font-semibold leading-relaxed md:text-sm" style={{ color: "rgba(0,0,0,0.45)" }}>
                {desc}
              </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
