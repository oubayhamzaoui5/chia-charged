'use client'

import { useMemo, useState } from 'react'
import { getPb } from '@/lib/pb'
import type { OrderRecord } from '@/types/order.types'

export type OrderPayload = {
  items: any[]
  amount: number
  currency: string
  status: string
  location: string
  user?: string
}

// Hard-coded guest user
const GUEST_USER_ID = 'f3pfpd03b04sypz'

export function useOrders(initialOrders: OrderRecord[]) {
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orders

    return orders.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.userName.toLowerCase().includes(q) ||
      (o.location ?? '').toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q) ||
      String(o.total).includes(q)
    )
  }, [orders, query])

  const sortedOrders = useMemo(() => {
    return filtered.slice().sort((a, b) =>
      a.created < b.created ? 1 : -1
    )
  }, [filtered])

  async function remove(id: string) {
    if (!confirm('Delete this order?')) return

    try {
      const pb = getPb()
      await pb.collection('orders').delete(id)
      setOrders(prev => prev.filter(o => o.id !== id))
      setNotice('✅ Order deleted.')
    } catch (e) {
      console.error(e)
      setNotice('❌ Failed to delete order.')
    }
  }

  async function create(payload: OrderPayload) {
    try {
      const pb = getPb()

      // If no user, assume guest
      if (!payload.user) payload.user = GUEST_USER_ID

      const created = await pb
        .collection('orders')
        .create<OrderRecord>(payload)

      const newOrder: OrderRecord = {
        ...created,
        userName: payload.user === GUEST_USER_ID ? 'Guest' : created.userName,
        isGuest: payload.user === GUEST_USER_ID,
      }

      setOrders(prev => [...prev, newOrder].sort((a, b) =>
        a.created < b.created ? 1 : -1
      ))

      setNotice('✅ Order created successfully.')
    } catch (e) {
      console.error(e)
      setNotice('❌ Failed to create order.')
    }
  }

  async function update(id: string, payload: OrderPayload) {
    try {
      const pb = getPb()
      const updated = await pb
        .collection('orders')
        .update<OrderRecord>(id, payload)

      setOrders(prev =>
        prev.map(o => (o.id === id ? updated : o))
      )

      setNotice('✅ Order updated successfully.')
    } catch (e) {
      console.error(e)
      setNotice('❌ Failed to update order.')
    }
  }

  return {
    orders: sortedOrders,
    query,
    setQuery,
    notice,
    setNotice,
    create,
    update,
    remove,
  }
}
