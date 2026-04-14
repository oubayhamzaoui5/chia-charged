"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, CircleSlash, Leaf, Zap } from "lucide-react"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)"

const values = [
  { icon: Leaf, title: "100% Plant-Based", desc: "No dairy, no eggs, no compromise." },
  { icon: Zap, title: "22g Protein/Serving", desc: "Fuel your body with every spoonful." },
  { icon: CircleSlash, title: "0% Junk", desc: "Clean ingredients only, no fillers." },
]

export default function LandingAbout() {
  return (
    <section
      id="story"
      className="relative overflow-hidden border-y-3 border-black py-12 md:py-24"
      style={{ background: GRADIENT }}
    >
      {/* Decorative watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[4%] -top-[12%] select-none"
        style={{
          fontSize: "30rem",
          lineHeight: 0.8,
          fontFamily: FONT,
          fontWeight: 900,
          color: "rgba(255,255,255,0.2)",
        }}
      >
        ??
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <h2
              className="mb-4 text-[1.8rem] font-black uppercase leading-[0.88] tracking-tighter text-white md:text-[3rem] lg:text-[4.5rem]"
              style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em" }}
            >
              OUR STORY
            </h2>
            <p
              className="mb-3 max-w-xl text-sm font-bold leading-relaxed text-white md:text-base"
              style={{ fontFamily: FONT, fontWeight: 900 }}
            >
              Like many health-conscious people, we were dedicated to our fitness goals, but we had
              a problem: we were utterly tired of the same old chalky protein shakes. We craved a
              high-protein option that felt like a real, satisfying meal, offered significant fiber,
              and tasted incredible.
            </p>
            <p
              className="mb-6 max-w-xl text-sm font-bold leading-relaxed text-white md:text-base"
              style={{ fontFamily: FONT, fontWeight: 900 }}
            >
              The solution didn't come from a lab—it came from our own kitchen. We started
              experimenting, mixing together high-quality protein powder, nutrient-dense chia seeds,
              and all the yummy, natural flavors we loved. This simple combination, born out of
              necessity and a desire for better nutrition, was the spark that created our protein
              chia seed pudding mix!
            </p>

            <Link
              href="/about"
              className="shimmer-btn relative isolate inline-flex items-center gap-2.5 overflow-hidden rounded-sm border-3 border-black px-8 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-black transition-all duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,0.6)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_rgba(0,0,0,0.6)]"
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                background: "white",
                boxShadow: "4px 4px 0 rgba(0,0,0,0.6)",
              }}
            >
              Read More
              <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* Right: Value cards */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col gap-5"
          >
            {values.map((item, i) => {
              const Icon = item.icon
              const rotations = ["-1.2deg", "0.8deg", "-0.6deg"]
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-5 p-6 transition-all duration-300 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[10px_10px_0_#111]"
                  style={{
                    background: "white",
                    border: "4px solid #111",
                    borderRadius: "14px",
                    boxShadow: "8px 8px 0 #111",
                    transform: `rotate(${rotations[i]})`,
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center" style={{ color: "rgb(68,15,195)" }}>
                    <Icon className="h-8 w-8" strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3
                      className="text-base font-black uppercase tracking-tight"
                      style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="mt-1 text-sm font-semibold leading-relaxed"
                      style={{ color: "#111" }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}


