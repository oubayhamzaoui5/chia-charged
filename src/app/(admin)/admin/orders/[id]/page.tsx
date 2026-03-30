import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MapPin, Phone, Mail, User, CreditCard } from 'lucide-react'

import { requireAdmin } from '@/lib/auth'
import { createServerPb } from '@/lib/pb'
import { updateOrderStatusAction } from '../actions'
import type { OrderStatus } from '@/types/order.types'

export const dynamic = 'force-dynamic'

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'paid', label: 'Paid' },
  { value: 'delivering', label: 'Delivering' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'on hold', label: 'On hold' },
]

const statusColors: Record<OrderStatus, string> = {
  paid: 'bg-emerald-100 text-emerald-800',
  delivering: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-blue-100 text-blue-800',
  refunded: 'bg-rose-100 text-rose-800',
  'on hold': 'bg-slate-100 text-slate-800',
}

function productImageUrl(productId: string, filename: string) {
  const base =
    process.env.NEXT_PUBLIC_PB_URL ??
    process.env.POCKETBASE_URL ??
    'http://127.0.0.1:8090'
  return `${base}/api/files/products/${productId}/${encodeURIComponent(filename)}`
}

async function getOrderDetail(id: string) {
  const session = await requireAdmin()
  const pb = createServerPb()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pb.authStore.save(session.token, session.user as any)

  try {
    const record = await pb.collection('orders').getOne(id, { requestKey: null })

    const rawItems = Array.isArray(record.items) ? record.items : []
    const items = await Promise.all(
      rawItems.map(async (item: Record<string, unknown>) => {
        let imageUrl: string | undefined
        const productId = typeof item.productId === 'string' ? item.productId : null
        if (productId) {
          try {
            const product = await pb.collection('products').getOne(productId, {
              fields: 'id,images',
              requestKey: null,
            })
            const images = Array.isArray(product.images) ? product.images : []
            if (typeof images[0] === 'string') {
              imageUrl = productImageUrl(productId, images[0])
            }
          } catch {
            // ignore
          }
        }
        return {
          productId: productId ?? undefined,
          name: typeof item.name === 'string' ? item.name : 'Product',
          sku: typeof item.sku === 'string' ? item.sku : undefined,
          unitPrice: Number(item.unitPrice ?? 0),
          quantity: Math.max(1, Number(item.quantity ?? 1)),
          imageUrl,
        }
      })
    )

    return {
      id: String(record.id),
      created: String(record.created ?? ''),
      status: String(record.status ?? 'paid') as OrderStatus,
      firstName: String(record.firstName ?? ''),
      lastName: String(record.lastName ?? ''),
      email: String(record.email ?? ''),
      phone: String(record.phone ?? ''),
      address: String(record.address ?? ''),
      city: String(record.city ?? ''),
      postalCode: String(record.postalCode ?? ''),
      notes: String(record.notes ?? ''),
      paymentMode: String(record.paymentMode ?? ''),
      total: Number(record.total ?? 0),
      currency: String(record.currency ?? '$'),
      userId: typeof record.user === 'string' ? record.user : null,
      items,
    }
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 404) return null
    throw e
  }
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrderDetail(id)

  if (!order) notFound()

  const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const shipping = order.total - subtotal

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: '#6B7280' }}
        >
          <ArrowLeft size={16} />
          Back to orders
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Order Detail</p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>#{order.id.slice(-8)}</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            Placed on {new Date(order.created).toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${statusColors[order.status] ?? 'bg-slate-100 text-slate-800'}`}>
          {statusOptions.find(s => s.value === order.status)?.label ?? order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: items + total */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #E8EAED', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4 border-b border-slate-100 font-semibold text-slate-800">
              Items ({order.items.length})
            </div>
            <div className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">IMG</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.name}</p>
                                        {item.sku && <p className="text-xs text-slate-400">Ref: {item.sku}</p>}
                    <p className="text-sm text-slate-600 mt-0.5">${item.unitPrice.toFixed(2)} x {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-slate-800">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 space-y-1 bg-slate-50">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {shipping > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status update */}
          <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #E8EAED', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 className="font-semibold mb-4" style={{ color: '#111827' }}>Update status</h2>
            <form
              action={async (formData: FormData) => {
                'use server'
                const status = formData.get('status') as string
                await updateOrderStatusAction(id, status)
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <select
                name="status"
                defaultValue={order.status}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#374151' }}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#4F46E5' }}
              >Update</button>
            </form>
            {order.notes && (
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800">
                <span className="font-semibold">Customer note: </span>{order.notes}
              </div>
            )}
          </div>
        </div>

        {/* Right column: customer + delivery */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #E8EAED', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2 mb-4 font-semibold" style={{ color: '#111827' }}>
              <User size={16} />
              Customer
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium" style={{ color: '#111827' }}>{order.firstName} {order.lastName}</p>
              {order.email && (
                <div className="flex items-center gap-2" style={{ color: '#6B7280' }}>
                  <Mail size={13} />
                  <span>{order.email}</span>
                </div>
              )}
              {order.phone && (
                <div className="flex items-center gap-2" style={{ color: '#6B7280' }}>
                  <Phone size={13} />
                  <span>{order.phone}</span>
                </div>
              )}
              {order.userId && (
                <Link
                  href={`/admin/users?search=${encodeURIComponent(order.email || order.firstName)}`}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: '#4F46E5' }}
                >
                  View profile →
                </Link>
              )}
            </div>
          </div>

          {/* Delivery info */}
          <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #E8EAED', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2 mb-4 font-semibold" style={{ color: '#111827' }}>
              <MapPin size={16} />
              Shipping
            </div>
            <div className="text-sm space-y-1" style={{ color: '#6B7280' }}>
              <p>{order.address}</p>
              <p>{order.city} {order.postalCode}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #E8EAED', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2 mb-3 font-semibold" style={{ color: '#111827' }}>
              <CreditCard size={16} />
              Payment
            </div>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {order.paymentMode === 'cash_on_delivery' ? 'Cash on delivery' : order.paymentMode}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
