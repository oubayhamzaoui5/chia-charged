"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

const faqItems = [
  {
    question: "What are the main ingredients in Chia Charged?",
    answer:
      "Chia seed, whey protein concentrate, medium chain coconut oil triglycerides, freeze-dried strawberry slices, vanilla flavor with other natural flavors, stevia leaf glycosides, and monk fruit extract.",
  },
  {
    question: "What are your delivery timeframes?",
    answer:
      "Standard delivery takes 2-4 business days. We ship orders fresh with insulated packaging to maintain product quality during transit.",
  },
  {
    question: "Is Chia Charged suitable for vegans?",
    answer:
      "Yes! All our puddings are 100% plant-based. No dairy, no eggs, no animal products — just pure, nutritious ingredients that work for everyone.",
  },
  {
    question: "How much protein does each jar contain?",
    answer:
      "Each jar packs 22g of high-quality plant protein per serving, 12g of fiber, MCT oil and zero added sugar. It's the perfect snack for muscle recovery and sustained energy.",
  },
  {
    question: "Do you offer economy shipping?",
    answer:
      "All orders placed over $99 will ship for free. Once your order ships, you’ll receive an email with tracking information.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "We ship worldwide. Please be aware customers are responsible for any and all customs fees that are incurred when your order arrives to your country.",
  },
  {
    question: "What is your refund policy?",
    answer: "All items are final sale. No refunds will be issued.",
  },
  {
    question: "How should I store the product?",
    answer:
      "Items should be stored in a cool-dry place, unopened. Shelf life is 12 months from package date.",
  },
]

const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number], staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
  },
}

export default function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      id="faq"
      className="border-t-3 border-black px-6 py-20 md:py-28"
      style={{
        backgroundColor: "#f5efe4",
        backgroundImage: "url('/texture.webp')",
        backgroundSize: "280px 280px",
      }}
    >
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <h2
            className="text-[2.5rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[3.5rem]"
            style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em", color: "#111" }}
          >
            Got{" "}
            <span
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Questions?
            </span>
          </h2>
          <p
            className="mt-3 text-sm font-black uppercase tracking-[0.15em]"
            style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
          >
            We&apos;ve got answers.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          style={{
            border: "4px solid #111",
            borderRadius: "14px",
            background: "white",
            boxShadow: "8px 8px 0 #111",
            overflow: "hidden",
          }}
        >
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <motion.div
                key={item.question}
                variants={itemVariants}
                className={index > 0 ? "border-t-2 border-black/15" : ""}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-200"
                  style={{ background: isOpen ? "rgba(124,58,237,0.05)" : "transparent" }}
                >
                  <span
                    className="text-sm font-black uppercase leading-snug tracking-wide md:text-base"
                    style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                  >
                    {item.question}
                  </span>
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center transition-all duration-200"
                    style={{
                      border: "3px solid #111",
                      borderRadius: "4px",
                      background: isOpen ? GRADIENT : "transparent",
                      boxShadow: isOpen ? "none" : "2px 2px 0 #111",
                    }}
                  >
                    {isOpen ? (
                      <Minus className="h-4 w-4 text-white" strokeWidth={3} />
                    ) : (
                      <Plus className="h-4 w-4 text-black" strokeWidth={3} />
                    )}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <p
                        className="px-6 pb-5 pt-1 text-sm font-semibold leading-relaxed md:text-base"
                        style={{ color: "#111" }}
                      >
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
