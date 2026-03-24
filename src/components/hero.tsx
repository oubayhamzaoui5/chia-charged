"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
export default function Hero() {
  // ⏱️ Variables
  const LAMP_SLIDE_DELAY = 500
  const LAMP_FADE_DELAY = 2800
  const LAMP_SLIDE_DURATION = 2100
  const LAMP_FADE_DURATION = 2000

  const BG_IMAGES = ["hero1.webp", "hero2.webp", "hero3.webp", "hero4.webp", "hero5.webp", "hero6.webp"]
  const BG_CHANGE_INTERVAL = 4000
  const BG_FADE_DURATION = 1000

  const CONTENT_DELAY = 400

  const [lampVisible, setLampVisible] = useState(false)
  const [lampFadeOut, setLampFadeOut] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [currentBgIndex, setCurrentBgIndex] = useState(0)

  useEffect(() => {
    const slideTimer = setTimeout(() => setLampVisible(true), LAMP_SLIDE_DELAY)
    const fadeTimer = setTimeout(() => setLampFadeOut(true), LAMP_FADE_DELAY)
    const bgTimer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % BG_IMAGES.length)
    }, BG_CHANGE_INTERVAL)
    const contentTimer = setTimeout(() => setShowContent(true), CONTENT_DELAY)

    return () => {
      clearTimeout(slideTimer)
      clearTimeout(fadeTimer)
      clearInterval(bgTimer)
      clearTimeout(contentTimer)
    }
  }, [])

  return (
    <div className="relative h-screen w-screen overflow-hidden pt-24">
      <div className="absolute inset-0 z-10">
        {BG_IMAGES.map((image, index) => (
          <Image
            key={image}
            src={`/${image}`}
            alt=""
            fill
            sizes="100vw"
            priority={index === 0}
            loading={index === 0 ? undefined : "lazy"}
            className="object-cover transition-opacity ease-in-out"
            style={{
              transitionDuration: `${BG_FADE_DURATION}ms`,
              opacity: index === currentBgIndex ? 1 : 0,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 z-20 bg-black/40" />

      {/* 🔆 CONTENT + GLOW */}
      <div
        className="absolute left-1/2 z-40 text-center"
        style={{ top: "25%", transform: "translateX(-50%)" }}
      >
       

        {/* SMALL TITLE */}
        <h3
          className="relative mb-2 text-xl text-accent font-semibold tracking-widest transition-all duration-800 ease-out"
          style={{
            opacity: showContent ? 1 : 0,
            transform: showContent ? "translateY(0)" : "translateY(15px)",
            transitionDelay: "0ms",
          }}
        >
          UPDATE DESIGN
        </h3>

        {/* MAIN TITLE */}
        <h1
          className="relative  font-serif font-bold text-4xl md:text-4xl font-light tracking-wider text-white transition-all duration-900 ease-out"
          style={{
            opacity: showContent ? 1 : 0,
            transform: showContent ? "translateY(0)" : "translateY(15px)",
            transitionDelay: "300ms",
          }}
        >
          Où la Lumière Prend Vie
        </h1>

        {/* BUTTON */}
    <Link href="/shop?category=lighting">
<button
  className="
    relative mt-6 px-6 py-2
    border border-white/60
    text-white text-sm uppercase tracking-widest
    transition-colors duration-900
    hover:bg-white hover:text-black hover:font-semibold 
    cursor-pointer
  "
style={{
opacity: showContent ? 1 : 0,
transform: showContent ? "translateY(0)" : "translateY(15px)",
transitionDelay: "500ms",
transitionProperty: "opacity, transform",
}}
>
  Explorer
</button>
</Link>
      </div>

      {/* Lamp Container */}
      <div
        className="absolute inset-0 z-30 transition-transform"
        style={{
          transitionDuration: `${LAMP_SLIDE_DURATION}ms`,
          transitionTimingFunction: "ease",
          transform: lampVisible ? "translateY(0)" : "translateY(100%)",
        }}
      >
       {/* Lamp Dark */}
<div
  className="absolute inset-0 flex justify-center items-end transition-opacity"
  style={{
    transitionDuration: `${LAMP_FADE_DURATION - 2000}ms`,
    opacity: lampFadeOut ? 1 : 0, // <-- HERE
  }}
>
  <img
    src="/aboutimg.webp"
    alt="lamp dark"
    className="max-h-[100vh] max-w-full h-auto w-auto  md:object-contain"
  />
</div>

        {/* Lamp Light */}
        <div
          className="absolute inset-0 flex justify-center items-end transition-opacity"
          style={{
            transitionDuration: `${LAMP_FADE_DURATION}ms`,
            opacity: lampFadeOut ? 0 : 1,
          }}
        >
          <img src="/aboutimg.webp" alt="lamp" className="max-h-[100vh] max-w-full h-auto w-auto object-contain" />
        </div>
      </div>
    </div>
  )
}
