import type { Metadata } from 'next'
import { PackageSearch, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import OrdersListClient from '@/app/commandes/_components/orders-list.client'
import type { CustomerOrder } from '@/lib/services/orders.service'
import { getCurrentUserOrders, getRecommendedProductsFromOrders, OrdersServiceError } from '@/lib/services/orders.service'
import OrdersAuthRecoveryClient from '@/app/commandes/_components/orders-auth-recovery.client'
import ShopProductCard from '@/app/shop/_components/shop-product-card'

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

export const metadata: Metadata = {
  title: 'Chia Charged | My Orders',
}

export default async function CommandesPage() {
  let orders: CustomerOrder[] = []
  let recommendedProducts: Awaited<ReturnType<typeof getRecommendedProductsFromOrders>> = []
  let unauthenticated = false

  try {
    orders = await getCurrentUserOrders()
  } catch (error) {
    if (error instanceof OrdersServiceError && error.code === 'UNAUTHENTICATED') {
      unauthenticated = true
    } else {
      throw error
    }
  }

  if (!unauthenticated) {
    recommendedProducts = await getRecommendedProductsFromOrders(orders, 6)
  }

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: FONT,
        backgroundColor: '#f5efe4',
        backgroundImage: "url('/texture.webp')",
        backgroundSize: '280px 280px',
      }}
    >
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-32 md:px-8">
        {unauthenticated ? (
          <OrdersAuthRecoveryClient />
        ) : (
          <>
            {/* Header */}
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1
                  className="text-[2.4rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[3.5rem]"
                  style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: '-0.03em', color: '#111' }}
                >
                  My{' '}
                  <span
                    style={{
                      background: GRADIENT,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Orders.
                  </span>
                </h1>
                <p
                  className="mt-3 text-sm font-black uppercase tracking-[0.15em]"
                  style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
                >
                  Track your purchases in real time.
                </p>
              </div>
              <Link
                href="/boutique"
                className="inline-flex items-center gap-2 border-3 border-black bg-white px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-black transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{ fontFamily: FONT, fontWeight: 900, boxShadow: '4px 4px 0 #111' }}
              >
                <ArrowLeft className="h-4 w-4" />
                Shop
              </Link>
            </div>

            {orders.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center border-4 border-black bg-white py-20 text-center"
                style={{ boxShadow: '8px 8px 0 #111' }}
              >
                <div
                  className="flex h-16 w-16 items-center justify-center border-3 border-black"
                  style={{ background: GRADIENT, boxShadow: '4px 4px 0 #111' }}
                >
                  <PackageSearch className="h-8 w-8 text-white" />
                </div>
                <h2
                  className="mt-6 text-xl font-black uppercase tracking-tight"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                >
                  No Orders
                </h2>
                <p
                  className="mt-2 max-w-xs text-xs font-bold uppercase tracking-wider"
                  style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.4)' }}
                >
                  Your future purchases will appear here.
                </p>
                <Link
                  href="/boutique"
                  className="mt-8 inline-flex items-center gap-2 border-3 border-black px-8 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
                  style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    background: GRADIENT,
                    boxShadow: '4px 4px 0 #111',
                  }}
                >
                  Start shopping &#8594;
                </Link>
              </div>
            ) : (
              <OrdersListClient orders={orders} />
            )}

            {recommendedProducts.length > 0 && (
              <section className="mt-16">
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <h2
                      className="text-[1.8rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[2.5rem]"
                      style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                    >
                      You Might{' '}
                      <span
                        style={{
                          background: GRADIENT,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        Like.
                      </span>
                    </h2>
                    <p
                      className="mt-2 text-xs font-black uppercase tracking-[0.12em]"
                      style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
                    >
                      Recommended based on your orders.
                    </p>
                  </div>
                  <Link
                    href="/boutique"
                    className="text-xs font-black uppercase tracking-wider"
                    style={{
                      fontFamily: FONT,
                      fontWeight: 900,
                      background: GRADIENT,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    View more &#8594;
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                  {recommendedProducts.map((product, idx) => (
                    <div key={product.id}>
                      <ShopProductCard
                        product={product}
                        productHref={`/produit/${product.slug}`}
                        prioritizeImage={idx < 2}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
