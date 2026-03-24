import Image from 'next/image'
import Link from 'next/link'

import type { LuxeProduct } from '@/lib/mockData'

function formatEuro(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} €`
}

export default function ProductCard({ product }: { product: LuxeProduct }) {
  return (
    <article className="group rounded-2xl border border-stone-900/10 bg-white p-3 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/produit/${product.slug}`} aria-label={`Voir ${product.name}`} className="block overflow-hidden rounded-xl">
        <div className="relative aspect-[4/5] bg-stone-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="space-y-3 px-1 pb-1 pt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{product.category}</p>
        <h3 className="font-serif text-xl text-stone-950">{product.name}</h3>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-stone-800">{formatEuro(product.priceEuro)}</p>
          <button
            type="button"
            aria-label={`Apercu rapide de ${product.name}`}
            className="rounded-full border border-stone-900/15 px-3 py-1.5 text-xs text-stone-700 opacity-0 transition duration-300 group-hover:opacity-100 hover:bg-stone-950 hover:text-amber-50"
          >
            Apercu rapide
          </button>
        </div>
      </div>
    </article>
  )
}
