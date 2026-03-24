"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function ProductGallery({
  images,
  productName,
}: {
  images: string[]
  productName: string
}) {
  const [currentImage, setCurrentImage] = useState(0)
  const carouselRef = useRef<HTMLDivElement | null>(null)

  const safeImages = Array.isArray(images) && images.length ? images : ["/aboutimg.webp"]
  const hasMultipleImages = safeImages.length > 1
  const galleryLayoutClass = hasMultipleImages
    ? "grid gap-4 md:grid-cols-[1fr_auto] md:items-start"
    : "grid gap-4 md:pr-[116px]"
  const mainImageClass = "relative aspect-square overflow-hidden rounded-2xl bg-muted"

  const scrollToImage = (index: number, behavior: ScrollBehavior = "smooth") => {
    const container = carouselRef.current
    if (!container) return
    container.scrollTo({ left: index * container.clientWidth, behavior })
    setCurrentImage(index)
  }

  // Manual image selection
  const handleSelectImage = (index: number) => {
    if (index === currentImage) return
    scrollToImage(index)
  }

  const handlePreviousImage = () => {
    if (!hasMultipleImages) return
    scrollToImage(Math.max(0, currentImage - 1))
  }

  const handleNextImage = () => {
    if (!hasMultipleImages) return
    scrollToImage(Math.min(safeImages.length - 1, currentImage + 1))
  }

  useEffect(() => {
    const onResize = () => {
      const container = carouselRef.current
      if (!container) return
      container.scrollTo({ left: currentImage * container.clientWidth, behavior: "auto" })
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", onResize)
      }
    }
  }, [currentImage])

  const handleCarouselScroll = () => {
    const container = carouselRef.current
    if (!container || !container.clientWidth) return
    const nextIndex = Math.round(container.scrollLeft / container.clientWidth)
    if (nextIndex !== currentImage) {
      setCurrentImage(nextIndex)
    }
  }

  return (
    <div className={galleryLayoutClass}>
      {/* Main Image Container */}
      <div className={mainImageClass}>
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {safeImages.map((img, i) => (
            <div key={img + i} className="relative h-full w-full shrink-0 snap-start">
              <Image
                src={img}
                alt={`${productName} view ${i + 1}`}
                fill
                unoptimized
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePreviousImage}
              aria-label="Previous image"
              disabled={currentImage === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-foreground shadow-sm transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next image"
              disabled={currentImage === safeImages.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-foreground shadow-sm transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultipleImages && (
        <div className="grid grid-cols-4 gap-3 md:grid-cols-1">
          {safeImages.map((img, i) => (
            <button
              key={img + i}
              onClick={() => handleSelectImage(i)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 md:w-[100px] ${
                currentImage === i
                  ? "scale-105 border-accent"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <Image
                src={img}
                alt={`${productName} view ${i + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
