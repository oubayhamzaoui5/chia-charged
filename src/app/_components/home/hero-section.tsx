import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-foreground/10">
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      <div className="absolute inset-0 opacity-30">
        <Image
          src="/aboutimg.webp"
          alt="Salon moderne avec luminaires design"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <div className="relative mx-auto grid min-h-[72vh] max-w-[1280px] items-center gap-8 px-4 py-20 md:grid-cols-2">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Collection 2026</p>
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Eclairage et deco pour des interieurs signatures
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-foreground/70 sm:text-lg">
            Luminaires sculpturaux, pieces deco et finitions premium pour transformer chaque espace.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/boutique">Decouvrir la boutique</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8">
              <Link href="/boutique?category=lighting">Voir les luminaires</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
