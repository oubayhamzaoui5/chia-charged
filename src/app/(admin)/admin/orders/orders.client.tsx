'use client'

import { useMemo, useState, useRef, useEffect, Fragment } from 'react'
import { createPortal } from 'react-dom'
import EmptyState from '@/components/admin/empty-state'
import { Trash2, ChevronDown, ChevronUp, Pause, ShoppingCart, CheckCircle2, Truck, Search, Download } from 'lucide-react'
import type { OrderRecord, OrderStatus } from '@/types/order.types'
import { deleteOrderAction, updateOrderStatusAction } from './actions'
import { useAdminToast } from '@/components/admin/AdminToast'

export default function OrdersClient({ initialOrders }: { initialOrders: OrderRecord[] }) {
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders)
  const [query, setQuery] = useState('')
  const { toast, ToastContainer } = useAdminToast()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [yearFilter, setYearFilter] = useState<'all' | number>('all')
  const [monthFilter, setMonthFilter] = useState<'all' | number>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')

  function csvCell(value: unknown) {
    const normalized = String(value ?? '').replace(/"/g, '""')
    return `"${normalized}"`
  }

  const verifiedIcon = (isVerified: boolean | undefined) => {
    if (!isVerified) return null;
    return (
      <CheckCircle2 className="ml-1 h-4 w-4 bg-emerald-500 text-white rounded-full inline-block" />
    )
  }

  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement }>({})

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(orders.map(o => new Date(o.created).getFullYear())))
    return uniqueYears.sort((a, b) => b - a)
  }, [orders])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter(o => {
      const name = o.userName?.toLowerCase() ?? ''
      const city = o.city?.toLowerCase() ?? ''
      const postal = o.postalCode?.toLowerCase() ?? ''
      const status = o.status.toLowerCase()

      const matchesQuery = !q || name.includes(q) || city.includes(q) || postal.includes(q)
      const orderYear = new Date(o.created).getFullYear()
      const matchesYear = yearFilter === 'all' || orderYear === yearFilter
      const orderMonth = new Date(o.created).getMonth() + 1
      const matchesMonth = monthFilter === 'all' || orderMonth === monthFilter
      const matchesStatus = statusFilter === 'all' || status === statusFilter

      return matchesQuery && matchesYear && matchesMonth && matchesStatus
    })
  }, [orders, query, yearFilter, monthFilter, statusFilter])

  const sortedOrders = useMemo(() => filtered.slice().sort((a, b) => (a.created < b.created ? 1 : -1)), [filtered])

  const statusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-3 h-3" />
      case 'delivering': return <Truck className="w-3 h-3" />
      case 'delivered': return <ShoppingCart className="w-3 h-3" />
      case 'refunded': return <Trash2 className="w-3 h-3" />
      case 'on hold': return <Pause className="w-3 h-3" />
    }
  }

  const statusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-700'
      case 'delivering': return 'bg-purple-50 text-purple-700'
      case 'delivered': return 'bg-blue-50 text-blue-700'
      case 'refunded': return 'bg-red-50 text-red-700'
      case 'on hold': return 'bg-slate-100 text-slate-600'
    }
  }

  const statusLabels: Record<OrderStatus, string> = {
    paid: 'Paid',
    delivering: 'Delivering',
    delivered: 'Delivered',
    refunded: 'Refunded',
    'on hold': 'On hold',
  }

  function extractCountAndFlavor(name?: string, sku?: string) {
    const raw = `${name ?? ''} ${sku ?? ''}`.trim()
    const normalized = raw
      .toLowerCase()
      .replace(/[_|/\\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const countPatterns = [
      /(\d+\s*(?:servings?|srv|capsules?|sachets?|packs?|ct|count|pcs?|units?|g|kg|ml|l|oz|lb))/i,
      /(\d+)(?=(?:servings?|srv|capsules?|sachets?|packs?|ct|count|pcs?|units?|g|kg|ml|l|oz|lb)\b)/i,
      /\b(x\s*\d+|\d+\s*x)\b/i,
    ]

    let count: string | undefined
    for (const pattern of countPatterns) {
      const match = normalized.match(pattern)
      if (match?.[1]) {
        const value = match[1].replace(/\s+/g, ' ').trim()
        count = /^\d+$/.test(value) ? `${value} count` : value
        break
      }
    }

    const flavorCandidates = [
      'chocolate chip',
      'cookies and cream',
      'strawberry',
      'vanilla',
      'banana',
      'mango',
      'berry',
      'chocolate',
      'chocolat',
      'choco',
      'fraise',
      'framboise',
      'vanille',
    ]

    let flavor = flavorCandidates.find((candidate) => normalized.includes(candidate))

    if (!flavor) {
      const tokens = normalized.split(' ')
      const stopWords = new Set([
        'chia',
        'charged',
        'protein',
        'pudding',
        'pack',
        'count',
        'serving',
        'servings',
        'ct',
        'sku',
      ])

      for (const token of tokens) {
        if (
          token.length >= 4 &&
          !/\d/.test(token) &&
          !stopWords.has(token) &&
          !count?.includes(token)
        ) {
          flavor = token
          break
        }
      }
    }

    return { count, flavor }
  }

  function formatCountFlavor(count?: string, flavor?: string) {
    const normalizedFlavor = flavor
      ? flavor
          .split(' ')
          .filter(Boolean)
          .map((part) => part[0]!.toUpperCase() + part.slice(1))
          .join(' ')
      : ''

    if (count && normalizedFlavor) return `Count: ${count} | Flavor: ${normalizedFlavor}`
    if (count) return `Count: ${count}`
    if (normalizedFlavor) return `Flavor: ${normalizedFlavor}`
    return ''
  }

  function exportOrdersCsv() {
    if (sortedOrders.length === 0) {
      toast('No orders to export.', 'error')
      return
    }

    const headers = [
      'Order ID',
      'Date',
      'Customer',
      'Email',
      'Address',
      'City',
      'Postal Code',
      'Status',
      'Amount',
      'Currency',
      'Payment Mode',
      'Items',
      'Notes',
    ]

    const rows = sortedOrders.map((order) => {
      const itemsSummary = (order.items ?? [])
        .map((item) => `${item.quantity ?? 1}x ${item.name}${item.sku ? ` (${item.sku})` : ''}`)
        .join(' | ')

      return [
        order.id,
        new Date(order.created).toISOString(),
        order.userName || 'Guest',
        order.email || '',
        order.address || '',
        order.city || '',
        order.postalCode || '',
        statusLabels[order.status as OrderStatus] ?? order.status,
        order.total.toFixed(2),
        order.currency || '$',
        order.paymentMode || '',
        itemsSummary,
        order.notes || '',
      ]
    })

    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast('Orders CSV exported.', 'success')
  }

  async function deleteOrder(id: string) {
    if (!confirm('Delete this order?')) return

    const prev = orders
    setOrders((current) => current.filter((o) => o.id !== id))

    try {
      await deleteOrderAction(id)
      toast('Order deleted.', 'success')
      window.dispatchEvent(new Event('admin:orders-changed'))
    } catch {
      setOrders(prev)
      toast('Delete failed.', 'error')
    }
  }

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    const prev = orders
    setOrders((current) =>
      current.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )

    try {
      const result = await updateOrderStatusAction(orderId, newStatus)
      setOrders((current) =>
        current.map((o) => (o.id === orderId ? { ...o, status: result.status } : o))
      )
      setOpenMenuId(null)
      toast('Status updated.', 'success')
      window.dispatchEvent(new Event('admin:orders-changed'))
    } catch {
      setOrders(prev)
      toast('Failed to update status.', 'error')
    }
  }

  useEffect(() => {
    if (openMenuId && buttonRefs.current[openMenuId]) {
      const rect = buttonRefs.current[openMenuId].getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.right - 160 + window.scrollX })
    } else {
      setDropdownPos(null)
    }
  }, [openMenuId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!Object.values(buttonRefs.current).some(btn => btn.contains(target)) &&
          !document.getElementById('order-dropdown')?.contains(target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="p-6 md:p-8">

      <div className="mb-8">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
          Operations
        </p>
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>
            Orders
          </h1>
          <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
            {sortedOrders.length} result{sortedOrders.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
          Manage and track all customer orders in real time.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search by customer, city, postal code..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#111827' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#4F46E5')}
            onBlur={e => (e.currentTarget.style.borderColor = '#E8EAED')}
          />
        </div>

        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#374151' }}
        >
          <option value="all">All years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#374151' }}
        >
          <option value="all">All months</option>
          {monthNames.map((name, i) => <option key={name} value={i+1}>{name}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#374151' }}
        >
          <option value="all">All statuses</option>
          {Object.keys(statusLabels).map(s => (
            <option key={s} value={s}>
              {statusLabels[s as OrderStatus]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={exportOrdersCsv}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
          style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#374151' }}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {sortedOrders.length === 0 ? (
        <EmptyState title="No orders found" description="You don't have any orders yet." />
      ) : (
       <>
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr style={{ borderBottom: '1px solid #F0F2F5' }}>
          <th className="text-left py-3 px-4 w-8"></th>
          <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>ID</th>
          <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Customer</th>
          <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Date</th>
          <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Address</th>
          <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Status</th>
          <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Amount</th>
          <th className="py-3 px-4 w-10"></th>
        </tr>
      </thead>

      <tbody>
        {sortedOrders.map(order => (
          <Fragment key={order.id}>
            <tr
              onClick={() =>
                setExpandedId(expandedId === order.id ? null : order.id)
              }
              className="cursor-pointer transition-colors hover:bg-[#F9FAFB]"
              style={{ borderBottom: '1px solid #F0F2F5' }}
            >
              <td className="py-4 px-4">
                {expandedId === order.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </td>

              <td className="py-4 px-4">
                <span className="font-mono text-xs text-slate-600">{order.id.slice(-8)}</span>
              </td>

              <td className="py-4 px-4">
                <div className="flex flex-col">
                  <span className="font-semibold" style={{ color: '#4F46E5' }}>
                    {order.userName || 'Guest'}
                  </span>
                  {order.email && (
                    <span className="text-xs text-slate-500 mt-0.5">
                      {order.email}
                    </span>
                  )}
                </div>
              </td>

              <td className="py-4 px-4 text-slate-600">
                {new Date(order.created).toLocaleDateString('en-US')}
              </td>

              <td className="py-4 px-4">
                <div className="flex flex-col text-slate-600 text-sm">
                  <span>{order.address || '-'}</span>
                  <span className="text-slate-500 text-xs mt-0.5">
                    {order.city || '-'} {order.postalCode || '-'}
                  </span>
                </div>
              </td>

              <td className="py-4 px-4">
  <span
    onClick={e => e.stopPropagation()}
    className={`inline-flex items-center justify-center gap-1 w-36 py-1 rounded-md text-sm font-medium ${statusBadgeClass(
      order.status as OrderStatus
    )}`}
  >
    {statusLabels[order.status as OrderStatus]}
    {statusIcon(order.status as OrderStatus)}
  </span>
</td>

              <td className="py-4 px-4 text-slate-800 font-medium">
                ${order.total.toFixed(2)}
              </td>

              <td className="py-4 px-4">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setOpenMenuId(
                      openMenuId === order.id ? null : order.id
                    )
                  }}
                  ref={el => {
                    if (el) buttonRefs.current[order.id] = el
                  }}
                  className="text-slate-400 hover:text-slate-600 px-2 text-lg"
                >
                  ...
                </button>
              </td>
            </tr>

            {expandedId === order.id && (
              <tr style={{ borderBottom: '1px solid #F0F2F5' }}>
                <td colSpan={8} className="px-6 py-6" style={{ background: '#FAFBFF' }}>
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8EAED', background: '#FFFFFF', boxShadow: '0 2px 12px rgba(79,70,229,0.06)' }}>

                    {/* Top band: customer + meta */}
                    <div className="flex flex-wrap items-start gap-6 px-6 py-5" style={{ borderBottom: '1px solid #F0F2F5' }}>
                      {/* Avatar + name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center rounded-full text-sm font-bold shrink-0"
                          style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)', color: '#4F46E5' }}>
                          {(order.userName || 'G').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm" style={{ color: '#111827' }}>
                            {order.userName || 'Guest'}
                            {verifiedIcon(order.user?.verif)}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{order.email || '—'}</div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="hidden md:block self-stretch" style={{ width: 1, background: '#F0F2F5' }} />

                      {/* Meta chips */}
                      <div className="flex flex-wrap gap-16 text-xs">
                        <div className="flex flex-col gap-1">
                          <span style={{ color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>Date</span>
                          <span style={{ color: '#374151', fontWeight: 500 }}>{new Date(order.created).toLocaleString('en-US')}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span style={{ color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>Account type</span>
                          <span style={{ color: '#374151', fontWeight: 500 }}>{order.user ? 'Registered' : 'Guest'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span style={{ color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>Payment</span>
                          <span style={{ color: '#374151', fontWeight: 500, textTransform: 'uppercase' }}>{order.paymentMode || '—'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span style={{ color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>Address</span>
                          <span style={{ color: '#374151', fontWeight: 500 }}>
                            {[order.address, order.city, order.postalCode, order.state, order.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                        {order.phone && (
                          <div className="flex flex-col gap-1">
                            <span style={{ color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>Phone</span>
                            <span style={{ color: '#374151', fontWeight: 500 }}>{order.phone}</span>
                          </div>
                        )}
                        {order.notes && (
                          <div className="flex flex-col gap-1">
                            <span style={{ color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>Note</span>
                            <span style={{ color: '#374151', fontWeight: 500 }}>{order.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items list */}
                    <div className="px-6 py-4">
                      <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9CA3AF' }}>Items</div>
                      <div className="space-y-2">
                        {order.items?.map((item, i) => {
                          const parsed = extractCountAndFlavor(item.name, item.sku)
                          const countFlavor =
                            formatCountFlavor(item.count, item.flavor) ||
                            formatCountFlavor(parsed.count, parsed.flavor)
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-4"
                              style={{
                                background: '#F9FAFB',
                                border: '1px solid #F0F2F5',
                                borderRadius: 12,
                                padding: '10px 14px',
                              }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="shrink-0 rounded-lg overflow-hidden" style={{ width: 44, height: 44, border: '1px solid #E8EAED' }}>
                                  <img
                                    src={item.imageUrl || '/placeholder-square.webp'}
                                    alt={item.name || 'Product'}
                                    className="w-full h-full object-cover"
                                    onError={e => { e.currentTarget.src = '/placeholder-square.webp' }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate" style={{ color: '#111827' }}>
                                    <span style={{ color: '#6B7280', marginRight: 6 }}>{item.quantity ?? 1}×</span>
                                    {item.name}
                                  </div>
                                  {(countFlavor || item.sku) && (
                                    <div className="text-xs truncate mt-0.5" style={{ color: '#9CA3AF' }}>
                                      {countFlavor || item.sku}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm font-semibold shrink-0" style={{ color: '#111827' }}>
                                ${(Number(item.unitPrice ?? 0) * (item.quantity ?? 1)).toFixed(2)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Totals footer */}
                    {(() => {
                      const subtotal = order.items?.reduce((sum, item) => sum + (Number(item.unitPrice ?? 0) * (item.quantity ?? 1)), 0) ?? 0
                      const shipping = order.total - subtotal
                      return (
                        <div className="px-6 py-4 flex flex-col items-end gap-1.5" style={{ borderTop: '1px solid #F0F2F5' }}>
                          {shipping > 0 && (
                            <div className="flex items-center gap-8 text-sm" style={{ color: '#6B7280' }}>
                              <span>Shipping</span>
                              <span className="font-medium">${shipping.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-8">
                            <span className="text-sm font-semibold" style={{ color: '#111827' }}>Total</span>
                            <span className="text-lg font-bold" style={{ color: '#4F46E5' }}>${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    })()}

                  </div>
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  </div>
</>
        )}

      {ToastContainer}

      {openMenuId && dropdownPos && createPortal(
        <div id="order-dropdown" className="absolute w-44 rounded-xl z-50 overflow-hidden" style={{ top: dropdownPos.top + 4, left: dropdownPos.left, background: '#FFFFFF', border: '1px solid #E8EAED', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {['paid', 'delivering', 'delivered', 'refunded', 'on hold'].map(s => (
            <button
              key={s}
              onClick={() => updateStatus(openMenuId, s as OrderStatus)}
              className="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#F4F6FB]"
              style={{
                color: orders.find(o => o.id === openMenuId)?.status === s ? '#4F46E5' : '#374151',
                fontWeight: orders.find(o => o.id === openMenuId)?.status === s ? 600 : 400,
              }}
            >
              {statusLabels[s as OrderStatus]}
            </button>
          ))}
          <button
            onClick={() => deleteOrder(openMenuId)}
            className="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#FEF2F2]"
            style={{ color: '#EF4444', borderTop: '1px solid #F0F2F5' }}
          >
            Delete
          </button>
        </div>, document.body
      )}
    </div>
  )
}


