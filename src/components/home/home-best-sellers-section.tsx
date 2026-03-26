import Link from 'next/link'
import ShopProductCard from '@/app/shop/_components/shop-product-card'
import type { ProductListItem } from '@/lib/services/product.service'

type HomeBestSellersSectionProps = {
  products: ProductListItem[]
}

export default function HomeBestSellersSection({ products }: HomeBestSellersSectionProps) {
  return (
    <section className="overflow-hidden bg-white py-14 md:py-18 lg:py-20">
      <div className="mx-auto mb-8 flex max-w-7xl items-end justify-between px-4 md:mb-12 md:px-2">
        <div>
          <span className="mb-2 inline-block rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            Top Picks
          </span>
          <h2
            className="text-3xl font-black text-slate-900 lg:text-4xl"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
          >
            Best Sellers
          </h2>
          <p className="mt-1 text-sm text-slate-400">Loved by thousands of health-conscious customers.</p>
        </div>
        <Link
          href="/shop"
          className="hidden shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition-all hover:border-accent/40 hover:text-accent md:inline-flex"
        >
          View All <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-2 md:hidden">
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-scroll always-visible-scrollbar pb-1">
          {products.map((product, idx) => (
            <div
              key={product.id}
              className="w-[calc((100%-0.75rem)/2)] min-w-[calc((100%-0.75rem)/2)] flex-none snap-start rounded-2xl border border-transparent p-1"
            >
              <ShopProductCard
                product={product}
                productHref={`/product/${product.slug}`}
                prioritizeImage={idx < 2}
                disableAnimations
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto hidden max-w-7xl grid-cols-1 gap-6 px-2 md:grid md:grid-cols-2 xl:grid-cols-4">
        {products.map((product, idx) => (
          <div key={product.id} className="rounded-2xl border border-transparent p-2">
            <ShopProductCard
              product={product}
              productHref={`/product/${product.slug}`}
              prioritizeImage={idx < 2}
              disableAnimations
            />
          </div>
        ))}
      </div>
    </section>
  )
}
