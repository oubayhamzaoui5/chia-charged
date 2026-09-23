"use client"

import { useStoreSettings } from "@/hooks/useStoreSettings"
import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)"

const buildFaqItems = (settings: ReturnType<typeof useStoreSettings>) => [
  {
    question: "What are the main ingredients in Chia Charged?",
    answer:
      "Our flavors contain chia seed, whey protein concentrate and coconut-derived MCT oil. Ingredients vary by flavor; read the product ingredients and allergen statement before buying.",
  },
  {
    question: "What are your delivery timeframes?",
    answer:
      settings.shippingPolicy || "Delivery details have not been published yet. Contact us before ordering.",
  },
  {
    question: "Is Chia Charged suitable for vegans?",
    answer:
      "No. Our current flavors contain whey protein from milk and are not vegan or dairy-free. Read each product’s allergen statement.",
  },
  {
    question: "Where can I find nutrition and sugar information?",
    answer:
      "Check the nutrition panel for your selected flavor and serving size. Chocolate Chips includes cane sugar; these products are not advertised as sugar-free or free of added sugar.",
  },
  {
    question: "How much does shipping cost?",
    answer:
      "We charge one flat shipping rate per order within the United States. Your shipping charge is shown at checkout before you pay.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "We currently deliver within the United States only.",
  },
  {
    question: "What is your refund policy?",
    answer: settings.returnPolicy || "Our return policy has not been published yet. Contact us before ordering.",
  },
  {
    question: "How should I store the product?",
    answer:
      settings.storageInstructions || "Follow the storage instructions and date on your product packaging. Additional storage details have not been published yet.",
  },
  { question: "How do I prepare Chia Charged?", answer: settings.preparationInstructions || "Follow the preparation instructions on your product packaging. Additional preparation details have not been published yet." },
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
  const settings = useStoreSettings()
  const faqItems = buildFaqItems(settings)
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      id="faq"
      className="border-t-3 border-black px-3 py-12 md:px-6 md:py-24"
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
          className="mb-8 text-center md:mb-14"
        >
          <h2
            className="text-[1.8rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[3rem]"
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
                  className="flex w-full items-center justify-between gap-3 px-4 py-5 text-left transition-colors duration-200 md:px-6"
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
                        className="px-4 pb-5 pt-1 text-sm font-semibold leading-relaxed md:px-6 md:text-base"
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
