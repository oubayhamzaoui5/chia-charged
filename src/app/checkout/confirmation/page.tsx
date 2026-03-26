'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Package, MapPin, Phone, CreditCard, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

type OrderItem = {
  productId?: string
  name: string
  sku?: string
  unitPrice: number
  quantity: number
  imageUrl?: string
}

type Order = {
  id: string
  created: string
  status: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  postalCode: string
  paymentMode: string
  total: number
  currency: string
  items: OrderItem[]
}

const statusLabels: Record<string, string> = {
  pending: 'Pending confirmation',
  confirmed: 'Confirmed',
  delevering: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setError('Missing order ID.')
      setLoading(false)
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/shop/orders/${orderId}`, { cache: 'no-store' })
        if (!res.ok) {
          setError('Order not found.')
          return
        }
        const data = await res.json()
        if (!cancelled) setOrder(data.order)
      } catch {
        if (!cancelled) setError('Unable to load the order.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [orderId])

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        fontFamily: FONT,
        backgroundColor: '#f5efe4',
        backgroundImage: "url('/texture.webp')",
        backgroundSize: '280px 280px',
      }}
    >
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-32 md:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div
              className="flex h-14 w-14 items-center justify-center border-3 border-black text-white"
              style={{ background: GRADIENT, boxShadow: '4px 4px 0 #111' }}
            >
              <div className="h-6 w-6 animate-spin border-3 border-white border-t-transparent" style={{ borderRadius: '50%' }} />
            </div>
          </div>
        ) : error ? (
          <div
            className="flex flex-col items-center justify-center border-4 border-black bg-white py-20 text-center"
            style={{ boxShadow: '8px 8px 0 #111' }}
          >
            <p
              className="text-xs font-black uppercase tracking-wider"
              style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}
            >
              {error}
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 border-3 border-black px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{ fontFamily: FONT, fontWeight: 900, background: GRADIENT, boxShadow: '4px 4px 0 #111' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        ) : order ? (
          <div className="space-y-8">
            {/* Success header */}
            <div
              className="overflow-hidden bg-white text-center"
              style={{
                border: '4px solid #111',
                borderRadius: '2px',
                boxShadow: '8px 8px 0 #111',
              }}
            >
              <div className="p-8">
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center border-3 border-black"
                  style={{ background: '#E8F5E9', boxShadow: '4px 4px 0 #111' }}
                >
                  <CheckCircle2 className="h-9 w-9" style={{ color: '#2E7D32' }} />
                </div>
                <h1
                  className="text-[1.8rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[2.5rem]"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                >
                  Order{' '}
                  <span
                    style={{
                      background: GRADIENT,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Confirmed!
                  </span>
                </h1>
                <p
                  className="mt-3 text-xs font-black uppercase tracking-[0.15em]"
                  style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
                >
                  Thanks for your purchase. Your order has been received.
                </p>
                <div
                  className="mt-4 inline-block border-2 border-black px-3 py-1"
                  style={{ boxShadow: '2px 2px 0 #111' }}
                >
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.15em]"
                    style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}
                  >
                    #{order.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Order items */}
            <div
              className="overflow-hidden bg-white"
              style={{
                border: '4px solid #111',
                borderRadius: '2px',
                boxShadow: '8px 8px 0 #111',
              }}
            >
              <div className="flex items-center gap-3 border-b-3 border-black p-5">
                <div
                  className="flex h-10 w-10 items-center justify-center border-2 border-black text-white"
                  style={{ background: GRADIENT, boxShadow: '2px 2px 0 #111' }}
                >
                  <Package className="h-5 w-5" />
                </div>
                <h2
                  className="text-base font-black uppercase tracking-tight"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                >
                  Order Items
                </h2>
              </div>

              <div className="divide-y-2 divide-black/10 p-5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div
                      className="relative h-16 w-16 flex-shrink-0 overflow-hidden border-2 border-black"
                      style={{ boxShadow: '3px 3px 0 #111' }}
                    >
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-[8px] font-black uppercase tracking-wider text-white"
                          style={{ fontFamily: FONT, background: GRADIENT }}
                        >
                          IMG
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-black uppercase tracking-tight"
                        style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                      >
                        {item.name}
                      </p>
                      {item.sku && (
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.35)' }}
                        >
                          SKU: {item.sku}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 pr-2">
                      <span
                        className="text-xs font-black uppercase"
                        style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.5)' }}
                      >
                        x{item.quantity}
                      </span>
                      <span
                        className="text-sm font-black"
                        style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                      >
                        {(item.unitPrice * item.quantity).toFixed(2)}
                        <span className="ml-0.5 text-[9px] opacity-50">{order.currency}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div
                className="space-y-2 border-t-3 border-black p-5"
                style={{ background: 'rgba(0,0,0,0.02)' }}
              >
                <div className="flex justify-between">
                  <span
                  className="text-[10px] font-black uppercase tracking-wider"
                  style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
                >
                  Subtotal
                </span>
                <span
                  className="text-sm font-black"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                >
                    {(order.total - 8).toFixed(2)} {order.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                  className="text-[10px] font-black uppercase tracking-wider"
                  style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
                >
                  Shipping
                </span>
                <span
                  className="text-sm font-black"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#2E7D32' }}
                  >
                    +8.00 {order.currency}
                  </span>
                </div>
                <div className="flex items-end justify-between border-t-2 border-black/10 pt-3">
                  <span
                  className="text-sm font-black uppercase"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                >
                  Total
                  </span>
                  <span
                    className="text-xl font-black"
                    style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                  >
                    {order.total.toFixed(2)}
                    <span className="ml-1 text-sm opacity-50">{order.currency}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery info */}
            <div
              className="overflow-hidden bg-white"
              style={{
                border: '4px solid #111',
                borderRadius: '2px',
                boxShadow: '8px 8px 0 #111',
              }}
            >
              <div className="flex items-center gap-3 border-b-3 border-black p-5">
                <div
                  className="flex h-10 w-10 items-center justify-center border-2 border-black text-white"
                  style={{ background: GRADIENT, boxShadow: '2px 2px 0 #111' }}
                >
                  <MapPin className="h-5 w-5" />
                </div>
                <h2
                  className="text-base font-black uppercase tracking-tight"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                >
                  Delivery
                </h2>
              </div>
              <div className="space-y-2 p-5">
                <p
                  className="text-sm font-black"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                >
                  {order.firstName} {order.lastName}
                </p>
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.5)' }}
                >
                  {order.address}
                </p>
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.5)' }}
                >
                  {order.city} {order.postalCode}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Phone size={14} style={{ color: 'rgba(0,0,0,0.35)' }} />
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.5)' }}
                  >
                    {order.phone}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard size={14} style={{ color: 'rgba(0,0,0,0.35)' }} />
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.5)' }}
                  >
                    Cash on delivery
                  </span>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div
              className="flex flex-wrap items-center justify-between gap-4 border-4 border-black bg-white p-5"
              style={{ boxShadow: '8px 8px 0 #111' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="border-2 border-black px-2.5 py-1 text-[9px] font-black uppercase tracking-wider"
                  style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    background: '#FFF8E1',
                    color: '#F57F17',
                    boxShadow: '2px 2px 0 #111',
                  }}
                >
                  {statusLabels[order.status] ?? order.status}
                </div>
              </div>
              <Link
                href="/orders"
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] transition-opacity hover:opacity-70"
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  background: GRADIENT,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                View my orders <ArrowRight size={12} style={{ color: 'rgb(124,58,237)' }} />
              </Link>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/shop"
                className="flex flex-1 items-center justify-center gap-2 border-3 border-black bg-white px-6 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-black transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{ fontFamily: FONT, fontWeight: 900, boxShadow: '4px 4px 0 #111' }}
              >
                <ShoppingBag className="h-4 w-4" />
                Continue shopping
              </Link>
              <Link
                href="/orders"
                className="flex flex-1 items-center justify-center gap-2 border-3 border-black px-6 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-white transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{ fontFamily: FONT, fontWeight: 900, background: GRADIENT, boxShadow: '4px 4px 0 #111' }}
              >
                My orders
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-3 border-black border-t-transparent" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  )
}
