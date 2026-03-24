import Link from 'next/link'
import { Search, ShoppingBag, User } from 'lucide-react'

import type { LuxeNavItem } from '@/lib/mockData'

export default function LuxeHeader({ items }: { items: LuxeNavItem[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-900/10 bg-amber-50/90 backdrop-blur">
      <nav aria-label="Navigation principale" className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
        <Link href="/" className="font-serif text-xl tracking-wide text-stone-950" aria-label="Retour a l accueil">
          Maison Lumiere
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="text-sm text-stone-800 transition duration-200 hover:text-stone-950"
                aria-label={item.label}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4" aria-label="Actions utilisateur">
          <button type="button" aria-label="Rechercher" className="text-stone-800 transition hover:text-stone-950">
            <Search className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Compte" className="text-stone-800 transition hover:text-stone-950">
            <User className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Panier" className="text-stone-800 transition hover:text-stone-950">
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </nav>
    </header>
  )
}
