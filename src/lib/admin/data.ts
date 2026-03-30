import 'server-only'

import { requireAdmin } from '@/lib/auth'
import { createServerPb } from '@/lib/pb'
import type { OrderRecord, OrderStatus, UserRecord } from '@/types/order.types'

export type AdminCategoryRecord = {
  id: string
  name: string
  slug: string
  order: number
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
  count?: string
  flavor?: string
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

const FLAVOR_KEYS = ['saveur', 'flavor', 'flavour', 'gout', 'arome', 'taste', 'parfum']
const COUNT_KEYS = [
  'count',
  'quantite',
  'qty',
  'portion',
  'serving',
  'size',
  'taille',
  'poids',
  'weight',
  'gramme',
  'pack',
  'capsule',
  'sachet',
  'boite',
  'unite',
]

function parseVariantRef(raw: string): { id: string } | null {
  const match = raw.match(/^is(?:Image|Color)\((.+)\)$/i)
  if (!match?.[1]) return null
  return { id: match[1] }
}

function extractCountFlavorFromVariantKey(
  variantKey: Record<string, string> | undefined,
  variableNames: Map<string, string>
): { count?: string; flavor?: string } {
  if (!variantKey) return {}

  let count: string | undefined
  let flavor: string | undefined

  for (const [key, rawValue] of Object.entries(variantKey)) {
    const loweredKey = key.toLowerCase()
    let resolved = String(rawValue ?? '').trim()
    const ref = parseVariantRef(resolved)
    if (ref && variableNames.has(ref.id)) {
      resolved = variableNames.get(ref.id) ?? resolved
    }
    if (!resolved) continue

    if (!count && COUNT_KEYS.some((k) => loweredKey.includes(k))) {
      count = resolved
      continue
    }
    if (!flavor && FLAVOR_KEYS.some((k) => loweredKey.includes(k))) {
      flavor = resolved
    }
  }

  return { count, flavor }
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

  const variableIds = new Set<string>()
  for (const p of productsRes as any[]) {
    const variantKey = (p?.variantKey ?? {}) as Record<string, string>
    for (const raw of Object.values(variantKey)) {
      const ref = parseVariantRef(String(raw ?? ''))
      if (ref && /^[a-zA-Z0-9]{15}$/.test(ref.id)) {
        variableIds.add(ref.id)
      }
    }
  }

  const variableNames = new Map<string, string>()
  if (variableIds.size > 0) {
    const filter = Array.from(variableIds).map((id) => `id = "${id}"`).join(' || ')
    const variables = await pb.collection('variables').getFullList({
      filter,
      fields: 'id,name',
      requestKey: null,
    })
    for (const variable of variables as any[]) {
      variableNames.set(String(variable.id), String(variable.name ?? ''))
    }
  }

  const allCategories = catRes.map((c: any) => ({ id: c.id, name: c.name }))
  const products: AdminInventoryProductStock[] = productsRes.map((p: any) => ({
    ...extractCountFlavorFromVariantKey((p?.variantKey ?? {}) as Record<string, string>, variableNames),
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
  'paid',
  'delivering',
  'delivered',
  'refunded',
  'on hold',
]

function normalizeStatus(value: unknown): OrderStatus {
  if (typeof value !== 'string') return 'paid'
  return allowedStatuses.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : 'paid'
}

export async function getAdminOrders(): Promise<OrderRecord[]> {
  const pb = await createAdminPb()
  const res = await pb.collection('orders').getList(1, 200, { sort: '-created' })
  const productIds = [
    ...new Set(
      res.items
        .flatMap((order: any) =>
          Array.isArray(order?.items)
            ? order.items.map((item: any) => (typeof item?.productId === 'string' ? item.productId : ''))
            : []
        )
        .filter((id: string) => /^[a-zA-Z0-9]{15}$/.test(id))
    ),
  ]

  const productMetaMap = new Map<string, { imageUrl?: string; name?: string; sku?: string; count?: string; flavor?: string }>()
  if (productIds.length > 0) {
    const filter = productIds.map((id) => `id = "${id}"`).join(' || ')
    const products = await pb.collection('products').getFullList({
      filter,
      fields: 'id,name,sku,images,variantKey',
      requestKey: null,
    })

    const variableIds = new Set<string>()
    for (const product of products as any[]) {
      const variantKey = (product?.variantKey ?? {}) as Record<string, string>
      for (const raw of Object.values(variantKey)) {
        const ref = parseVariantRef(String(raw ?? ''))
        if (ref && /^[a-zA-Z0-9]{15}$/.test(ref.id)) {
          variableIds.add(ref.id)
        }
      }
    }

    const variableNames = new Map<string, string>()
    if (variableIds.size > 0) {
      const variableFilter = Array.from(variableIds)
        .map((id) => `id = "${id}"`)
        .join(' || ')
      const variables = await pb.collection('variables').getFullList({
        filter: variableFilter,
        fields: 'id,name',
        requestKey: null,
      })
      for (const variable of variables as any[]) {
        variableNames.set(String(variable.id), String(variable.name ?? ''))
      }
    }

    for (const product of products as any[]) {
      const image =
        Array.isArray(product?.images) && typeof product.images[0] === 'string'
          ? String(product.images[0])
          : ''
      const imageUrl = buildProductImageUrl(String(product?.id ?? ''), image)
      const variantKey = (product?.variantKey ?? {}) as Record<string, string>
      const { count, flavor } = extractCountFlavorFromVariantKey(variantKey, variableNames)
      productMetaMap.set(String(product.id), {
        imageUrl: imageUrl || undefined,
        name: typeof product?.name === 'string' ? String(product.name) : undefined,
        sku: typeof product?.sku === 'string' ? String(product.sku) : undefined,
        count,
        flavor,
      })
    }
  }

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
        typeof r.userName === 'string' && r.userName.trim()
          ? r.userName.trim()
          : firstName || lastName
          ? `${firstName} ${lastName}`.trim()
          : 'Guest'

      const city = typeof r.city === 'string' ? r.city : ''
      const state = typeof r.state === 'string' ? r.state : ''
      const country = typeof r.country === 'string' ? r.country : ''
      const postalCode = typeof r.postalCode === 'string' ? r.postalCode : ''
      const rawItems = Array.isArray(r.items) ? r.items : []
      const itemsWithImages = rawItems.map((item: any) => {
        const productId = typeof item?.productId === 'string' ? item.productId : undefined
        const meta = productId ? productMetaMap.get(productId) : undefined
        const itemName = typeof item?.name === 'string' ? item.name.trim() : ''
        const itemSku = typeof item?.sku === 'string' ? item.sku.trim() : ''
        const resolvedName = itemName && itemName.toLowerCase() !== 'product' && itemName.toLowerCase() !== 'produit'
          ? itemName
          : (meta?.name ?? itemName)
        const resolvedSku = itemSku || meta?.sku || ''
        return {
          ...item,
          name: resolvedName,
          sku: resolvedSku,
          count:
            typeof item?.count === 'string' && item.count.trim().length > 0
              ? item.count
              : meta?.count,
          flavor:
            typeof item?.flavor === 'string' && item.flavor.trim().length > 0
              ? item.flavor
              : meta?.flavor,
          imageUrl:
            typeof item?.imageUrl === 'string' && item.imageUrl.trim().length > 0
              ? item.imageUrl
              : meta?.imageUrl,
        }
      })

      return {
        id: String(r.id ?? ''),
        created: String(r.created ?? ''),
        items: itemsWithImages,
        total: Number(r.total ?? 0),
        currency: typeof r.currency === 'string' ? r.currency : 'DT',
        status: normalizeStatus(r.status),
        userId: typeof r.user === 'string' ? r.user : null,
        userName: displayName,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        isGuest: typeof r.isGuest === 'boolean' ? r.isGuest : (!firstName && !lastName),
        location:
          typeof r.location === 'string' && r.location.trim()
            ? r.location.trim()
            : [city, state, country].filter(Boolean).join(', '),
        address: typeof r.address === 'string' ? r.address : '',
        city,
        state: state || undefined,
        country: country || undefined,
        email:
          typeof r.email === 'string'
            ? r.email
            : (userRecord?.email ?? ''),
        phone: typeof r.phone === 'string' ? r.phone : '',
        postalCode,
        notes: typeof r.notes === 'string' ? r.notes : '',
        paymentMode: typeof r.paymentMode === 'string' ? r.paymentMode : '',
        user: userRecord,
      }
    })
  )
}
