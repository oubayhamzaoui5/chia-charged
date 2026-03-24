'use server'

import { revalidatePath } from 'next/cache'

import { getAdminPbForAction } from '@/lib/admin/actions'
import { assertPocketBaseId } from '@/lib/admin/validation'

function sanitizeStock(raw: number) {
  if (!Number.isFinite(raw)) return 0
  return Math.max(0, Math.floor(raw))
}

export async function updateProductStockAction(productId: string, nextStock: number) {
  assertPocketBaseId(productId, 'product id')

  const stock = sanitizeStock(nextStock)
  const { pb } = await getAdminPbForAction()
  await pb.collection('products').update(productId, { stock })
  revalidatePath('/admin/inventory')
  return { ok: true, stock }
}
