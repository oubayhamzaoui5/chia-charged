import 'server-only'

import { getSession } from '@/lib/auth/server'
import { createServerPb } from '@/lib/pb'

export type CustomerOrderStatus =
  | 'paid'
  | 'delivering'
  | 'delivered'
  | 'refunded'
  | 'on hold'

export type CustomerOrder = {
  id: string
  createdAt: string
  updatedAt: string
  totalAmount: number
  currency: string
  status: CustomerOrderStatus
  itemsCount: number
  items: Array<{
    id?: string
    productId?: string
    name: string
    sku?: string
    unitPrice: number
    quantity: number
    imageUrl?: string
  }>
}

export class OrdersServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'UNAUTHENTICATED' | 'FETCH_FAILED'
  ) {
    super(message)
  }
}

const allowedStatuses: CustomerOrderStatus[] = [
  'paid',
  'delivering',
  'delivered',
  'refunded',
  'on hold',
]
const PB_ID_REGEX = /^[a-zA-Z0-9]{15}$/

function normalizeStatus(value: unknown): CustomerOrderStatus {
  if (typeof value !== 'string') return 'paid'
  return allowedStatuses.includes(value as CustomerOrderStatus)
    ? (value as CustomerOrderStatus)
    : 'paid'
}

function escapePbString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function isOwnedByUser(record: Record<string, unknown>, userId: string): boolean {
  const ownerByUser = typeof record.user === 'string' ? record.user : ''
  return ownerByUser === userId
}

function asOrderItems(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
}

function extractProductId(item: Record<string, unknown>): string | null {
  const candidates = [item.productId, item.product, item.product_id, item.id]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && /^[a-zA-Z0-9]{15}$/.test(candidate)) {
      return candidate
    }
  }
  return null
}

function extractSku(item: Record<string, unknown>): string | null {
  if (typeof item.sku === 'string' && item.sku.trim().length > 0) return item.sku.trim()
  return null
}

function productImageUrl(productId: string, filename: string): string {
  const base =
    process.env.NEXT_PUBLIC_PB_URL ??
    process.env.POCKETBASE_URL ??
    'http://127.0.0.1:8090'
  return `${base}/api/files/products/${productId}/${encodeURIComponent(filename)}`
}

async function resolvePreviewProduct(
  pb: ReturnType<typeof createServerPb>,
  item: Record<string, unknown>,
  byIdCache: Map<string, { name: string; sku?: string; imageUrl?: string }>,
  bySkuCache: Map<string, { name: string; sku?: string; imageUrl?: string }>
): Promise<{ name: string; sku?: string; imageUrl?: string }> {
  const itemName = typeof item.name === 'string' ? item.name : 'Produit'
  const itemSku = extractSku(item) ?? undefined
  const productId = extractProductId(item)

  if (productId && byIdCache.has(productId)) return byIdCache.get(productId) ?? { name: itemName, sku: itemSku }
  if (itemSku && bySkuCache.has(itemSku)) return bySkuCache.get(itemSku) ?? { name: itemName, sku: itemSku }

  let preview = { name: itemName, sku: itemSku, imageUrl: undefined as string | undefined }

  try {
    let productRecord: Record<string, unknown> | null = null

    if (productId) {
      productRecord = (await pb.collection('products').getOne(productId, {
        fields: 'id,name,sku,images',
        requestKey: null,
      })) as unknown as Record<string, unknown>
    } else if (itemSku) {
      const safeSku = escapePbString(itemSku)
      productRecord = (await pb.collection('products').getFirstListItem(`sku = "${safeSku}"`, {
        fields: 'id,name,sku,images',
        requestKey: null,
      })) as unknown as Record<string, unknown>
    }

    if (productRecord) {
      const image =
        Array.isArray(productRecord.images) && typeof productRecord.images[0] === 'string'
          ? productRecord.images[0]
          : undefined
      const recordId = typeof productRecord.id === 'string' ? productRecord.id : undefined

      preview = {
        name: typeof productRecord.name === 'string' ? productRecord.name : itemName,
        sku: typeof productRecord.sku === 'string' ? productRecord.sku : itemSku,
        imageUrl: recordId && image ? productImageUrl(recordId, image) : undefined,
      }
    }
  } catch {
    // keep fallback item-level preview
  }

  if (productId) byIdCache.set(productId, preview)
  if (itemSku) bySkuCache.set(itemSku, preview)
  return preview
}

export async function getCurrentUserOrders(): Promise<CustomerOrder[]> {
  const session = await getSession()
  if (!session) {
    throw new OrdersServiceError('User must be authenticated', 'UNAUTHENTICATED')
  }

  try {
    const pb = createServerPb()
    pb.authStore.save(session.token, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    } as any)

    const safeUserId = escapePbString(session.user.id)
    const res = await pb.collection('orders').getList(1, 200, {
      filter: `user = "${safeUserId}"`,
      sort: '-created',
      fields: 'id,created,updated,total,currency,status,user,items',
      requestKey: null,
    })

    const idCache = new Map<string, { name: string; sku?: string; imageUrl?: string }>()
    const skuCache = new Map<string, { name: string; sku?: string; imageUrl?: string }>()

    const owned = res.items
      .map((item) => item as unknown as Record<string, unknown>)
      .filter((item) => isOwnedByUser(item, session.user.id))

    return await Promise.all(
      owned.map(async (item) => {
        const orderItems = asOrderItems(item.items)
        const normalizedItems = await Promise.all(
          orderItems.map(async (rawItem) => {
            const preview = await resolvePreviewProduct(pb, rawItem, idCache, skuCache)
            return {
              id: typeof rawItem.id === 'string' ? rawItem.id : undefined,
              productId: extractProductId(rawItem) ?? undefined,
              name: preview.name,
              sku: preview.sku,
              unitPrice: Number(rawItem.unitPrice ?? 0),
              quantity: Math.max(1, Number(rawItem.quantity ?? 1)),
              imageUrl: preview.imageUrl,
            }
          })
        )

        return {
          id: String(item.id ?? ''),
          createdAt: String(item.created ?? ''),
          updatedAt: String(item.updated ?? item.created ?? ''),
          totalAmount: Number(item.total ?? 0),
          currency: typeof item.currency === 'string' ? item.currency : 'DT',
          status: normalizeStatus(item.status),
          itemsCount: normalizedItems.length,
          items: normalizedItems,
        }
      })
    )
  } catch (error) {
    console.error('orders.service:getCurrentUserOrders failed', error)
    throw new OrdersServiceError('Unable to fetch user orders', 'FETCH_FAILED')
  }
}
