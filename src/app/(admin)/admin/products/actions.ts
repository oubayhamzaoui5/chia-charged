'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getAdminPbForAction } from '@/lib/admin/actions'
import { assertPocketBaseId } from '@/lib/admin/validation'
import type { Product } from '@/types/product.types'
import { slugify } from '@/utils/slug'
import { normalizeRelationIds } from '@/utils/product.utils'

type VariantAttributeRow = {
  key: string
  value: string
}

function resolvePromoPrice(
  price: number,
  productPromo: number | null,
  categoriesExpanded: unknown
): number | null {
  const directPromo = productPromo != null && productPromo > 0 && productPromo < price ? productPromo : null
  const categories = Array.isArray(categoriesExpanded) ? categoriesExpanded : []

  const overriding = categories.filter((c) => {
    if (!c || typeof c !== 'object') return false
    return Boolean((c as { activeAll?: unknown }).activeAll)
  })

  if (overriding.length === 0) return directPromo

  let best: number | null = null
  for (const raw of overriding) {
    const promo = Number((raw as { promo?: unknown }).promo ?? 0)
    if (!Number.isFinite(promo) || promo <= 0) continue
    const safePct = Math.min(100, Math.max(0, promo))
    const candidate = Number((price * (1 - safePct / 100)).toFixed(2))
    if (candidate <= 0 || candidate >= price) continue
    if (best == null || candidate < best) best = candidate
  }

  return best
}

type ProductRecordLike = {
  id?: string
  sku?: string
  name?: string
  price?: number | string | null
  promoPrice?: number | string | null
  isActive?: boolean
  description?: string
  images?: unknown
  currency?: string
  category?: unknown
  inView?: boolean
  isVariant?: boolean
  isParent?: boolean
  parent?: string | null
  variantKey?: unknown
  details?: unknown
  related_products?: unknown
  expand?: { category?: unknown; related_products?: unknown } | null
}

function toProduct(record: ProductRecordLike): Product {
  const detailsRaw = record.details
  const details = Array.isArray(detailsRaw)
    ? detailsRaw
        .map((item) => ({
          label:
            item && typeof item === 'object' && 'label' in item
              ? String((item as { label?: unknown }).label ?? '').trim()
              : '',
          value:
            item && typeof item === 'object' && 'value' in item
              ? String((item as { value?: unknown }).value ?? '').trim()
              : '',
        }))
        .filter((item: { label: string; value: string }) => item.label || item.value)
    : []

  const price = Number(record.price ?? 0)
  const directPromo = record.promoPrice == null ? null : Number(record.promoPrice)
  const promoPrice = resolvePromoPrice(price, directPromo, record.expand?.category)

  return {
    id: record.id ?? '',
    sku: record.sku ?? '',
    name: record.name ?? '',
    price,
    promoPrice,
    isActive: Boolean(record.isActive),
    description: record.description ?? '',
    images: Array.isArray(record.images) ? record.images : [],
    currency: record.currency ?? '$',
    categories: normalizeRelationIds(record.expand?.category ?? record.category),
    inView: record.inView !== false,
    isVariant: Boolean(record.isVariant),
    isParent: Boolean(record.isParent),
    parent: record.parent ?? null,
    variantKey:
      record.variantKey && typeof record.variantKey === 'object' && !Array.isArray(record.variantKey)
        ? record.variantKey
        : null,
    details,
    relatedProducts: normalizeRelationIds(record.related_products ?? record.expand?.related_products),
  }
}

/**
 * Verify user is authenticated and has admin role
 */
async function verifyAdmin() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login')
  }
  
  return session
}

function toVariantMap(rows: VariantAttributeRow[]) {
  const out: Record<string, string> = {}

  for (const row of rows) {
    const key = row.key?.trim()
    const value = row.value?.trim()
    if (!key || !value) continue
    out[key] = value
  }

  return out
}

/**
 * Revalidate products list
 */
export async function revalidateProducts() {
  await verifyAdmin()
  revalidatePath('/admin/products')
  revalidateTag('products', 'max')
}

/**
 * Revalidate categories
 */
export async function revalidateCategories() {
  await verifyAdmin()
  revalidateTag('categories', 'max')
}

/**
 * Revalidate specific product variants page
 */
export async function revalidateProductVariants(parentId: string) {
  await verifyAdmin()
  revalidatePath(`/admin/products/${parentId}/variants`)
}

/**
 * Revalidate all product-related data
 */
export async function revalidateAllProducts() {
  await verifyAdmin()
  revalidatePath('/admin/products', 'layout')
  revalidateTag('products', 'max')
  revalidateTag('categories', 'max')
}

function revalidateProductPages(slug: string) {
  if (!slug) return
  revalidatePath(`/product/${slug}`)
  revalidatePath(`/shop/${slug}`)
}

export async function createProductAction(fd: FormData) {
  const payload = new FormData()
  fd.forEach((value, key) => payload.append(key, value))
  const rawName = String(payload.get('name') ?? '')
  const rawSlug = String(payload.get('slug') ?? '')
  const normalizedSlug = slugify(rawSlug || rawName)
  if (normalizedSlug) payload.set('slug', normalizedSlug)

  const { pb } = await getAdminPbForAction()
  const created = await pb.collection('products').create(payload)
  const full = await pb.collection('products').getOne(created.id, {
    expand: 'parent,category',
  })
  revalidatePath('/admin/products')
  revalidateProductPages(String(full.slug ?? ''))
  return toProduct(full)
}

export async function updateProductAction(id: string, fd: FormData) {
  assertPocketBaseId(id, 'product id')
  const payload = new FormData()
  fd.forEach((value, key) => payload.append(key, value))
  const rawName = String(payload.get('name') ?? '')
  const rawSlug = String(payload.get('slug') ?? '')
  const normalizedSlug = slugify(rawSlug || rawName)
  if (normalizedSlug) payload.set('slug', normalizedSlug)

  const { pb } = await getAdminPbForAction()
  await pb.collection('products').update(id, payload)
  const full = await pb.collection('products').getOne(id, {
    expand: 'parent,category',
  })
  revalidatePath('/admin/products')
  revalidateProductPages(String(full.slug ?? ''))
  return toProduct(full)
}

export async function deleteProductAction(id: string) {
  assertPocketBaseId(id, 'product id')
  const { pb } = await getAdminPbForAction()
  await pb.collection('products').delete(id)
  revalidatePath('/admin/products')
  return { ok: true }
}

export async function updateVariantKeyAction(
  id: string,
  variantKey: Record<string, string | null>
) {
  assertPocketBaseId(id, 'product id')
  const { pb } = await getAdminPbForAction()
  await pb.collection('products').update(id, { variantKey })
  const full = await pb.collection('products').getOne(id, {
    expand: 'parent,category',
  })
  revalidatePath('/admin/products')
  return toProduct(full)
}

/**
 * Save parent variant attributes and cascade removed keys to children.
 */
export async function saveParentVariantAttributes(
  parentId: string,
  rows: VariantAttributeRow[]
) {
  assertPocketBaseId(parentId, 'parent product id')
  const { pb } = await getAdminPbForAction()

  const cleaned = toVariantMap(rows)

  const parent = await pb.collection('products').getOne(parentId)
  const oldVariantKey =
    parent.variantKey && typeof parent.variantKey === 'object' && !Array.isArray(parent.variantKey)
      ? (parent.variantKey as Record<string, unknown>)
      : {}

  const oldKeys = Object.keys(oldVariantKey)
  const newKeys = Object.keys(cleaned)
  const removedKeys = oldKeys.filter((k) => !newKeys.includes(k))

  await pb.collection('products').update(parentId, { variantKey: cleaned })

  if (removedKeys.length > 0) {
    const children = await pb.collection('products').getFullList(200, {
      filter: `parent = "${parentId}"`,
    })

    await Promise.all(
      children.map(async (child) => {
        const rawVariantKey =
          child.variantKey && typeof child.variantKey === 'object' && !Array.isArray(child.variantKey)
            ? ({ ...(child.variantKey as Record<string, unknown>) } as Record<string, unknown>)
            : {}

        let changed = false
        for (const removedKey of removedKeys) {
          if (removedKey in rawVariantKey) {
            delete rawVariantKey[removedKey]
            changed = true
          }
        }

        if (changed) {
          await pb.collection('products').update(child.id, {
            variantKey: rawVariantKey,
          })
        }
      })
    )
  }

  revalidatePath(`/admin/products/${parentId}/variants`)
  revalidatePath('/admin/products')

  return { ok: true }
}
