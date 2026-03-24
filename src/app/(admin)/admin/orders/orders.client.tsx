'use client'

import { useMemo, useState, useRef, useEffect, Fragment } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import EmptyState from '@/components/admin/empty-state'
import { Trash2, ChevronDown, ChevronUp, Pause, ShoppingCart, CheckCircle2, Clock, Truck, Search, ExternalLink } from 'lucide-react'
import type { OrderRecord, OrderStatus } from '@/types/order.types'
import { deleteOrderAction, updateOrderStatusAction } from './actions'

export default function OrdersClient({ initialOrders }: { initialOrders: OrderRecord[] }) {
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [yearFilter, setYearFilter] = useState<'all' | number>('all')
  const [monthFilter, setMonthFilter] = useState<'all' | number>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')

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
      case 'pending': return <Clock className="w-3 h-3" />
      case 'confirmed': return <CheckCircle2 className="w-3 h-3" />
      case 'delevering': return <Truck className="w-3 h-3" />
      case 'delivered': return <ShoppingCart className="w-3 h-3" />
      case 'cancelled': return <Trash2 className="w-3 h-3" />
      case 'on hold': return <Pause className="w-3 h-3" />
      case 'returned': return <Truck className="w-3 h-3" />
    }
  }

  const statusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-orange-50 text-orange-700'
      case 'confirmed': return 'bg-blue-50 text-blue-700'
      case 'delevering': return 'bg-purple-50 text-purple-700'
      case 'delivered': return 'bg-emerald-50 text-emerald-700'
      case 'cancelled': return 'bg-red-50 text-red-700'
      case 'on hold': return 'bg-slate-100 text-slate-600'
      case 'returned': return 'bg-red-50 text-red-700'
    }
  }

  const statusLabels: Record<OrderStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    delevering: 'Out for delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    'on hold': 'On hold',
    returned: 'Returned',
  }

  async function deleteOrder(id: string) {
    if (!confirm('Delete this order?')) return

    const prev = orders
    setOrders((current) => current.filter((o) => o.id !== id))

    try {
      await deleteOrderAction(id)
      setNotice('Order deleted.')
      window.dispatchEvent(new Event('admin:orders-changed'))
    } catch {
      setOrders(prev)
      setNotice('Delete failed.')
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
      setNotice('Status updated.')
      window.dispatchEvent(new Event('admin:orders-changed'))
    } catch {
      setOrders(prev)
      setNotice('Failed to update status.')
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
        <h1 className="text-4xl font-bold text-blue-600 mb-2">
          Orders
        </h1>
        <p className="text-slate-600 text-lg">
          Manage and track all customer orders in real time.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
        
       <div className="relative flex-1 w-full">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    <input
      type="text"
      placeholder="Search by customer, city, postal code..."
      value={query}
      onChange={e => setQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 transition-all"
    />
  </div>

        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All months</option>
          {monthNames.map((name, i) => <option key={name} value={i+1}>{name}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All statuses</option>
          {Object.keys(statusLabels).map(s => (
            <option key={s} value={s}>
              {statusLabels[s as OrderStatus]}
            </option>
          ))}
        </select>
      </div>

      {notice && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-slate-700">
          {notice}
        </div>
      )}

      {sortedOrders.length === 0 ? (
        <EmptyState title="No orders found" description="You don't have any orders yet." />
      ) : (
       <>
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="text-left py-3 px-4"></th>
          <th className="py-3 ox-4 text-left text-slate-700 font-semibold text-base">Customer</th>
          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date</th>
          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Address</th>
          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Amount</th>
          <th className="py-3 px-4"></th>
        </tr>
      </thead>

      <tbody>
        {sortedOrders.map(order => (
          <Fragment key={order.id}>
            <tr
              onClick={() =>
                setExpandedId(expandedId === order.id ? null : order.id)
              }
              className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
            >
              <td className="py-4 px-4">
                {expandedId === order.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </td>

              <td className="py-4 px-4">
                <div className="flex flex-col">
                  <span className="text-blue-600 font-medium">
                    {order.userName || 'Guest'}
                  </span>
                  {order.phone && (
                    <span className="text-xs text-slate-500 mt-0.5">
                      {order.phone}
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
                {order.total.toFixed(2)} {order.currency || '$'}
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
              <tr className="bg-slate-50 border-b border-slate-100">
                <td colSpan={7} className="px-6 py-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

                    <div>
                      <span className="text-slate-500 block mb-1 text-xs font-medium">
                        Customer
                      </span>
                      <span className="text-slate-800">
                        {order.userName || 'Guest'}
                        <span className="ml-1 text-slate-600">
                          ({order.user ? 'Account' : 'Guest'}
                          {verifiedIcon(order.user?.verif)})
                        </span>
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-slate-500 block mb-1 text-xs font-medium">
                        Phone
                      </span>
                      <span className="text-slate-800">
                        {order.phone || '-'}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-slate-500 block mb-1 text-xs font-medium">
                        Date
                      </span>
                      <span className="text-slate-800">
                        {new Date(order.created).toLocaleString('en-US')}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-slate-500 block mb-1 text-xs font-medium">
                        Address
                      </span>
                      <span className="text-slate-800">
                        {order.address}, {order.city} {order.postalCode}
                      </span>
                    </div>

                    {order.notes && (
                      <div className="md:col-span-2">
                        <span className="text-slate-500 block mb-1 text-xs font-medium">
                          Note
                        </span>
                        <span className="text-slate-800">
                          {order.notes}
                        </span>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <span className="text-slate-500 block mb-1 text-xs font-medium">
                        Payment
                      </span>
                      <span className="text-slate-800 uppercase">
                        {order.paymentMode || '-'}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-slate-500 block mb-2 text-xs font-medium">
                        Items
                      </span>
                      <div className="space-y-2">
                        {order.items?.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between text-slate-700 bg-white px-3 py-2 rounded-lg"
                          >
                            <span>
                              {item.quantity ?? 1} x {item.name}{' '}
                              <span className="text-slate-500">
                                ({item.sku})
                              </span>
                            </span>
                            <span className="font-medium">
                              {(Number(item.unitPrice ?? 0) *
                                (item.quantity ?? 1)
                              ).toFixed(2)}{' '}
                              {order.currency || '$'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-3 border-t border-slate-200">
                      <div className="flex justify-between text-slate-700 mb-2">
                        <span>Shipping</span>
                        <span className="font-medium">
                          8 {order.currency || '$'}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-800 font-semibold text-base">
                        <span>Total</span>
                        <span>
                          {order.total.toFixed(2)}{' '}
                          {order.currency || '$'}
                        </span>
                      </div>

                      <div className="mt-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink size={13} />
                          View order details
                        </Link>
                      </div>
                    </div>

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

      {openMenuId && dropdownPos && createPortal(
        <div id="order-dropdown" className="absolute w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-50" style={{ top: dropdownPos.top + 2, left: dropdownPos.left }}>
          {['pending', 'confirmed', 'delevering', 'delivered', 'cancelled', 'on hold' , "returned"].map(s => (
  <button
    key={s}
    onClick={() => updateStatus(openMenuId, s as OrderStatus)}
    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-slate-700 first:rounded-t-lg ${
      orders.find(o => o.id === openMenuId)?.status === s
        ? 'font-semibold bg-slate-50'
        : ''
    }`}
  >
    {statusLabels[s as OrderStatus]}
  </button>
))}

<button
  onClick={() => deleteOrder(openMenuId)}
  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 border-t border-slate-200 rounded-b-lg"
>
  Delete
</button>
        </div>, document.body
      )}
    </div>
  )
}


