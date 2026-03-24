import { BadgeCheck, ShieldCheck, Sparkles, Truck } from 'lucide-react'

const icons = [Truck, Sparkles, ShieldCheck, BadgeCheck]

type TrustItem = {
  id: string
  title: string
  description: string
}

export default function TrustFooter({ items }: { items: TrustItem[] }) {
  return (
    <footer className="border-t border-stone-900/10 bg-white" aria-label="Garanties boutique">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">
        {items.map((item, idx) => {
          const Icon = icons[idx]
          return (
            <article key={item.id} className="space-y-3 rounded-2xl border border-stone-900/10 p-5">
              <Icon className="h-5 w-5 text-stone-900" aria-hidden="true" />
              <h3 className="font-serif text-xl text-stone-950">{item.title}</h3>
              <p className="text-sm leading-relaxed text-stone-700">{item.description}</p>
            </article>
          )
        })}
      </div>
    </footer>
  )
}
