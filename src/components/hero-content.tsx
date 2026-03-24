"use client"

import { Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const atmospheriqueFont = Playfair_Display({
  subsets: ['latin'],
  weight: ['900'],
  style: ['italic'],
})
const HERO_IMAGES = ['hero1.webp', 'hero2.webp', 'hero3.webp', 'hero4.webp', 'hero5.webp', 'hero6.webp']
const SIGNUP_PROMO_DISMISSED_KEY = 'signup_promo_dismissed_v1'

export default function Hero() {
  const [currentBgIndex, setCurrentBgIndex] = useState(0)
  const [isSignupPromoActive, setIsSignupPromoActive] = useState(false)

  useEffect(() => {
    const refreshSignupPromoState = () => {
      if (typeof window === 'undefined') return
      const dismissedUntilRaw = window.localStorage.getItem(SIGNUP_PROMO_DISMISSED_KEY)
      const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0
      const shouldShow =
        !dismissedUntilRaw || Number.isNaN(dismissedUntil) || Date.now() >= dismissedUntil
      setIsSignupPromoActive(shouldShow)
    }

    refreshSignupPromoState()
    window.addEventListener('signup-promo:visibility-change', refreshSignupPromoState)
    return () => {
      window.removeEventListener('signup-promo:visibility-change', refreshSignupPromoState)
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 4000)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <section
      className={`relative flex aspect-[16/9] w-full flex-col items-stretch lg:h-screen lg:aspect-auto lg:flex-row `}
    >
      <div className="relative z-10 flex flex-1 flex-col items-start justify-center bg-transparent px-4 lg:h-screen lg:min-h-0 lg:flex-[1.1] lg:px-24">
       <div className="max-w-xs  text-left text-white sm:max-w-sm lg:mx-0 lg:max-w-xl ">
  <span className="mb-0 block text-[10px] font-bold uppercase tracking-[0.22em] lg:mb-2 lg:text-base lg:tracking-[0.3em]">
    Collection 2026
  </span>
  <h1 className="mb-3 text-2xl font-extrabold leading-[1.1] lg:mb-2 lg:text-7xl">
    Élégance
    <span>
      <span> pour {' '} <br /><span> votre intérieur</span></span>{' '}
      <span
        className="relative lg:-top-2 inline-block text-[1.12em] tracking-wide"
      >
        raffiné
      </span>
    </span>
  </h1>

  <p className="mb-2 lg:mb-4 hidden text-lg font-semibold leading-relaxed lg:block">
    Découvrez notre univers de décoration d’intérieur en Tunisie : profilés muraux décoratifs, panneaux muraux en PVC, panneaux en MDF et solutions modernes pour sublimer votre salon, chambre, cuisine et même salle de bain avec style et caractère.
  </p>

  <div className="flex flex-row items-center justify-start gap-3">
    <Link
      href="/boutique"
      className="relative isolate cursor-pointer overflow-hidden rounded-lg bg-[#c19a2f] px-2 py-2 lg:py-3 text-center text-[10px] font-bold uppercase tracking-wider whitespace-nowrap text-white transition-transform duration-300 before:absolute before:inset-y-0 before:left-[-40%] before:w-[35%] before:skew-x-[-20deg] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent before:translate-x-[-180%] before:transition-transform before:duration-700 before:content-[''] hover:before:translate-x-[420%] hover:scale-[1.01] active:scale-95 lg:px-6 lg:text-sm lg:tracking-widest"
    >
      Découvrir nos collections
    </Link>

  </div>
</div>
      </div>

      {/* Hero background image slider */}
      <div className="absolute inset-0 h-full w-full overflow-hidden">
        <div className="relative h-full w-full">
          {HERO_IMAGES.map((image, index) => (
            <img
              key={image}
              src={`/${image}`}
              alt=""
              fetchPriority={index === 0 ? 'high' : 'auto'}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
                index === currentBgIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-black/50" />
        </div>
      </div>
    </section>
  )
}
