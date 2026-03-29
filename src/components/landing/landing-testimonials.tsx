"use client"

import { motion } from "framer-motion"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Fitness Coach",
    rating: 5,
    quote:
      "I've tried every protein product on the market. Chia Charged is the only one that tastes like actual food, keeps me full until lunch, and doesn't wreck my stomach.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&q=80&fit=crop&crop=face",
    rotate: "-1.5deg",
  },
  {
    name: "James T.",
    role: "Marathon Runner",
    rating: 5,
    quote:
      "I prep 5 jars every Sunday. Between the MCT oil and the chia seeds, my energy is steady through my morning runs. No gel packs needed.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&q=80&fit=crop&crop=face",
    rotate: "0.3deg",
  },
  {
    name: "Layla K.",
    role: "Nutritionist",
    rating: 5,
    quote:
      "As a nutritionist, I'm extremely picky about what I recommend. Zero added sugar, 22g plant protein per serving, and MCT oil — this is the one I tell all my clients about.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&q=80&fit=crop&crop=face",
    rotate: "1.2deg",
  },
]

export default function LandingTestimonials() {
  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      style={{
        backgroundColor: "#f5efe4",
        backgroundImage: "url('/texture.webp')",
        backgroundSize: "280px 280px",
      }}
    >
      {/* Decorative star watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[4%] -top-[8%] select-none"
        style={{
          fontSize: "30rem",
          lineHeight: 1,
          fontFamily: FONT,
          fontWeight: 900,
          background: GRADIENT,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          opacity: 0.05,
        }}
      >
        ★
      </div>

      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="text-[2.8rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[4rem] lg:text-[5rem]"
              style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em", color: "#111" }}
            >
              Don&apos;t Just Take<br />
              <span
                style={{
                  background: GRADIENT,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Our Word For It.
              </span>
            </h2>
          </motion.div>

          {/* Rating badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="inline-flex shrink-0 items-center gap-5 self-start md:self-auto"
            style={{
              border: "4px solid #111",
              borderRadius: "14px",
              padding: "16px 22px",
              background: "white",
              boxShadow: "7px 7px 0 #111",
            }}
          >
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: "3rem", lineHeight: 1, color: "#111" }}>4.8</div>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(0,0,0,0.35)", marginTop: 4 }}>Out of 5</div>
            </div>
            <div style={{ width: 1, height: 48, background: "#111", opacity: 0.12 }} />
            <div>
              <div className="mb-1.5 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ fontSize: "20px", background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>★</span>
                ))}
              </div>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(0,0,0,0.35)" }}>100+ Reviews</div>
            </div>
          </motion.div>
        </div>

        {/* Review cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
          style={{ alignItems: "start" }}
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] } },
              }}
              style={{
                border: "4px solid #111",
                borderRadius: "14px",
                boxShadow: "8px 8px 0 #111",
                background: "white",
                padding: "28px",
                rotate: t.rotate,
              }}
              whileHover={{ rotate: 0, x: -4, y: -4, boxShadow: "13px 13px 0 #111" }}
              transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* Quote mark */}
              <div
                style={{
                  fontSize: "4.5rem",
                  lineHeight: 0.85,
                  fontFamily: FONT,
                  fontWeight: 900,
                  background: GRADIENT,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: "10px",
                  display: "block",
                }}
              >
                &#10078;
              </div>

              {/* Stars */}
              <div className="mb-3 flex gap-0.5">
                {[...Array(t.rating)].map((_, i) => (
                  <span key={i} style={{ fontSize: "13px", background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>★</span>
                ))}
              </div>

              {/* Verified badge */}
              <div className="mb-5 inline-flex items-center gap-1.5 rounded-sm border-2 px-2.5 py-1" style={{ background: "rgba(124,58,237,0.07)", borderColor: "rgba(124,58,237,0.2)" }}>
                <span style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgb(124,58,237)", fontFamily: FONT }}>&#10003; Verified Purchase</span>
              </div>

              {/* Quote */}
              <p style={{ fontSize: "0.93rem", lineHeight: 1.72, color: "#111", fontWeight: 600, marginBottom: "22px" }}>
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Divider */}
              <div style={{ borderTop: "2.5px solid #111", opacity: 0.1, marginBottom: "18px" }} />

              {/* Author */}
              <div className="flex items-center gap-3">
                <div style={{ width: 46, height: 46, border: "3px solid #111", borderRadius: "8px", overflow: "hidden", flexShrink: 0, boxShadow: "3px 3px 0 #111" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.avatar} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div>
                  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: "0.78rem", color: "#111", textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1.2 }}>{t.name}</div>
                  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 3, background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
