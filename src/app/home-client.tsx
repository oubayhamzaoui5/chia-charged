"use client"

import Hero from "@/components/hero"
import { Navbar } from "@/components/navbar"
import Categories from "@/components/categories"
import BestSellers from "@/components/best-sellers"
import NewArrive from "@/components/newArrive"
import About from "@/components/about"
import LifestyleGallery from "@/components/lifestyle-gallery"
import Reviews from "@/components/reviews"
import Footer from "@/components/footer"
import ContactPage from "@/components/contactpage"
import CategorySelector from "@/components/CategorySelector"

import type { Product } from "@/components/shop/product-card"

export default function HomeClient({ products }: { products: Product[] }) {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />

      <section className="sticky top-0 h-screen z-10">
        <Hero />
      </section>

      <section className="relative z-20 bg-background">
        <CategorySelector />

        <About />
        <BestSellers products={products} />
        <LifestyleGallery />
        <Reviews />

        <ContactPage />
        <Footer />
      </section>
    </main>
  )
}