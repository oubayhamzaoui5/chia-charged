"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Leaf,
  Zap,
  ShieldCheck,
  Droplets,
  FlaskConical,
  Heart,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import Footer from "@/components/footer"
import LandingCtaBanner from "@/components/landing/landing-cta-banner"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT =
  "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)"

const ease = [0.34, 1.56, 0.64, 1] as [number, number, number, number]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const values = [
  {
    icon: ShieldCheck,
    title: "No Compromise",
    desc: "Every ingredient is chosen with intention. If it doesn't serve your body, it doesn't make the jar. Full stop.",
    rotate: "-1.5deg",
  },
  {
    icon: FlaskConical,
    title: "Science-Backed",
    desc: "22g protein per serving, 12g fiber, MCT oil — each number exists for a reason. We obsess over formulation so you don't have to.",
    rotate: "0.8deg",
  },
  {
    icon: Leaf,
    title: "Real. Always.",
    desc: "100% plant-based, no artificial sweeteners, no fillers, no shortcuts. Real food that actually tastes incredible.",
    rotate: "-0.6deg",
  },
]

const ingredients = [
  {
    icon: Droplets,
    name: "Chia Seeds",
    stat: "12g Fiber",
    why: "The backbone of every jar. Chia seeds form a natural gel that slows digestion, stabilizes blood sugar, and keeps you genuinely full for hours.",
  },
  {
    icon: Zap,
    name: "Premium Protein",
    stat: "22g / Serving",
    why: "High-quality plant protein for muscle recovery, sustained energy, and real satiation — not the chalky kind you've been suffering through.",
  },
  {
    icon: Droplets,
    name: "MCT Oil",
    stat: "Brain Fuel",
    why: "Medium-chain triglycerides convert directly to energy. Mental clarity, metabolic boost, no sugar crash — just clean, sustained power.",
  },
  {
    icon: Heart,
    name: "Zero Junk",
    stat: "0% Fillers",
    why: "No artificial sweeteners, no gums, no mystery additives. If you can't recognize an ingredient, it doesn't belong in your pudding.",
  },
]

const stats = [
  { value: "22g", label: "Protein Per Serving" },
  { value: "12g", label: "Dietary Fiber" },
  { value: "0%", label: "Artificial Junk" },
  { value: "2", label: "Bold Flavors" },
  { value: "100%", label: "Plant-Based" },
  { value: "MCT", label: "Oil Inside" },
]

const ingredientRotations = ["-1deg", "0.7deg", "-0.5deg", "0.9deg"]

export default function AboutPageContent() {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        fontFamily: FONT,
        backgroundColor: "#f5efe4",
        backgroundImage: "url('/texture.webp')",
        backgroundSize: "280px 280px",
      }}
    >
      <Navbar />

      <main>
        <section
          className="relative overflow-hidden border-b-4 border-black pb-12 pt-28 md:pb-16 md:pt-36"
          style={{ background: GRADIENT }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-[6%] -top-[8%] select-none"
            style={{
              fontSize: "36rem",
              lineHeight: 0.8,
              fontFamily: FONT,
              fontWeight: 900,
              color: "rgba(255,255,255,0.05)",
            }}
          >
            CC
          </div>

          <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-0">
              <div className="flex-1 lg:flex-[1.25]">
                <motion.h1
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1, ease }}
                  className="mb-6 text-[3.5rem] font-black uppercase leading-[0.85] tracking-tighter text-white md:text-[5.5rem] lg:text-[7.5rem]"
                  style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em" }}
                >
                  <span className="text-white/55">
                    Not Built
                    <br />
                    In A Lab.
                  </span>
                  <br />
                  <span className="text-white">Made In A Kitchen.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="max-w-2xl text-sm font-black uppercase tracking-[0.12em] text-white md:text-base"
                  style={{ fontFamily: FONT, fontWeight: 900 }}
                >
                  Made In A Kitchen.
                  <br />
                  <br />
                  Born from frustration with bad protein shakes. Built with chia seeds, MCT oil, and
                  an obsession with clean nutrition. Fueling Tunisia — one jar at a time.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="mt-10 inline-flex flex-wrap rounded-sm border-3 border-black bg-white"
                  style={{ boxShadow: "5px 5px 0 #111" }}
                >
                  {[
                    ["22g", "Protein/Serving"],
                    ["12g", "Fiber"],
                    ["0%", "Junk"],
                    ["MCT", "Oil"],
                  ].map(([v, l], i) => (
                    <div
                      key={l}
                      className={`flex flex-col items-center px-5 py-3 sm:px-8 ${
                        i > 0 ? "border-l-2 border-black" : ""
                      }`}
                    >
                      <span
                        className="text-2xl font-black sm:text-3xl"
                        style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                      >
                        {v}
                      </span>
                      <span
                        className="text-[8px] font-black uppercase tracking-[0.18em]"
                        style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                      >
                        {l}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease }}
                className="flex flex-1 items-center justify-center lg:flex-[0.75]"
                style={{ minHeight: 320 }}
              >
                <div className="relative h-[300px] w-[300px] md:h-[420px] md:w-[420px]">
                  <Image
                    src="/strawberry.webp"
                    alt="Fresh strawberry"
                    fill
                    priority
                    className="scale-[1.26] object-contain drop-shadow-[0_32px_60px_rgba(0,0,0,0.3)] md:scale-[1.22]"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section
          className="border-b-4 border-black py-20 md:py-28"
          style={{
            backgroundColor: "#f5efe4",
            backgroundImage: "url('/texture.webp')",
            backgroundSize: "280px 280px",
          }}
        >
          <div className="mx-auto max-w-[1400px] px-6 md:px-10">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="lg:order-2"
              >
                <h2
                  className="mb-6 text-[2.5rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[3.5rem] lg:text-[4.5rem]"
                  style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em", color: "#111" }}
                >
                  Born From
                  <br />
                  <span
                    style={{
                      background: GRADIENT,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Frustration.
                  </span>
                </h2>

                <p
                  className="mb-4 max-w-xl text-sm font-semibold leading-relaxed md:text-base"
                  style={{ color: "#111" }}
                >
                  Like most fitness-focused people, we were dedicated to hitting our macros — but
                  brutally tired of protein shakes that tasted like chalk dissolved in water. We
                  wanted something that felt like a real meal, packed serious protein, and didn't
                  make us regret every sip.
                </p>
                <p
                  className="mb-8 max-w-xl text-sm font-semibold leading-relaxed md:text-base"
                  style={{ color: "#111" }}
                >
                  The answer didn't come from a nutrition lab — it came from our own kitchen. One
                  experiment turned into an obsession: mixing premium plant protein, hydrating chia
                  seeds, quality MCT oil, and natural flavors we actually loved. Chia Charged wasn't
                  invented. It was discovered — spoonful by spoonful.
                </p>

                <div
                  className="inline-flex flex-wrap items-center gap-4 rounded-sm border-3 border-black bg-white px-5 py-3"
                  style={{ boxShadow: "4px 4px 0 #111" }}
                >
                  <div>
                    <span
                      className="block text-[9px] font-black uppercase tracking-[0.18em]"
                      style={{ fontFamily: FONT, fontWeight: 900, color: "rgba(0,0,0,0.35)" }}
                    >
                      Made For
                    </span>
                    <span
                      className="text-2xl font-black uppercase"
                      style={{
                        fontFamily: FONT,
                        fontWeight: 900,
                        background: GRADIENT,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      Everyone
                    </span>
                  </div>
                  <div className="h-10 w-[3px] bg-black/10" />
                  <div>
                    <span
                      className="block text-[9px] font-black uppercase tracking-[0.18em]"
                      style={{ fontFamily: FONT, fontWeight: 900, color: "rgba(0,0,0,0.35)" }}
                    >
                      Mission
                    </span>
                    <span
                      className="text-lg font-black uppercase"
                      style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                    >
                      Fuel Smarter.
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease }}
                className="relative flex items-center justify-center pt-12 lg:order-1 lg:pt-0"
                style={{ minHeight: 520 }}
              >
                <div
                  className="absolute inset-x-4 bottom-0 top-16 rounded-sm md:inset-x-8 md:top-20"
                  style={{
                    background: GRADIENT,
                    border: "4px solid #111",
                    boxShadow: "8px 8px 0 #111",
                    transform: "rotate(-2.5deg)",
                  }}
                />
                <div
                  className="relative z-10 flex w-full items-start justify-center overflow-visible"
                  style={{ minHeight: 520 }}
                >
                  <div className="relative -mt-16 h-[520px] w-full max-w-[440px] md:-mt-24 md:h-[620px] md:max-w-[520px]">
                    <Image
                      src="/chocolate.webp"
                      alt="Chia Charged chocolate jar"
                      fill
                      priority
                      className="object-contain drop-shadow-[0_24px_50px_rgba(0,0,0,0.35)]"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section
          className="relative overflow-hidden border-b-4 border-black py-20 md:py-28"
          style={{ background: GRADIENT }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-[4%] top-[5%] select-none"
            style={{
              fontSize: "28rem",
              lineHeight: 0.8,
              fontFamily: FONT,
              fontWeight: 900,
              color: "rgba(255,255,255,0.05)",
            }}
          >
            VAL
          </div>

          <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="mb-14"
            >
              <h2
                className="text-[2.8rem] font-black uppercase leading-[0.88] tracking-tighter text-white md:text-[4rem] lg:text-[5rem]"
                style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em" }}
              >
                What We
                <br />
                Stand For.
              </h2>
              <p
                className="mt-3 max-w-lg text-sm font-black uppercase tracking-[0.12em] text-white"
                style={{ fontFamily: FONT, fontWeight: 900 }}
              >
                Three principles that guide every decision — from formula to packaging.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="grid grid-cols-1 gap-6 md:grid-cols-3"
            >
              {values.map(({ icon: Icon, title, desc, rotate }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                >
                  <div
                    className="flex flex-col gap-5 border-4 border-black bg-white p-7"
                    style={{
                      borderRadius: "14px",
                      boxShadow: "8px 8px 0 #111",
                      transform: `rotate(${rotate})`,
                      transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.transform =
                        "rotate(0deg) translate(-4px,-4px)"
                      ;(e.currentTarget as HTMLElement).style.boxShadow = "12px 12px 0 #111"
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.transform = `rotate(${rotate})`
                      ;(e.currentTarget as HTMLElement).style.boxShadow = "8px 8px 0 #111"
                    }}
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center"
                      style={{ color: "rgb(68,15,195)" }}
                    >
                      <Icon className="h-8 w-8" strokeWidth={2.5} />
                    </div>
                    <h3
                      className="text-lg font-black uppercase tracking-tight"
                      style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                    >
                      {title}
                    </h3>
                    <p
                      className="text-sm font-semibold leading-relaxed"
                      style={{ color: "rgba(0,0,0,0.5)" }}
                    >
                      {desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section
          className="border-b-4 border-black py-20 md:py-28"
          style={{
            backgroundColor: "#f5efe4",
            backgroundImage: "url('/texture.webp')",
            backgroundSize: "280px 280px",
          }}
        >
          <div className="mx-auto max-w-[1400px] px-6 md:px-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="mb-14"
            >
              <h2
                className="text-[2.8rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[4rem] lg:text-[5rem]"
                style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em", color: "#111" }}
              >
                What Goes
                <br />
                <span
                  style={{
                    background: GRADIENT,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  In The Jar.
                </span>
              </h2>
              <p
                className="mt-3 max-w-xl text-sm font-black uppercase tracking-[0.12em]"
                style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
              >
                Every ingredient chosen for a reason. No passengers.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {ingredients.map(({ icon: Icon, name, stat, why }, i) => (
                <motion.div
                  key={name}
                  variants={fadeUp}
                >
                  <div
                    className="relative overflow-hidden border-4 border-black bg-white p-6"
                    style={{
                      borderRadius: "14px",
                      boxShadow: "8px 8px 0 #111",
                      transform: `rotate(${ingredientRotations[i]})`,
                      transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.transform =
                        "rotate(0deg) translate(-3px,-3px)"
                      ;(e.currentTarget as HTMLElement).style.boxShadow = "11px 11px 0 #111"
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.transform = `rotate(${ingredientRotations[i]})`
                      ;(e.currentTarget as HTMLElement).style.boxShadow = "8px 8px 0 #111"
                    }}
                  >
                    <div
                      className="absolute left-0 right-0 top-0 h-1.5"
                      style={{ background: GRADIENT }}
                    />
                    <div
                      className="mb-4 flex h-10 w-10 items-center justify-center"
                      style={{ color: "rgb(68,15,195)" }}
                    >
                      <Icon className="h-7 w-7" strokeWidth={2.5} />
                    </div>
                    <div
                      className="mb-1 text-[9px] font-black uppercase tracking-[0.2em]"
                      style={{
                        fontFamily: FONT,
                        fontWeight: 900,
                        background: GRADIENT,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {stat}
                    </div>
                    <h3
                      className="mb-3 text-base font-black uppercase"
                      style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                    >
                      {name}
                    </h3>
                    <p
                      className="text-xs font-semibold leading-relaxed"
                      style={{ color: "rgba(0,0,0,0.45)" }}
                    >
                      {why}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section
          className="relative overflow-hidden border-b-4 border-black py-20 md:py-28"
          style={{ background: GRADIENT }}
        >
          <div className="mx-auto max-w-[1400px] px-6 md:px-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="mb-14 text-center"
            >
              <h2
                className="text-[2.8rem] font-black uppercase leading-[0.88] tracking-tighter text-white md:text-[4.5rem]"
                style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em" }}
              >
                By The Numbers.
              </h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
            >
              {stats.map(({ value, label }) => (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  className="flex flex-col items-center justify-center border-3 border-black bg-white py-8 text-center"
                  style={{ boxShadow: "5px 5px 0 #111", borderRadius: "14px" }}
                >
                  <span
                    className="text-3xl font-black md:text-4xl"
                    style={{
                      fontFamily: FONT,
                      fontWeight: 900,
                      background: GRADIENT,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {value}
                  </span>
                  <span
                    className="mt-1.5 text-[8px] font-black uppercase tracking-[0.18em]"
                    style={{ fontFamily: FONT, fontWeight: 900, color: "rgba(0,0,0,0.4)" }}
                  >
                    {label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section
          className="border-b-4 border-black py-20 md:py-28"
          style={{
            backgroundColor: "#f5efe4",
            backgroundImage: "url('/texture.webp')",
            backgroundSize: "280px 280px",
          }}
        >
          <div className="mx-auto max-w-[1400px] px-6 md:px-10">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease }}
              className="mx-auto max-w-4xl"
            >
              <div
                className="border-4 border-black bg-white px-8 py-12 text-center md:px-16 md:py-16"
                style={{ boxShadow: "10px 10px 0 #111", borderRadius: "14px" }}
              >
                <div
                  className="mb-5 inline-flex items-center gap-2 border-3 border-black px-3 py-1.5"
                  style={{ boxShadow: "2px 2px 0 #111", background: GRADIENT, borderRadius: "6px" }}
                >
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.2em] text-white"
                    style={{ fontFamily: FONT, fontWeight: 900 }}
                  >
                    Our Mission
                  </span>
                </div>
                <blockquote
                  className="text-[1.5rem] font-black uppercase leading-[0.95] tracking-tighter md:text-[2.2rem] lg:text-[2.8rem]"
                  style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.02em", color: "#111" }}
                >
                  "We believe great nutrition.
                  <br />
                  shouldn't taste like{" "}
                  <span
                    style={{
                      background: GRADIENT,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    punishment."
                  </span>
                </blockquote>
                <p
                  className="mx-auto mt-6 max-w-xl text-sm font-semibold leading-relaxed"
                  style={{ color: "rgba(0,0,0,0.45)" }}
                >
                  Chia Charged was built for people who refuse to compromise. You can hit your
                  protein goals, fuel your body with fiber and healthy fats, and actually enjoy what
                  you eat — every single day.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <LandingCtaBanner />
      </main>

      <Footer />
    </div>
  )
}
