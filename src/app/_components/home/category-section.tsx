import Image from 'next/image'
import Link from 'next/link'

type CategoryItem = {
  id: string
  name: string
  href: string
  image: string
  description: string
}

export default function CategorySection({ items }: { items: CategoryItem[] }) {
  return (
    <section aria-labelledby="categories-heading" className="mx-auto max-w-[1280px] px-4 py-12 md:py-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 id="categories-heading" className="font-serif text-3xl font-semibold tracking-tight">
          Explorer par categorie
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group relative overflow-hidden rounded-2xl border border-foreground/10"
          >
            <div className="relative h-56">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <p className="text-lg font-semibold">{item.name}</p>
              <p className="text-sm text-white/90">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
