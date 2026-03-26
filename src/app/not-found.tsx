import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">
          Erreur 404
        </p>
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground mb-4">
          Page introuvable
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Voir la boutique
        </Link>
      </main>
      <Footer />
    </div>
  )
}
