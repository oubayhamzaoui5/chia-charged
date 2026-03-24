'use server'

import { revalidatePath } from 'next/cache'

import { getAdminPbForAction } from '@/lib/admin/actions'
import { assertPocketBaseId } from '@/lib/admin/validation'
import type { OrderStatus } from '@/types/order.types'

const allowedStatuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'delevering',
  'delivered',
  'cancelled',
  'on hold',
  'returned',
]

function normalizeStatus(value: string): OrderStatus {
  if (allowedStatuses.includes(value as OrderStatus)) {
    return value as OrderStatus
  }
  throw new Error('Invalid order status')
}

export async function deleteOrderAction(orderId: string) {
  assertPocketBaseId(orderId, 'order id')

  const { pb } = await getAdminPbForAction()
  await pb.collection('orders').delete(orderId)
  revalidatePath('/admin/orders')
  return { ok: true }
}

export async function updateOrderStatusAction(orderId: string, nextStatus: string) {
  assertPocketBaseId(orderId, 'order id')

  const status = normalizeStatus(nextStatus)
  const { pb } = await getAdminPbForAction()

  const order = await pb.collection('orders').getOne(orderId)
  const updated = await pb.collection('orders').update(orderId, { status })

  if (status === 'delivered' && typeof order.user === 'string' && order.user.length > 0) {
    await pb.collection('users').update(order.user, { verif: true })
  }

  revalidatePath('/admin/orders')
  return { ok: true, status: normalizeStatus(String(updated.status ?? status)) }
}
