// app/commande/page.tsx
import type { Metadata } from "next"
import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import Footer from "@/components/footer"
import { CheckoutContent } from "@/components/checkout-content"

export const metadata: Metadata = {
  title: "Chia Charged | Paiement",
}

export default function CommandePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <Suspense
          fallback={
            <div
              className="flex min-h-screen items-center justify-center"
              style={{
                fontFamily: "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif",
                fontWeight: 900,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'rgba(0,0,0,0.35)',
                backgroundColor: '#f5efe4',
                backgroundImage: "url('/texture.webp')",
                backgroundSize: '280px 280px',
              }}
            >
              Chargement...
            </div>
          }
        >
          <CheckoutContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}
