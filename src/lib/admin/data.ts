import 'server-only'

import { requireAdmin } from '@/lib/auth'
import { createServerPb } from '@/lib/pb'
import type { OrderRecord, OrderStatus, UserRecord } from '@/types/order.types'

export type AdminCategoryRecord = {
  id: string
  name: string
  slug: string
  order: number
  parents: string[]
  desc?: string | null
  promo: number
  activeAll: boolean
  coverImage?: string | null
  coverImageUrl?: string
  features: string[]
}

export type AdminVariableRecord = {
  id: string
  name: string
  type: 'color' | 'image'
  color?: string
  image?: string
}

export type AdminInventoryProductStock = {
  id: string
  name: string
  sku?: string | null
  images?: string[]
  stock: number
  categories?: string[]
}

export type AdminVedetteProductOption = {
  id: string
  name: string
  slug: string
  sku: string
  price: number
  promoPrice: number | null
  imageUrl?: string
  isActive: boolean
  inView: boolean
  stock: number
}

export type AdminVedetteRecord = {
  id: string
  productId: string
  product: AdminVedetteProductOption | null
}

function normalizeParentIds(p: unknown): string[] {
  if (!p) return []
  if (Array.isArray(p)) {
    return p
      .map((item) => {
        if (!item) return null
        if (typeof item === 'string') return item
        if (typeof item === 'object' && 'id' in item) return (item as { id: string }).id
        return null
      })
      .filter((v): v is string => !!v)
  }
  if (typeof p === 'string') return [p]
  if (typeof p === 'object' && p && 'id' in p) return [(p as { id: string }).id]
  return []
}

function buildVariableImageUrl(id: string, image?: string) {
  if (!image || !image.trim()) return undefined
  const base =
    process.env.NEXT_PUBLIC_PB_URL ??
    process.env.POCKETBASE_URL ??
    'http://127.0.0.1:8090'
  return `${base}/api/files/variables/${id}/${image}`
}

function getPbBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_PB_URL ??
    process.env.POCKETBASE_URL ??
    'http://127.0.0.1:8090'
  )
}

function buildProductImageUrl(id: string, image?: string) {
  if (!image || !image.trim()) return undefined
  return `${getPbBaseUrl()}/api/files/products/${id}/${encodeURIComponent(image)}`
}

function buildCategoryCoverImageUrl(id: string, image?: string) {
  if (!image || !image.trim()) return undefined
  return `${getPbBaseUrl()}/api/files/categories/${id}/${encodeURIComponent(image)}`
}

function normalizeFeatures(raw: unknown): string[] {
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
      return [trimmed]
    }
    return []
  }
  return []
}

function mapAdminVedetteProduct(record: any): AdminVedetteProductOption {
  const images = Array.isArray(record?.images) ? record.images.map(String) : []
  return {
    id: String(record?.id ?? ''),
    name: String(record?.name ?? ''),
    slug: String(record?.slug ?? ''),
    sku: String(record?.sku ?? ''),
    price: Number(record?.price ?? 0),
    promoPrice:
      record?.promoPrice === undefined || record?.promoPrice === null
        ? null
        : Number(record.promoPrice),
    imageUrl: buildProductImageUrl(String(record?.id ?? ''), images[0]),
    isActive: Boolean(record?.isActive),
    inView: record?.inView === undefined || record?.inView === null ? true : Boolean(record.inView),
    stock: Number(record?.stock ?? 0),
  }
}

async function createAdminPb() {
  const session = await requireAdmin()
  const pb = createServerPb()
  pb.authStore.save(session.token, {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email,
  } as any)
  return pb
}

export async function getAdminCategories(): Promise<AdminCategoryRecord[]> {
  const pb = await createAdminPb()
  const res = await pb.collection('categories').getList(1, 200, { sort: 'order,name' })

  return res.items.map((r: any) => ({
    id: r.id,
    name: r.name ?? '',
    slug: r.slug ?? '',
    order: Number(r.order ?? 0),
    parents: normalizeParentIds(r.parent),
    desc: r.desc ?? '',
    promo: Number(r.promo ?? 0),
    activeAll: Boolean(r.activeAll),
    coverImage: r.coverImage ?? null,
    coverImageUrl: buildCategoryCoverImageUrl(r.id, r.coverImage),
    features: normalizeFeatures(r.features),
  }))
}

export async function getAdminVariables(): Promise<AdminVariableRecord[]> {
  const pb = await createAdminPb()
  const records = await pb.collection('variables').getFullList({ sort: '-created' })

  return records
    .filter((v) => v.type === 'color' || v.type === 'image')
    .map((v) => ({
      id: v.id,
      name: v.name ?? '',
      type: v.type as 'color' | 'image',
      color: v.color ?? undefined,
      image: v.type === 'image' ? buildVariableImageUrl(v.id, v.image) : undefined,
    }))
}

export async function getAdminInventoryData(): Promise<{
  products: AdminInventoryProductStock[]
  allCategories: { id: string; name: string }[]
}> {
  const pb = await createAdminPb()

  const [productsRes, catRes] = await Promise.all([
    pb.collection('products').getFullList({
      sort: 'name',
      expand: 'category',
    }),
    pb.collection('categories').getFullList({ sort: 'name' }),
  ])

  const allCategories = catRes.map((c: any) => ({ id: c.id, name: c.name }))
  const products: AdminInventoryProductStock[] = productsRes.map((p: any) => ({
    id: p.id,
    name: p.name ?? '',
    sku: p.sku ?? '',
    images: Array.isArray(p.images) ? p.images : [],
    stock: Number(p.stock ?? 0),
    categories: Array.isArray(p.expand?.category)
      ? p.expand.category.map((c: any) => c.id)
      : [],
  }))

  return { products, allCategories }
}

export async function getAdminVedettesData(): Promise<{
  vedettes: AdminVedetteRecord[]
  products: AdminVedetteProductOption[]
}> {
  const pb = await createAdminPb()

  const [vedettesRes, productRecords] = await Promise.all([
    pb.collection('vedettes').getList(1, 200, {
      sort: 'created',
      expand: 'product',
      fields:
        'id,product,expand.product.id,expand.product.name,expand.product.slug,expand.product.sku,expand.product.price,expand.product.promoPrice,expand.product.images,expand.product.isActive,expand.product.inView,expand.product.stock',
      requestKey: null,
    }),
    pb.collection('products').getFullList(1000, {
      sort: 'name',
      fields: 'id,name,slug,sku,price,promoPrice,images,isActive,inView,stock',
      requestKey: null,
    }),
  ])

  const products = productRecords.map((record: any) => mapAdminVedetteProduct(record))

  const deduped = new Set<string>()
  const vedettes: AdminVedetteRecord[] = []

  for (const item of vedettesRes.items as any[]) {
    const productId = String(item?.product ?? '')
    if (!productId || deduped.has(productId)) continue
    deduped.add(productId)

    const expanded = Array.isArray(item?.expand?.product)
      ? item.expand.product[0]
      : item?.expand?.product

    vedettes.push({
      id: String(item?.id ?? ''),
      productId,
      product: expanded ? mapAdminVedetteProduct(expanded) : null,
    })
  }

  return { vedettes, products }
}

const allowedStatuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'delevering',
  'delivered',
  'cancelled',
  'on hold',
  'returned',
]

function normalizeStatus(value: unknown): OrderStatus {
  if (typeof value !== 'string') return 'pending'
  return allowedStatuses.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : 'pending'
}

export async function getAdminOrders(): Promise<OrderRecord[]> {
  const pb = await createAdminPb()
  const res = await pb.collection('orders').getList(1, 200, { sort: '-created' })

  return Promise.all(
    res.items.map(async (r: Record<string, unknown>) => {
      let userRecord: UserRecord | null = null

      if (typeof r.user === 'string' && r.user.length > 0) {
        try {
          const user = await pb.collection('users').getOne(r.user)
          userRecord = {
            id: user.id,
            surname: user.surname,
            name: user.name,
            fullName: [user.surname, user.name].filter(Boolean).join(' ').trim(),
            email: user.email,
            username: user.username,
            verif: Boolean(user.verif),
          }
        } catch {
          userRecord = null
        }
      }

      const firstName = typeof r.firstName === 'string' ? r.firstName : ''
      const lastName = typeof r.lastName === 'string' ? r.lastName : ''
      const displayName =
        firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Guest'

      const city = typeof r.city === 'string' ? r.city : ''
      const postalCode = typeof r.postalCode === 'string' ? r.postalCode : ''

      return {
        id: String(r.id ?? ''),
        created: String(r.created ?? ''),
        items: Array.isArray(r.items) ? r.items : [],
        total: Number(r.total ?? 0),
        currency: typeof r.currency === 'string' ? r.currency : 'DT',
        status: normalizeStatus(r.status),
        userId: typeof r.user === 'string' ? r.user : null,
        userName: displayName,
        isGuest: !firstName && !lastName,
        location: `${city} ${postalCode}`.trim(),
        address: typeof r.address === 'string' ? r.address : '',
        city,
        phone: typeof r.phone === 'string' ? r.phone : '',
        postalCode,
        notes: typeof r.notes === 'string' ? r.notes : '',
        paymentMode: typeof r.paymentMode === 'string' ? r.paymentMode : '',
        user: userRecord,
      }
    })
  )
}
