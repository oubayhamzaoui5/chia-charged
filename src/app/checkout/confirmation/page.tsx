'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Package, MapPin, Phone, CreditCard, ArrowRight, ArrowLeft, Truck, Download } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"
const TEXTURE = { backgroundImage: "url('/texture.webp')", backgroundSize: '280px 280px' }

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
  paid: 'Paid',
  delivering: 'Delivering',
  delivered: 'Delivered',
  refunded: 'Refunded',
  'on hold': 'On hold',
}

const paymentLabels: Record<string, string> = {
  cash_on_delivery: 'Cash on delivery',
  stripe: 'Card payment',
  test_mode: 'Test mode',
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownloadInvoice = async (o: Order) => {
    setDownloading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const W = 210
      const margin = 18
      let y = 0

      // Purple header bar
      doc.setFillColor(124, 58, 237)
      doc.rect(0, 0, W, 36, 'F')

      // Brand
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(255, 255, 255)
      doc.text('CHIA CHARGED', margin, 16)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('INVOICE', margin, 24)

      // Order ID top-right
      doc.setFontSize(7)
      doc.setTextColor(220, 200, 255)
      const idText = `#${o.id.slice(-8).toUpperCase()}`
      doc.text(idText, W - margin, 16, { align: 'right' })
      const dateStr = new Date(o.created).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      doc.text(dateStr, W - margin, 24, { align: 'right' })

      y = 50

      // ── Billed To ──
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(124, 58, 237)
      doc.text('BILLED TO', margin, y)
      y += 5

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(17, 17, 17)
      doc.text(`${o.firstName} ${o.lastName}`, margin, y)
      y += 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(80, 80, 80)
      if (o.address) { doc.text(o.address, margin, y); y += 5 }
      if (o.city || o.postalCode) { doc.text(`${o.city}${o.postalCode ? ' ' + o.postalCode : ''}`, margin, y); y += 5 }
      if (o.phone) { doc.text(`Tel: ${o.phone}`, margin, y); y += 5 }

      y += 4

      // ── Payment info (right column) ──
      const col2 = W / 2 + 4
      let ry = 50
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(124, 58, 237)
      doc.text('PAYMENT', col2, ry); ry += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(80, 80, 80)
      const pm: Record<string, string> = { cash_on_delivery: 'Cash on delivery', stripe: 'Card payment', test_mode: 'Test mode' }
      doc.text(pm[o.paymentMode] ?? o.paymentMode, col2, ry); ry += 5
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(17, 17, 17)
      const statusLabelsLocal: Record<string, string> = { pending: 'Pending', confirmed: 'Confirmed', delevering: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled' }
      doc.text(`Status: ${statusLabelsLocal[o.status] ?? o.status}`, col2, ry)

      // Divider
      y = Math.max(y, ry) + 8
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(margin, y, W - margin, y)
      y += 8

      // ── Items table header ──
      doc.setFillColor(245, 239, 228)
      doc.roundedRect(margin, y - 4, W - margin * 2, 10, 1, 1, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(60, 60, 60)
      doc.text('ITEM', margin + 2, y + 2)
      doc.text('QTY', W - margin - 46, y + 2, { align: 'center' })
      doc.text('UNIT PRICE', W - margin - 24, y + 2, { align: 'right' })
      doc.text('TOTAL', W - margin, y + 2, { align: 'right' })
      y += 12

      // ── Items ──
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      for (const item of o.items) {
        doc.setTextColor(17, 17, 17)
        const nameLines = doc.splitTextToSize(item.name, 90)
        doc.text(nameLines, margin + 2, y)
        if (item.sku) {
          doc.setFontSize(7)
          doc.setTextColor(150, 150, 150)
          doc.text(`SKU: ${item.sku}`, margin + 2, y + nameLines.length * 4.5)
          doc.setFontSize(8.5)
        }
        doc.setTextColor(17, 17, 17)
        doc.text(String(item.quantity), W - margin - 46, y, { align: 'center' })
        doc.text(`$${item.unitPrice.toFixed(2)}`, W - margin - 24, y, { align: 'right' })
        doc.text(`$${(item.unitPrice * item.quantity).toFixed(2)}`, W - margin, y, { align: 'right' })
        y += nameLines.length * 5 + (item.sku ? 5 : 0) + 4

        doc.setDrawColor(230, 230, 230)
        doc.setLineWidth(0.2)
        doc.line(margin, y - 2, W - margin, y - 2)
      }

      y += 4

      // ── Totals ──
      const subtotal = o.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      const totalsX = W - margin - 60

      doc.setFontSize(8.5)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text('Subtotal', totalsX, y)
      doc.text(`$${subtotal.toFixed(2)}`, W - margin, y, { align: 'right' })
      y += 6

      doc.text('Shipping', totalsX, y)
      doc.setTextColor(46, 125, 50)
      doc.text(`+$${(o.total - subtotal).toFixed(2)}`, W - margin, y, { align: 'right' })
      y += 2

      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(totalsX, y + 2, W - margin, y + 2)
      y += 7

      doc.setFillColor(124, 58, 237)
      doc.roundedRect(totalsX - 4, y - 4, W - margin - totalsX + 8, 11, 1, 1, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text('TOTAL', totalsX, y + 3)
      doc.text(`$${o.total.toFixed(2)}`, W - margin, y + 3, { align: 'right' })
      y += 18

      // ── Footer ──
      doc.setDrawColor(220, 200, 255)
      doc.setLineWidth(0.4)
      doc.line(margin, y, W - margin, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text('Thank you for your order! — chiacharged.com', W / 2, y, { align: 'center' })

      doc.save(`invoice-${o.id.slice(-8).toUpperCase()}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

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
        if (!cancelled && data.order) {
          setOrder(data.order)
          void handleDownloadInvoice(data.order)
        }
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
      className="min-h-screen pb-20"
      style={{
        fontFamily: FONT,
        backgroundColor: '#f5efe4',
        ...TEXTURE,
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
            className="overflow-hidden"
            style={{ border: '4px solid #111', borderRadius: '2px', boxShadow: '6px 6px 0 #111' }}
          >
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{ background: GRADIENT, borderBottom: '4px solid #111' }}
            >
              <ArrowLeft className="h-4 w-4 text-white" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: FONT, fontWeight: 900 }}>
                Order not found
              </h2>
            </div>
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              style={{ backgroundColor: '#f5efe4', ...TEXTURE }}
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
          </div>
        ) : order ? (
          <div className="space-y-8">
            {/* Page title */}
            <header className="mb-2">
              <h1
                className="text-[2.4rem] font-black uppercase leading-none tracking-tighter md:text-[3.2rem]"
                style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: '-0.03em', color: '#111' }}
              >
                Order{' '}
                <span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Confirmed!
                </span>
              </h1>
              <p
                className="mt-2 text-[9px] font-black uppercase tracking-[0.2em]"
                style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
              >
                Thanks for your purchase — your order has been received.
              </p>
            </header>

            {/* Success banner */}
            <section
              className="overflow-hidden"
              style={{ border: '4px solid #111', borderRadius: '2px', boxShadow: '6px 6px 0 #111' }}
            >
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ background: GRADIENT, borderBottom: '4px solid #111' }}
              >
                <CheckCircle2 className="h-4 w-4 text-white" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: FONT, fontWeight: 900 }}>
                  Confirmation
                </h2>
              </div>
              <div
                className="flex flex-col items-center justify-center gap-4 px-5 py-8 text-center"
                style={{ backgroundColor: '#f5efe4', ...TEXTURE }}
              >
                <CheckCircle2 className="h-10 w-10" style={{ color: '#2E7D32' }} />
                <p
                  className="text-xs font-black uppercase tracking-[0.15em]"
                  style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.45)' }}
                >
                  Your order has been placed successfully.
                </p>
                <div>
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.15em]"
                    style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                  >
                    #{order.id.slice(-8).toUpperCase()}
                  </span>
                </div>
              </div>
            </section>

            {/* Order items */}
            <section
              className="overflow-hidden"
              style={{ border: '4px solid #111', borderRadius: '2px', boxShadow: '6px 6px 0 #111' }}
            >
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ background: GRADIENT, borderBottom: '4px solid #111' }}
              >
                <Package className="h-4 w-4 text-white" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: FONT, fontWeight: 900 }}>
                  Order Items
                </h2>
              </div>

              <div
                className="divide-y-2 divide-black/10 px-5 pt-5"
                style={{ backgroundColor: '#f5efe4', ...TEXTURE }}
              >
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-5">
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
                        <span className="mr-0.5 text-[9px] opacity-50">$</span>{(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div
                className="space-y-2 border-t-4 border-black p-5"
                style={{ backgroundColor: '#f5efe4', ...TEXTURE, borderTop: '3px solid rgba(0,0,0,0.12)' }}
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
                    ${order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)}
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
                    +${(order.total - order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)).toFixed(2)}
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
                    <span className="mr-0.5 text-sm opacity-50">$</span>{order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </section>

            {/* Delivery info */}
            <section
              className="overflow-hidden"
              style={{ border: '4px solid #111', borderRadius: '2px', boxShadow: '6px 6px 0 #111' }}
            >
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ background: GRADIENT, borderBottom: '4px solid #111' }}
              >
                <Truck className="h-4 w-4 text-white" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: FONT, fontWeight: 900 }}>
                  Shipping
                </h2>
              </div>
              <div
                className="space-y-2.5 p-5"
                style={{ backgroundColor: '#f5efe4', ...TEXTURE }}
              >
                <p
                  className="text-sm font-black uppercase tracking-tight"
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
                  {order.city}{order.postalCode ? ` ${order.postalCode}` : ''}
                </p>
                {order.phone && (
                  <div className="flex items-center gap-2 pt-1">
                    <Phone size={13} style={{ color: 'rgba(0,0,0,0.35)', flexShrink: 0 }} />
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.5)' }}
                    >
                      {order.phone}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CreditCard size={13} style={{ color: 'rgba(0,0,0,0.35)', flexShrink: 0 }} />
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ fontFamily: FONT, color: 'rgba(0,0,0,0.5)' }}
                  >
                    {paymentLabels[order.paymentMode] ?? order.paymentMode}
                  </span>
                </div>
              </div>
            </section>

            {/* Status + orders link */}
            <section
              className="overflow-hidden"
              style={{ border: '4px solid #111', borderRadius: '2px', boxShadow: '6px 6px 0 #111' }}
            >
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ background: GRADIENT, borderBottom: '4px solid #111' }}
              >
                <MapPin className="h-4 w-4 text-white" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: FONT, fontWeight: 900 }}>
                  Order Status
                </h2>
              </div>
              <div
                className="flex flex-wrap items-center justify-between gap-4 p-5"
                style={{ backgroundColor: '#f5efe4', ...TEXTURE }}
              >
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
            </section>

            {/* CTAs */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => handleDownloadInvoice(order)}
                disabled={downloading}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 border-3 border-black bg-white px-6 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-black transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50"
                style={{ fontFamily: FONT, fontWeight: 900, boxShadow: '4px 4px 0 #111' }}
              >
                <Download className="h-4 w-4" />
                {downloading ? 'Generating…' : 'Download Invoice'}
              </button>
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
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ fontFamily: FONT, backgroundColor: '#f5efe4', backgroundImage: "url('/texture.webp')", backgroundSize: '280px 280px' }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center border-3 border-black text-white"
            style={{ background: GRADIENT, boxShadow: '4px 4px 0 #111' }}
          >
            <div className="h-6 w-6 animate-spin border-3 border-white border-t-transparent" style={{ borderRadius: '50%' }} />
          </div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  )
}
