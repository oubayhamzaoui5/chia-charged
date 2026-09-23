import 'server-only'

import { z } from 'zod'

import { createServerPb } from '@/lib/pb'
import { catalogCategoryIds, resolveCatalogPrice } from '@/lib/catalog-pricing'

const pocketBaseIdSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9]{15}$/)

export type AuthContext = {
  userId: string
  token: string
}

export type CartProductSummary = {
  id: string
  slug: string
  name: string
  sku: string
  images: string[]
  imageUrls: string[]
  price: number
  promoPrice: number | null
  currency: string
  stock: number
}

export type CartEntry = {
  id: string
  quantity: number
  product: CartProductSummary | null
}

function escapePbString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function expandedProduct(item: Record<string, unknown>) {
  if (!item.expand || typeof item.expand !== 'object') return undefined
  const product = (item.expand as Record<string, unknown>).product
  return product && typeof product === 'object' ? product as Record<string, unknown> : undefined
}

function getAuthedPb(auth: AuthContext) {
  const pb = createServerPb()
  pb.authStore.save(auth.token, null)
  return pb
}

function getPbBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PB_URL ??
    process.env.POCKETBASE_URL ??
    'http://127.0.0.1:8090'
  )
}

function normalizeImageFilenames(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean)
      }
    } catch {
      // keep as plain filename
    }

    return [trimmed]
  }

  return []
}

export function parsePocketBaseId(raw: unknown): string {
  return pocketBaseIdSchema.parse(raw)
}

export function parseQuantity(raw: unknown): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return 1
  return Math.max(1, Math.min(99, Math.floor(parsed)))
}

export async function getWishlistProductIds(auth: AuthContext): Promise<string[]> {
  const pb = getAuthedPb(auth)
  const items = await pb.collection('wishlists').getFullList(500, {
    filter: `user="${escapePbString(auth.userId)}"`,
    sort: '-created',
    fields: 'product',
    requestKey: null,
  })
  return items
    .map((item: Record<string, unknown>) => String(item.product ?? ''))
    .filter((id) => pocketBaseIdSchema.safeParse(id).success)
}

export async function isInWishlist(auth: AuthContext, productId: string): Promise<boolean> {
  const pb = getAuthedPb(auth)
  const safeProductId = parsePocketBaseId(productId)
  const filter = `user="${escapePbString(auth.userId)}" && product="${escapePbString(safeProductId)}"`
  const existing = await pb
    .collection('wishlists')
    .getFirstListItem(filter, { fields: 'id', requestKey: null })
    .catch((e: unknown) => {
      const error = e as { status?: number }
      if (error?.status === 404) return null
      throw e
    })
  return Boolean(existing)
}

export async function toggleWishlist(auth: AuthContext, productId: string): Promise<{ inWishlist: boolean }> {
  const pb = getAuthedPb(auth)
  const safeProductId = parsePocketBaseId(productId)
  const filter = `user="${escapePbString(auth.userId)}" && product="${escapePbString(safeProductId)}"`

  const existing = await pb
    .collection('wishlists')
    .getFirstListItem(filter, { fields: 'id', requestKey: null })
    .catch((e: unknown) => {
      const error = e as { status?: number }
      if (error?.status === 404) return null
      throw e
    })

  if (existing) {
    await pb.collection('wishlists').delete(existing.id, { requestKey: null })
    return { inWishlist: false }
  }

  await pb.collection('wishlists').create(
    {
      user: auth.userId,
      product: safeProductId,
    },
    { requestKey: null }
  )

  return { inWishlist: true }
}

export async function isInCart(auth: AuthContext, productId: string): Promise<boolean> {
  const pb = getAuthedPb(auth)
  const safeProductId = parsePocketBaseId(productId)
  const filter = `user="${escapePbString(auth.userId)}" && product="${escapePbString(safeProductId)}"`
  const existing = await pb
    .collection('cart_items')
    .getFirstListItem(filter, { fields: 'id', requestKey: null })
    .catch((e: unknown) => {
      const error = e as { status?: number }
      if (error?.status === 404) return null
      throw e
    })

  return Boolean(existing)
}

export async function addToCart(auth: AuthContext, productId: string, quantity: number): Promise<void> {
  const pb = getAuthedPb(auth)
  const safeProductId = parsePocketBaseId(productId)
  const safeQty = parseQuantity(quantity)
  await pb.send('/api/chia-cart/add', {
    method: 'POST',
    body: { productId: safeProductId, quantity: safeQty },
    requestKey: null,
  })
}

export async function mergeGuestCart(auth: AuthContext, rawItems: unknown): Promise<void> {
  if (!Array.isArray(rawItems) || rawItems.length > 50) throw new Error('Invalid guest cart')
  const items = rawItems.map((raw) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid guest cart item')
    const item = raw as Record<string, unknown>
    const quantity = Number(item.quantity)
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) throw new Error('Invalid guest cart item')
    return { productId: parsePocketBaseId(item.productId), quantity }
  })
  const pb = getAuthedPb(auth)
  await pb.send('/api/chia-cart/merge', { method: 'POST', body: { items }, requestKey: null })
}

export async function getCartItems(auth: AuthContext): Promise<CartEntry[]> {
  const pb = getAuthedPb(auth)
  const pbBaseUrl = getPbBaseUrl()
  const items = await pb.collection('cart_items').getFullList(200, {
    filter: `user="${escapePbString(auth.userId)}"`,
    expand: 'product',
    requestKey: null,
  })

  const productRecords = items.map((item: Record<string, unknown>) => expandedProduct(item)).filter((product): product is Record<string, unknown> => Boolean(product))
  const categoryIds = [...new Set(productRecords.flatMap(product => catalogCategoryIds(product?.category ?? product?.categories)))]
  const categories = categoryIds.length === 0 ? [] : await pb.collection('categories').getFullList({
    filter: categoryIds.map(id => `id = '${id}'`).join(' || '),
    fields: 'id,promo,activeAll',
    requestKey: null,
  })
  const categoryMap = new Map(categories.map(category => [category.id, category]))

  return items.map((it: Record<string, unknown>) => {
    const prod = expandedProduct(it)
    const imageFiles = normalizeImageFilenames(prod?.images)
    const productId = String(prod?.id ?? '')
    const productCategoryIds = catalogCategoryIds(prod?.category ?? prod?.categories)
    const resolvedPrice = prod ? resolveCatalogPrice(
      Number(prod.price),
      prod.promoPrice == null ? null : Number(prod.promoPrice),
      productCategoryIds.map(id => {
        const category = categoryMap.get(id)
        return { id, percent: Number(category?.promo ?? 0), active: category?.activeAll === true }
      }),
    ) : null
    const product: CartProductSummary | null = prod
      ? {
          id: productId,
          slug: String(prod.slug ?? ''),
          name: String(prod.name ?? ''),
          sku: String(prod.sku ?? ''),
          images: imageFiles,
          imageUrls: imageFiles.map(
            (file) => `${pbBaseUrl}/api/files/products/${productId}/${encodeURIComponent(file)}`
          ),
          price: Number(prod.price ?? 0),
          promoPrice: resolvedPrice && resolvedPrice.unitPriceCents < resolvedPrice.baseUnitPriceCents
            ? resolvedPrice.unitPriceCents / 100
            : null,
          currency: String(prod.currency ?? 'USD'),
          stock: Number(prod.stock ?? 0),
        }
      : null

    return {
      id: String(it.id ?? ''),
      quantity: parseQuantity(it.quantity),
      product,
    }
  })
}

export async function updateCartItem(auth: AuthContext, itemId: string, quantity: number): Promise<void> {
  const pb = getAuthedPb(auth)
  const safeItemId = parsePocketBaseId(itemId)
  const safeQty = parseQuantity(quantity)
  const existing = await pb.collection('cart_items').getOne(safeItemId, {
    fields: 'id,user',
    requestKey: null,
  })
  if (String((existing as any).user ?? '') !== auth.userId) {
    const err = new Error('Forbidden')
    ;(err as any).status = 403
    throw err
  }

  await pb.collection('cart_items').update(
    safeItemId,
    { quantity: safeQty },
    { requestKey: null }
  )
}

export async function removeCartItem(auth: AuthContext, itemId: string): Promise<void> {
  const pb = getAuthedPb(auth)
  const safeItemId = parsePocketBaseId(itemId)
  const existing = await pb.collection('cart_items').getOne(safeItemId, {
    fields: 'id,user',
    requestKey: null,
  })
  if (String((existing as any).user ?? '') !== auth.userId) {
    const err = new Error('Forbidden')
    ;(err as any).status = 403
    throw err
  }

  await pb.collection('cart_items').delete(safeItemId, { requestKey: null })
}
