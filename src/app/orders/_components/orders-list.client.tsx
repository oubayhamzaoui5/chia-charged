'use client'

import Image from 'next/image'
import { useState } from 'react'
import { CreditCard, PackageCheck, Truck, ShoppingBag, RotateCcw, Pause } from 'lucide-react'
import type { CustomerOrder, CustomerOrderStatus } from '@/lib/services/orders.service'

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

type Props = { orders: CustomerOrder[] }

const statusConfig: Record<CustomerOrderStatus, { label: string; bg: string; text: string; icon: any }> = {
  paid: { label: 'Paid', bg: '#E8F5E9', text: '#2E7D32', icon: CreditCard },
  delivering: { label: 'Out for delivery', bg: '#EDE7F6', text: '#6A1B9A', icon: Truck },
  delivered: { label: 'Delivered', bg: '#E3F2FD', text: '#1565C0', icon: PackageCheck },
  refunded: { label: 'Refunded', bg: '#FCE4EC', text: '#AD1457', icon: RotateCcw },
  'on hold': { label: 'On hold', bg: '#ECEFF1', text: '#37474F', icon: Pause },
}

const rotations = ['-0.6deg', '0.4deg', '-0.3deg', '0.5deg', '-0.4deg']

export default function OrdersListClient({ orders }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const formatMoney = (value: number) => `$${value.toFixed(2)}`

  async function addAllToCart(order: CustomerOrder) {
    setBusyId(order.id)
    try {
      for (const item of order.items) {
        if (item.productId) {
          await fetch('/api/shop/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
          })
        }
      }
      window.dispatchEvent(new Event('cart:updated'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      {orders.map((order, i) => {
        const config = statusConfig[order.status]
        const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0)
        const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
        const deliveryFee = Math.max(0, order.totalAmount - subtotal)
        const primaryDate = order.status === 'delivered' ? order.updatedAt : order.createdAt
        const dateLabel = order.status === 'delivered' ? 'Delivered on' : 'Ordered on'
        const rot = rotations[i % rotations.length]

        return (
          <div
            key={order.id}
            className="group overflow-hidden bg-white transition-all duration-300 hover:-translate-x-0.5 hover:-translate-y-0.5"
            style={{
              border: '4px solid #111',
              borderRadius: '2px',
              boxShadow: '8px 8px 0 #111',
              transform: `rotate(${rot})`,
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow = '12px 12px 0 #111'
              ;(e.currentTarget as HTMLElement).style.transform = 'rotate(0deg)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow = '8px 8px 0 #111'
              ;(e.currentTarget as HTMLElement).style.transform = `rotate(${rot})`
            }}
          >
            {/* Header bar */}
            <div className="flex w-full flex-wrap items-center justify-between gap-4 border-b-3 border-black p-5">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-10 w-10 items-center justify-center border-2 border-black"
                  style={{ background: config.bg, boxShadow: '2px 2px 0 #111' }}
                >
                  <config.icon className="h-5 w-5" style={{ color: config.text }} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.15em]"
                      style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}
                    >
                      #{order.id.slice(-6)}
                    </span>
                    <span
                      className="border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                      style={{
                        fontFamily: FONT,
                        fontWeight: 900,
                        background: config.bg,
                        color: config.text,
                        boxShadow: '2px 2px 0 #111',
                      }}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p
                    className="mt-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.35)' }}
                  >
                    {dateLabel}
                  </p>
                  <p
                    className="text-sm font-black"
                    style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                  >
                    {new Date(primaryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p
                  className="text-lg font-black"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                >
                  {formatMoney(order.totalAmount)}
                </p>
                <p
                  className="text-[10px] font-black uppercase tracking-wider"
                  style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
                >
                  {totalQty} item{totalQty > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Items */}
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
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.35)' }}
                    >
                      SKU: {item.sku || '-'}
                    </p>
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
                      {formatMoney(item.unitPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              className="flex flex-col gap-4 border-t-3 border-black p-5 sm:flex-row sm:items-center sm:justify-between"
              style={{ background: 'rgba(0,0,0,0.02)' }}
            >
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-wider"
                  style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
                >
                  Delivery: <span style={{ color: '#111' }}>{formatMoney(deliveryFee)}</span>
                </p>
                <p
                  className="mt-1 text-xl font-black"
                  style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                >
                  Total: {formatMoney(order.totalAmount)}
                </p>
              </div>
              <button
                onClick={() => addAllToCart(order)}
                disabled={busyId === order.id}
                className="flex cursor-pointer items-center justify-center gap-2 border-3 border-black px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50"
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  background: GRADIENT,
                  boxShadow: '4px 4px 0 #111',
                }}
              >
                <ShoppingBag className="h-4 w-4" />
                {busyId === order.id ? 'Adding...' : 'Order again'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
