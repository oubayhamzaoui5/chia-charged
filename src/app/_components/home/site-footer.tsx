import Link from 'next/link'
import { Instagram, Linkedin, Twitter } from 'lucide-react'

export default function SiteFooter() {
  return (
    <footer className="border-t border-foreground/10 bg-foreground/[0.02]">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <p className="font-serif text-xl font-semibold">Luma Maison</p>
          <p className="mt-3 max-w-xs text-sm text-foreground/65">
            E-commerce interieur et eclairage haut de gamme pour des espaces contemporains.
          </p>
        </div>

        <nav aria-label="Liens boutique" className="space-y-2 text-sm">
          <p className="font-medium">Boutique</p>
          <Link href="/shop" className="block text-foreground/70 hover:text-foreground">
            Tous les produits
          </Link>
          <Link href="/shop?category=lighting" className="block text-foreground/70 hover:text-foreground">
            Luminaires
          </Link>
          <Link href="/new-arrivals" className="block text-foreground/70 hover:text-foreground">
            Nouveautes
          </Link>
        </nav>

        <nav aria-label="Liens service" className="space-y-2 text-sm">
          <p className="font-medium">Service</p>
          <Link href="#" className="block text-foreground/70 hover:text-foreground">
            Livraison
          </Link>
          <Link href="#" className="block text-foreground/70 hover:text-foreground">
            Retour
          </Link>
          <Link href="#" className="block text-foreground/70 hover:text-foreground">
            Contact
          </Link>
        </nav>

        <div className="space-y-3 text-sm">
          <p className="font-medium">Suivez-nous</p>
          <div className="flex items-center gap-3">
            <Link href="#" aria-label="Instagram" className="rounded-full border border-foreground/20 p-2 hover:bg-foreground/5">
              <Instagram className="size-4 text-white" />
            </Link>
            <Link href="#" aria-label="Twitter" className="rounded-full border border-foreground/20 p-2 hover:bg-foreground/5">
              <Twitter className="size-4 text-white" />
            </Link>
            <Link href="#" aria-label="LinkedIn" className="rounded-full border border-foreground/20 p-2 hover:bg-foreground/5">
              <Linkedin className="size-4 text-white" />
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-foreground/10 px-4 py-4 text-center text-xs text-foreground/55">
        © 2026 Luma Maison. Tous droits réservés.
      </div>
    </footer>
  )
}
