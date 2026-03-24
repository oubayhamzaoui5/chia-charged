"use client"

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const faqItems = [
  {
    question: 'What are the main ingredients in Chia Charged?',
    answer:
      'Chia seed, whey protein concentrate, medium chain coconut oil triglycerides, freeze-dried strawberry slices, vanilla flavor with other natural flavors, stevia leaf glycosides, and monk fruit extract.',
  },
  {
    question: 'How long does it last in the fridge?',
    answer:
      'Chia Charged stays fresh for up to 7 days when refrigerated. We recommend consuming within 5 days of opening for optimal taste and texture.',
  },
  {
    question: 'What are your delivery timeframes?',
    answer:
      'Standard delivery takes 2–4 business days. We ship orders fresh with insulated packaging to maintain product quality during transit.',
  },
  {
    question: 'Is Chia Charged suitable for vegans?',
    answer:
      'Yes! All our puddings are 100% plant-based. No dairy, no eggs, no animal products — just pure, nutritious ingredients that work for everyone.',
  },
]

export default function HomeFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="px-4 py-14 md:py-20 lg:py-24 bg-white">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <span className="mb-3 inline-block rounded-full border border-accent/20 bg-accent/8 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            FAQ
          </span>
          <h2
            className="text-3xl font-black text-slate-900 sm:text-4xl"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
          >
            Frequently Asked Questions
          </h2>
        </div>

        {/* Accordion */}
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div key={item.question}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className={`flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-200 ${isOpen ? "bg-accent/4" : "hover:bg-slate-50"}`}
                >
                  <span className={`text-sm font-semibold leading-snug transition-colors duration-200 md:text-base ${isOpen ? "text-accent" : "text-slate-900"}`}>
                    {item.question}
                  </span>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${isOpen ? "bg-accent text-white" : "bg-slate-100 text-slate-500"}`}>
                    {isOpen
                      ? <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      : <Plus  className="h-3.5 w-3.5" strokeWidth={2.5} />
                    }
                  </span>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <p className="px-6 pb-5 pt-1 text-sm leading-relaxed text-white/40 md:text-base">
                    {item.answer}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
