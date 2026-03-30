import 'server-only'

import { z } from 'zod'

import { createServerPb } from '@/lib/pb'

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
  const filter = `user="${escapePbString(auth.userId)}" && product="${escapePbString(safeProductId)}"`

  const existing = await pb
    .collection('cart_items')
    .getFirstListItem(filter, { fields: 'id,quantity', requestKey: null })
    .catch((e: unknown) => {
      const error = e as { status?: number }
      if (error?.status === 404) return null
      throw e
    })

  if (!existing) {
    await pb.collection('cart_items').create(
      {
        user: auth.userId,
        product: safeProductId,
        quantity: safeQty,
      },
      { requestKey: null }
    )
    return
  }

  const currentQty = Number(existing.quantity ?? 1)
  await pb.collection('cart_items').update(
    existing.id,
    {
      quantity: Math.max(1, Math.min(99, currentQty + safeQty)),
    },
    { requestKey: null }
  )
}

export async function getCartItems(auth: AuthContext): Promise<CartEntry[]> {
  const pb = getAuthedPb(auth)
  const pbBaseUrl = getPbBaseUrl()
  const items = await pb.collection('cart_items').getFullList(200, {
    filter: `user="${escapePbString(auth.userId)}"`,
    expand: 'product',
    requestKey: null,
  })

  return items.map((it: Record<string, unknown>) => {
    const prod = (it as any).expand?.product as Record<string, unknown> | undefined
    const imageFiles = normalizeImageFilenames(prod?.images)
    const productId = String(prod?.id ?? '')
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
          promoPrice:
            prod.promoPrice == null || !Number.isFinite(Number(prod.promoPrice))
              ? null
              : Number(prod.promoPrice),
          currency: String(prod.currency ?? 'DT'),
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
