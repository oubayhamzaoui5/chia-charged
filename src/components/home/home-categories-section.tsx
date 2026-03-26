'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { type HomeCategoryItem } from './home-category-card'
import HomeCategoryMotionCard from './home-category-motion-card'

type RoomCategory = HomeCategoryItem & {
  spanTwoColumns?: boolean
}

type HomeCategoriesSectionProps = {
  categories: RoomCategory[]
}

// --- ANIMATION VARIANTS ---

// Desktop Parent
const desktopContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

// Desktop Individual Cards (Directional)
const desktopChildVariants = [
  { hidden: { opacity: 0, y: -60 }, visible: { opacity: 1, y: 0 } }, // Top to Bottom
  { hidden: { opacity: 0, x: 60 },  visible: { opacity: 1, x: 0 } }, // Right to Left
  { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } }, // Left to Right
  { hidden: { opacity: 0, y: 60 },  visible: { opacity: 1, y: 0 } }, // Bottom to Top
]

// Mobile Parent (The "Chain Reaction" Orchestrator)
const mobileContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.06,
    },
  },
}

// Mobile Individual Cards
const mobileCardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

export default function HomeCategoriesSection({ categories }: HomeCategoriesSectionProps) {
  const visibleCategories = categories.slice(0, 4)
  const firstRowCategories = visibleCategories.slice(0, 2)
  const secondRowCategories = visibleCategories.slice(2, 4).reverse()
  
  const secondRowRef = useRef<HTMLDivElement | null>(null)
  const [isHeroReady, setIsHeroReady] = useState(false)
  const reduceMotion = useReducedMotion()

  // Wait for Hero to finish
  useEffect(() => {
    if (typeof window === 'undefined') return
    const windowWithHeroReady = window as Window & { __homeHeroReady?: boolean }

    if (windowWithHeroReady.__homeHeroReady) {
      setIsHeroReady(true)
      return
    }

    const onHeroReady = () => setIsHeroReady(true)
    window.addEventListener('home-hero-ready', onHeroReady)
    return () => window.removeEventListener('home-hero-ready', onHeroReady)
  }, [])

  // Auto-scroll the second row to the right (for the RTL look)
  useEffect(() => {
    const row = secondRowRef.current
    if (!row) return

    const scrollToRight = () => {
      row.scrollLeft = row.scrollWidth - row.clientWidth
    }

    // Small delay to ensure layout is painted
    const timer = setTimeout(scrollToRight, 50)
    window.addEventListener('resize', scrollToRight)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', scrollToRight)
    }
  }, [secondRowCategories.length])

  return (
    <section id="home-categories" className="mx-auto max-w-7xl overflow-x-clip px-4 py-10 md:px-2 md:py-16 lg:py-18">
      
      {/* Header Section */}
      <div className="mb-4 flex items-end justify-between md:mb-12">
        <div>
          <h2 className="mb-2 text-2xl font-bold md:text-3xl">Shop by Category</h2>
          <p className="text-sm text-slate-500 md:text-base">
            Find your perfect flavor — protein-packed and made with real ingredients.
          </p>
          <Link
            href="/shop"
            className="mt-3 mb-0 inline-block border-b-2 border-accent/40 pb-1 font-bold text-accent transition-all duration-300 hover:border-accent hover:-translate-y-0.5 md:hidden"
          >
            Browse all products
          </Link>
        </div>
        <Link
          href="/shop"
          className="hidden border-b-2 border-accent/20 pb-1 font-bold text-accent transition-all duration-300 hover:border-accent hover:-translate-y-0.5 md:inline-block"
        >
          Browse all products
        </Link>
      </div>

      {/* Desktop Grid */}
      <motion.div
        className="hidden grid-cols-1 gap-6 md:grid md:grid-cols-2"
        variants={desktopContainerVariants}
        initial="hidden"
        whileInView={isHeroReady ? 'visible' : 'hidden'}
        viewport={{ once: true, amount: 0.2 }}
      >
        {visibleCategories.map((item, index) => (
          <HomeCategoryMotionCard
            key={`desktop-${item.name}`}
            category={item}
            variants={desktopChildVariants[index]}
            transition={{
              duration: 0.8,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
          />
        ))}
      </motion.div>

      {/* Mobile View (Sequential Chain Reaction) */}
      <motion.div 
        className="space-y-4 md:hidden"
        variants={mobileContainerVariants}
        initial="hidden"
        whileInView={isHeroReady ? 'visible' : 'hidden'}
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Row 1 (LTR) */}
        <div className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
          {firstRowCategories.map((item) => (
            <HomeCategoryMotionCard
              key={`mobile-r1-${item.name}`}
              category={item}
              mobile
              className="w-[85%] flex-none snap-start transform-gpu"
              variants={mobileCardVariants}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.38, ease: 'easeOut' }}
            />
          ))}
        </div>

        {/* Row 2 (RTL) */}
        <div 
          ref={secondRowRef}
          className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
        >
          {secondRowCategories.map((item) => (
            <HomeCategoryMotionCard
              key={`mobile-r2-${item.name}`}
              category={item}
              mobile
              className="w-[85%] flex-none snap-start transform-gpu"
              variants={mobileCardVariants}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.38, ease: 'easeOut' }}
            />
          ))}
        </div>
      </motion.div>
    </section>
  )
}
