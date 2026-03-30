'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { slugify } from '@/utils/slug'

import { getAdminPbForAction } from '@/lib/admin/actions'
import { assertPocketBaseId } from '@/lib/admin/validation'

type UpsertCategoryInput = {
  name: string
  slug: string
  order?: number
}

function normalizePayload(input: UpsertCategoryInput) {
  const name = input.name.trim()
  if (!name) throw new Error('Category name is required')

  const slug = slugify(input.slug.trim() || name)
  if (!slug) throw new Error('Category slug is required')

  const order =
    typeof input.order === 'number' && Number.isFinite(input.order)
      ? Math.max(0, input.order)
      : 0

  return {
    name,
    slug,
    order,
  }
}

export async function createCategoryAction(input: UpsertCategoryInput) {
  const { pb } = await getAdminPbForAction()
  const payload = normalizePayload(input)
  const created = await pb.collection('categories').create(payload)
  revalidatePath('/admin/categories')
  revalidatePath('/shop')
  revalidatePath('/shop')
  revalidateTag('shop-categories', 'max')
  return created
}

export async function updateCategoryAction(id: string, input: UpsertCategoryInput) {
  assertPocketBaseId(id, 'category id')
  const { pb } = await getAdminPbForAction()
  const payload = normalizePayload(input)
  const updated = await pb.collection('categories').update(id, payload)
  revalidatePath('/admin/categories')
  revalidatePath('/shop')
  revalidatePath('/shop')
  revalidateTag('shop-categories', 'max')
  return updated
}

export async function deleteCategoryAction(id: string) {
  assertPocketBaseId(id, 'category id')
  const { pb } = await getAdminPbForAction()
  await pb.collection('categories').delete(id)
  revalidatePath('/admin/categories')
  revalidatePath('/shop')
  revalidatePath('/shop')
  revalidateTag('shop-categories', 'max')
  return { ok: true }
}

export async function reorderCategoriesAction(
  updates: Array<{ id: string; order: number }>
) {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error('No category order updates provided')
  }

  const { pb } = await getAdminPbForAction()

  await Promise.all(
    updates.map(async (update) => {
      assertPocketBaseId(update.id, 'category id')
      const safeOrder = Number.isFinite(update.order) ? Math.max(0, update.order) : 0
      await pb.collection('categories').update(update.id, { order: safeOrder })
    })
  )

  revalidatePath('/admin/categories')
  revalidatePath('/shop')
  revalidatePath('/shop')
  revalidateTag('shop-categories', 'max')
  return { ok: true }
}
