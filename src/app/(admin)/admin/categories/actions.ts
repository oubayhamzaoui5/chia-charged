'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import DOMPurify from 'isomorphic-dompurify'
import { slugify } from '@/utils/slug'

import { getAdminPbForAction } from '@/lib/admin/actions'
import { assertPocketBaseId } from '@/lib/admin/validation'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

type UpsertCategoryInput = {
  name: string
  slug: string
  parentIds: string[]
  desc?: string
  promo?: number
  activeAll?: boolean
  order?: number
  features?: string[]
  coverImage?: File | null
}

function sanitizeCategoryDescription(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['h1', 'h2', 'p', 'strong', 'b', 'ul', 'li', 'br'],
    ALLOWED_ATTR: [],
  })
}

function normalizePayload(input: UpsertCategoryInput) {
  const name = input.name.trim()
  if (!name) throw new Error('Category name is required')

  const slug = slugify(input.slug.trim() || name)
  if (!slug) throw new Error('Category slug is required')

  const promo =
    typeof input.promo === 'number' && Number.isFinite(input.promo)
      ? Math.max(0, input.promo)
      : 0
  const order =
    typeof input.order === 'number' && Number.isFinite(input.order)
      ? Math.max(0, input.order)
      : 0
  const features = Array.isArray(input.features)
    ? input.features.map((value) => String(value).trim()).filter(Boolean)
    : []

  const validatedParentIds = input.parentIds.map((id) => {
    assertPocketBaseId(id, 'parent category id')
    return id
  })

  let coverImagePayload = {}
  if (input.coverImage instanceof File && input.coverImage.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(input.coverImage.type)) {
      throw new Error('File type not allowed. Use JPEG, PNG, WEBP, or GIF.')
    }
    if (input.coverImage.size > MAX_IMAGE_BYTES) {
      throw new Error('File is too large. Maximum size: 5 MB.')
    }
    coverImagePayload = { coverImage: input.coverImage }
  }

  return {
    name,
    slug,
    parent: validatedParentIds.length ? validatedParentIds : null,
    desc: sanitizeCategoryDescription(input.desc),
    promo,
    activeAll: Boolean(input.activeAll),
    order,
    features,
    ...coverImagePayload,
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
