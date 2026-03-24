'use server'

import { revalidatePath } from 'next/cache'

import { getAdminPbForAction } from '@/lib/admin/actions'
import { assertPocketBaseId } from '@/lib/admin/validation'

const MAX_VEDETTES = 6

export async function addVedetteProductAction(productId: string) {
  assertPocketBaseId(productId, 'product id')
  const { pb } = await getAdminPbForAction()

  await pb.collection('products').getOne(productId, {
    fields: 'id',
    requestKey: null,
  })

  const existing = await pb
    .collection('vedettes')
    .getFirstListItem(`product="${productId}"`, {
      fields: 'id,product',
      requestKey: null,
    })
    .catch(() => null)

  if (existing) {
    return {
      status: 'exists' as const,
      vedetteId: String(existing.id),
    }
  }

  const countRes = await pb.collection('vedettes').getList(1, 1, {
    fields: 'id',
    requestKey: null,
  })

  if (countRes.totalItems >= MAX_VEDETTES) {
    throw new Error(`Vous pouvez selectionner ${MAX_VEDETTES} produits maximum.`)
  }

  const created = await pb.collection('vedettes').create({ product: productId })

  revalidatePath('/admin/vedettes')
  revalidatePath('/')

  return {
    status: 'created' as const,
    vedetteId: String(created.id),
  }
}

export async function removeVedetteAction(vedetteId: string) {
  assertPocketBaseId(vedetteId, 'vedette id')
  const { pb } = await getAdminPbForAction()
  await pb.collection('vedettes').delete(vedetteId)

  revalidatePath('/admin/vedettes')
  revalidatePath('/')

  return { ok: true }
}
