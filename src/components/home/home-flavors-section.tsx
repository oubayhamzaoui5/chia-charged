import Image from 'next/image'
import Link from 'next/link'

const flavors = [
  {
    id: 'strawberry',
    name: "Strawberries n' Cream",
    tagline: 'Sweet, fruity & creamy',
    badge: 'NEW !',
    image: '/strawberry.png',
    href: '/produit/pudding-proteine-aux-graines-de-chia-saveur-fraises-et-creme',
    price: '19.99',
    accent: '#E8446A',
  },
  {
    id: 'chocolate',
    name: 'Chocolate Chips',
    tagline: 'Rich, indulgent & satisfying',
    badge: 'NEW !',
    image: '/chocolate.png',
    href: '/boutique',
    price: '19.99',
    accent: '#D4813A',
  },
]

export default function HomeFlavorsSection() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">

        {/* header */}
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
            Nos Saveurs
          </span>
          <h2
            className="text-4xl font-black text-slate-900 md:text-5xl"
            style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
          >
            Choose Your Flavor
          </h2>
          <p className="mt-2 text-slate-400">Two flavors. One obsession.</p>
        </div>

        {/* flavor cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {flavors.map((flavor) => (
            <Link
              key={flavor.id}
              href={flavor.href}
              className="group relative flex flex-col overflow-hidden rounded-3xl transition-transform duration-300 hover:-translate-y-1"
              style={{
                boxShadow: '0 20px 60px rgba(124,58,237,0.12)',
              }}
            >
              {/* gradient image area */}
              <div
                className="relative flex flex-col items-center justify-center px-6 pt-6 pb-0"
                style={{
                  background: 'linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)',
                }}
              >
                {/* radial glow overlay */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: 'radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.14) 0%, transparent 65%)' }}
                />

                {/* badge */}
                <div className="relative z-10 flex w-full items-start justify-start">
                  <span
                    className="rounded-full border-2 border-white/30 bg-white/15 px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-sm"
                  >
                    {flavor.badge}
                  </span>
                </div>

                {/* image */}
                <div className="relative z-10 mx-auto flex h-80 w-80 items-center justify-center md:h-[420px] md:w-[420px]">
                  <div className="relative h-64 w-64 drop-shadow-2xl transition-transform duration-500 group-hover:scale-105 md:h-[380px] md:w-[380px]">
                    <div
                      className="absolute inset-4 rounded-full opacity-30 blur-2xl"
                      style={{ background: 'rgba(255,255,255,0.25)' }}
                    />
                    <Image
                      src={flavor.image}
                      alt={flavor.name}
                      fill
                      unoptimized
                      className="object-contain"
                      sizes="380px"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* white info area */}
              <div className="relative bg-white px-6 pt-5 pb-5">
                <h3
                  className="text-2xl font-black leading-tight text-slate-900 md:text-3xl"
                  style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
                >
                  {flavor.name}
                </h3>
                <p
                  className="mt-1 text-sm font-semibold"
                  style={{ color: flavor.accent }}
                >
                  {flavor.tagline}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {['22g Protein', '12g Fiber', 'MCT Oil'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900">
                    {flavor.price}
                    <span className="ml-1 text-sm font-semibold opacity-60">DT</span>
                  </span>
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity group-hover:opacity-90"
                    style={{
                      background: 'linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)',
                      boxShadow: '0 6px 20px rgba(124,58,237,0.35)',
                    }}
                  >
                    Shop Now <span aria-hidden>→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
