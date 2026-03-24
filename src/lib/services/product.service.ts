import 'server-only'

import { unstable_cache } from 'next/cache'
import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'

import { getSession } from '@/lib/auth/server'
import { createServerPb } from '@/lib/pb'
import { getWishlistProductIds } from '@/lib/services/shop-user.service'

const PB_ID_REGEX = /^[a-zA-Z0-9]{15}$/
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i

const SHOP_PAGE_SIZE_DEFAULT = 24
const SHOP_PAGE_SIZE_MAX = 48
const SHOP_RELATED_LIMIT = 8
const HOME_PRODUCTS_LIMIT_DEFAULT = 6
const HOME_PRODUCTS_FIELDS =
  'id,slug,sku,name,price,promoPrice,isActive,inView,description,images,currency,categories,category,isNew,isVariant,isParent,variantKey,stock,updated'
const HOME_VEDETTES_FIELDS = [
  'id',
  'product',
  ...HOME_PRODUCTS_FIELDS.split(',').map((field) => `expand.product.${field}`),
].join(',')

const shopListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(SHOP_PAGE_SIZE_MAX).default(SHOP_PAGE_SIZE_DEFAULT),
  query: z.string().trim().max(80).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  promotions: z.enum(['0', '1']).optional(),
  nouveautes: z.enum(['0', '1']).optional(),
  wishlist: z.enum(['0', '1']).optional(),
  sort: z.enum(['name', 'priceAsc', 'priceDesc', 'latest']).default('name'),
})

const productSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(SLUG_REGEX, 'Invalid slug')

type PocketBaseRecord = Record<string, unknown>
type ProductDetailRecord = { label?: unknown; value?: unknown }

export type ShopCategory = {
  id: string
  name: string
  slug: string
  order: number
  parent: string | string[] | null
  description: string | null
  promo: number
  activeAll: boolean
  coverImage: string | null
  coverImageUrl: string | null
  features: string[]
}

export type ProductListItem = {
  id: string
  slug: string
  sku: string
  name: string
  price: number
  promoPrice: number | null
  isActive: boolean
  inView: boolean
  description: string
  images: string[]
  imageUrls: string[]
  currency: string
  categories: string[]
  isNew: boolean
  isVariant: boolean
  isParent: boolean
  variantKey: Record<string, string>
  stock: number
  inStock: boolean
}

export type ShopListInput = z.infer<typeof shopListQuerySchema>

export type ShopListResult = {
  products: ProductListItem[]
  categories: ShopCategory[]
  categorySlug: string | null
  activeCategory: ShopCategory | null
  pagination: {
    page: number
    perPage: number
    totalItems: number
    totalPages: number
    hasPrevPage: boolean
    hasNextPage: boolean
  }
  applied: {
    query: string
    promotions: boolean
    nouveautes: boolean
    sort: ShopListInput['sort']
  }
}

export type ProductAvailability = {
  stock: number
  inStock: boolean
}

export type ProductVariantValue = {
  id: string
  value: string
  resolvedValue: { type: 'image' | 'color' | 'text'; url?: string; value?: string }
}

export type ProductDetailsResult = {
  product: ProductListItem & {
    details: Array<{ label: string; value: string }>
    image: string
  }
  categories: ShopCategory[]
  categoryName: string
  imageUrls: string[]
  availability: ProductAvailability
  variants: Array<ProductListItem & { image: string }>
  variantUrlMap: Record<string, string>
  variantValuesMap: Record<string, ProductVariantValue[]>
  explicitRelatedProducts: ProductListItem[]
  relatedProducts: ProductListItem[]
}

function escapePbString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function normalizeCategoryIds(record: PocketBaseRecord): string[] {
  const raw = (record.categories ?? record.category ?? []) as unknown
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
  if (!raw) return []
  return [String(raw)]
}

function normalizeRelationIds(record: PocketBaseRecord, key: string): string[] {
  const raw = record[key]
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'string' ? item : String((item as { id?: unknown })?.id ?? '')))
      .filter(Boolean)
  }
  if (typeof raw === 'string') return [raw]
  if (typeof raw === 'object' && raw && 'id' in raw) return [String((raw as { id: unknown }).id ?? '')]
  return []
}

function extractExpandedProduct(record: PocketBaseRecord): PocketBaseRecord | null {
  const expand = record.expand
  if (!expand || typeof expand !== 'object') return null

  const rawProduct = (expand as { product?: unknown }).product
  if (Array.isArray(rawProduct)) {
    const first = rawProduct[0]
    return first && typeof first === 'object' ? (first as PocketBaseRecord) : null
  }

  if (rawProduct && typeof rawProduct === 'object') {
    return rawProduct as PocketBaseRecord
  }

  return null
}

function getPbBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PB_URL ??
    process.env.POCKETBASE_URL ??
    'http://127.0.0.1:8090'
  )
}

function fileUrl(collection: string, id: string, filename: string, updated?: string): string {
  const base = `${getPbBaseUrl()}/api/files/${collection}/${id}/${encodeURIComponent(filename)}`
  return updated ? `${base}?v=${encodeURIComponent(updated)}` : base
}

function sanitizeCategoryDescription(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['h1', 'h2', 'p', 'strong', 'b', 'ul', 'li', 'br'],
    ALLOWED_ATTR: [],
  })
}

function mapCategory(record: PocketBaseRecord): ShopCategory {
  const id = String(record.id ?? '')
  const rawCover = record.coverImage
  const coverImage =
    typeof rawCover === 'string'
      ? rawCover.trim() || null
      : Array.isArray(rawCover) && rawCover.length > 0
        ? String(rawCover[0]).trim() || null
        : null
  const rawFeatures = record.features
  const features = Array.isArray(rawFeatures)
    ? rawFeatures.map((item) => String(item).trim()).filter(Boolean)
    : typeof rawFeatures === 'string'
      ? (() => {
          const trimmed = rawFeatures.trim()
          if (!trimmed) return []
          try {
            const parsed = JSON.parse(trimmed)
            return Array.isArray(parsed)
              ? parsed.map((item) => String(item).trim()).filter(Boolean)
              : []
          } catch {
            return [trimmed]
          }
        })()
      : []

  return {
    id,
    name: String(record.name ?? ''),
    slug: String(record.slug ?? ''),
    order: Number(record.order ?? 0),
    parent: (record.parent as string | string[] | null | undefined) ?? null,
    description: sanitizeCategoryDescription(record.desc ?? record.description) || null,
    promo: Number(record.promo ?? 0),
    activeAll: Boolean(record.activeAll),
    coverImage,
    coverImageUrl: coverImage ? fileUrl('categories', id, coverImage) : null,
    features,
  }
}

function resolveCategoryPromoPrice(
  price: number,
  promoPrice: number | null,
  categoryIds: string[],
  categoriesById?: Map<string, ShopCategory>
): number | null {
  const productPromo =
    promoPrice != null && promoPrice > 0 && promoPrice < price ? promoPrice : null

  if (!categoriesById || categoryIds.length === 0) return productPromo

  const overridingCategories = categoryIds
    .map((categoryId) => categoriesById.get(categoryId))
    .filter((category): category is ShopCategory => !!category && category.activeAll)

  // No category is configured to override product promotions.
  if (overridingCategories.length === 0) return productPromo

  let bestPromo: number | null = null

  for (const category of overridingCategories) {
    const percent = Number(category.promo ?? 0)
    if (!Number.isFinite(percent) || percent <= 0) continue

    const cappedPercent = Math.min(100, Math.max(0, percent))
    const candidate = Number((price * (1 - cappedPercent / 100)).toFixed(2))
    if (candidate <= 0 || candidate >= price) continue

    if (bestPromo == null || candidate < bestPromo) {
      bestPromo = candidate
    }
  }

  // At least one category overrides product promo:
  // use best category promo if available, otherwise no promo.
  return bestPromo
}

function mapProduct(
  record: PocketBaseRecord,
  categoriesById?: Map<string, ShopCategory>
): ProductListItem {
  const id = String(record.id ?? '')
  const images = Array.isArray(record.images) ? record.images.map(String) : []
  const stock = Number(record.stock ?? 0)
  const price = Number(record.price ?? 0)
  const rawPromo =
    record.promoPrice === null || record.promoPrice === undefined
      ? null
      : Number(record.promoPrice)
  const categoryIds = normalizeCategoryIds(record)
  return {
    id,
    slug: String(record.slug ?? ''),
    sku: String(record.sku ?? ''),
    name: String(record.name ?? ''),
    price,
    promoPrice: resolveCategoryPromoPrice(price, rawPromo, categoryIds, categoriesById),
    isActive: Boolean(record.isActive),
    inView: record.inView === undefined || record.inView === null ? true : Boolean(record.inView),
    description: String(record.description ?? ''),
    images,
    imageUrls: images.map((img) => fileUrl('products', id, img, record.updated ? String(record.updated) : undefined)),
    currency: String(record.currency ?? 'DT'),
    categories: categoryIds,
    isNew: Boolean(record.isNew),
    isVariant: Boolean(record.isVariant),
    isParent: Boolean(record.isParent),
    variantKey: (record.variantKey as Record<string, string> | undefined) ?? {},
    stock,
    inStock: stock > 0,
  }
}

const getCachedCategories = unstable_cache(
  async (): Promise<ShopCategory[]> => {
    const pb = createServerPb()
    const records = await pb.collection('categories').getFullList(500, {
      sort: 'order,name',
      fields: 'id,name,slug,order,parent,desc,description,promo,activeAll,coverImage,features',
      requestKey: null,
    })
    return records.map((c) => mapCategory(c as PocketBaseRecord))
  },
  ['shop-categories-v1'],
  { revalidate: 300, tags: ['shop-categories'] }
)

export async function getShopCategories(): Promise<ShopCategory[]> {
  return getCachedCategories()
}

function sortToPocketBase(sort: ShopListInput['sort']): string {
  if (sort === 'priceAsc') return 'price'
  if (sort === 'priceDesc') return '-price'
  if (sort === 'latest') return '-created'
  return 'name'
}

function parseVariantRef(raw: string) {
  const imageMatch = raw.match(/^isImage\((.+)\)$/)
  if (imageMatch) return { type: 'image' as const, id: imageMatch[1] }

  const colorMatch = raw.match(/^isColor\((.+)\)$/)
  if (colorMatch) return { type: 'color' as const, id: colorMatch[1] }

  return null
}

function variantKeyToString(value: Record<string, string>): string {
  return Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|')
}

export function parseShopListInput(
  searchParams: Record<string, string | string[] | undefined>
): ShopListInput {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      if (value[0]) normalized[key] = value[0]
    } else if (typeof value === 'string') {
      normalized[key] = value
    }
  }

  return shopListQuerySchema.parse(normalized)
}

export async function getShopCategoryBySlug(slug: string): Promise<ShopCategory | null> {
  const value = slug.trim()
  if (!value) return null

  const categories = await getCachedCategories()
  return categories.find((category) => category.slug === value) ?? null
}

export async function getHomeBestSellerProducts(
  limit = HOME_PRODUCTS_LIMIT_DEFAULT
): Promise<ProductListItem[]> {
  const safeLimit = Math.max(1, Math.min(48, Math.floor(limit || HOME_PRODUCTS_LIMIT_DEFAULT)))
  const pb = createServerPb()
  const ordered: ProductListItem[] = []
  const baseFilter = 'isActive=true  && stock > 0'

  try {
    const vedettesRes = await pb.collection('vedettes').getList(1, safeLimit, {
      sort: 'created',
      expand: 'product',
      fields: HOME_VEDETTES_FIELDS,
      requestKey: null,
    })

    const selected = new Map<string, ProductListItem>()
    for (const item of vedettesRes.items as unknown as PocketBaseRecord[]) {
      const expanded = extractExpandedProduct(item)
      if (!expanded) continue

      const mapped = mapProduct(expanded)
      if (!mapped.id || selected.has(mapped.id)) continue

      selected.set(mapped.id, mapped)
      if (selected.size >= safeLimit) break
    }

    if (selected.size > 0) {
      return Array.from(selected.values())
    }
  } catch {
    // Fallback to computed best sellers.
  }

  try {
    const bestSellerRes = await pb.collection('products').getList(1, safeLimit, {
      sort: '-soldCount,-created',
      filter: baseFilter,
      fields: HOME_PRODUCTS_FIELDS,
      requestKey: null,
    })

    ordered.push(...(bestSellerRes.items as unknown as PocketBaseRecord[]).map((record) => mapProduct(record)))
  } catch {
    // Fallback when soldCount is missing or the best-seller query fails.
    try {
      const latestRes = await pb.collection('products').getList(1, safeLimit, {
        sort: '-created',
        filter: baseFilter,
        fields: HOME_PRODUCTS_FIELDS,
        requestKey: null,
      })
      ordered.push(...(latestRes.items as unknown as PocketBaseRecord[]).map((record) => mapProduct(record)))
    } catch {
      // Keep rendering home even if PB is unavailable.
    }
  }

  if (ordered.length < safeLimit) {
    try {
      const existingIds = new Set(ordered.map((item) => item.id))
      const fillRes = await pb.collection('products').getList(1, 48, {
        sort: '-created',
        filter: baseFilter,
        fields: HOME_PRODUCTS_FIELDS,
        requestKey: null,
      })

      for (const raw of fillRes.items as unknown as PocketBaseRecord[]) {
        const mapped = mapProduct(raw)
        if (existingIds.has(mapped.id)) continue
        ordered.push(mapped)
        existingIds.add(mapped.id)
        if (ordered.length === safeLimit) break
      }
    } catch {
      // Ignore and continue to placeholders if still needed.
    }
  }

  return ordered.slice(0, safeLimit)
}

export async function getShopList(input: ShopListInput): Promise<ShopListResult> {
  const categories = await getCachedCategories()
  const categoriesById = new Map(categories.map((category) => [category.id, category]))
  const activeCategory = input.category
    ? categories.find((c) => c.slug === input.category) ?? null
    : null

  const baseFilters = ['isActive=true && (inView=true || inView=null)']

  if (input.query) {
    const q = escapePbString(input.query)
    baseFilters.push(`(name ~ "${q}" || sku ~ "${q}")`)
  }

  let categoryFilters: string[] = []
  if (activeCategory) {
    const childIds = categories
      .filter((cat) => {
        const parentField = cat.parent
        if (!parentField) return false
        const parentIds = Array.isArray(parentField) ? parentField : [parentField]
        return parentIds.includes(activeCategory.id)
      })
      .map((c) => c.id)

    const ids = Array.from(new Set([activeCategory.id, ...childIds]))
    categoryFilters = ids
  }

  if (input.promotions === '1') {
    baseFilters.push('promoPrice != null && promoPrice > 0 && promoPrice < price')
  }

  if (input.nouveautes === '1') {
    baseFilters.push('isNew=true')
  }

  if (input.wishlist === '1') {
    const session = await getSession()
    if (!session) {
      return {
        products: [],
        categories,
        categorySlug: input.category ?? null,
        activeCategory,
        pagination: {
          page: input.page,
          perPage: input.perPage,
          totalItems: 0,
          totalPages: 0,
          hasPrevPage: false,
          hasNextPage: false,
        },
        applied: {
          query: input.query ?? '',
          promotions: input.promotions === '1',
          nouveautes: input.nouveautes === '1',
          sort: input.sort,
        },
      }
    }

    const wishlistIds = await getWishlistProductIds({
      token: session.token,
      userId: session.user.id,
    })

    if (wishlistIds.length === 0) {
      return {
        products: [],
        categories,
        categorySlug: input.category ?? null,
        activeCategory,
        pagination: {
          page: input.page,
          perPage: input.perPage,
          totalItems: 0,
          totalPages: 0,
          hasPrevPage: false,
          hasNextPage: false,
        },
        applied: {
          query: input.query ?? '',
          promotions: input.promotions === '1',
          nouveautes: input.nouveautes === '1',
          sort: input.sort,
        },
      }
    }

    const wishlistFilter = wishlistIds
      .map((id) => `id="${escapePbString(id)}"`)
      .join(' || ')
    baseFilters.push(`(${wishlistFilter})`)
  }

  const pb = createServerPb()

  const fetchList = async (filter: string) =>
    pb.collection('products').getList(input.page, input.perPage, {
      filter,
      sort: sortToPocketBase(input.sort),
      fields:
        'id,slug,sku,name,price,promoPrice,isActive,inView,description,images,currency,categories,category,isNew,isVariant,isParent,variantKey,stock,updated',
      requestKey: null,
    })

  const baseFilterString = baseFilters.join(' && ')
  let result: Awaited<ReturnType<typeof fetchList>>

  if (categoryFilters.length === 0) {
    result = await fetchList(baseFilterString)
  } else {
    const categoryOnRelation = categoryFilters
      .map((id) => `category ~ "${escapePbString(id)}"`)
      .join(' || ')
    const categoriesOnRelation = categoryFilters
      .map((id) => `categories ~ "${escapePbString(id)}"`)
      .join(' || ')

    result = await fetchList(`${baseFilterString} && (${categoryOnRelation})`).catch(async () => {
      return fetchList(`${baseFilterString} && (${categoriesOnRelation})`).catch(async () => {
        // Last-resort fallback: keep page responsive even if category filter schema is incompatible.
        return fetchList(baseFilterString)
      })
    })
  }

  const products = result.items.map((r: PocketBaseRecord) => mapProduct(r, categoriesById))

  return {
    products,
    categories,
    categorySlug: input.category ?? null,
    activeCategory,
    pagination: {
      page: result.page,
      perPage: result.perPage,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      hasPrevPage: result.page > 1,
      hasNextPage: result.page < result.totalPages,
    },
    applied: {
      query: input.query ?? '',
      promotions: input.promotions === '1',
      nouveautes: input.nouveautes === '1',
      sort: input.sort,
    },
  }
}

async function getVariantsAndValues(
  baseRecord: PocketBaseRecord,
  categoriesById: Map<string, ShopCategory>
): Promise<{
  variants: Array<ProductListItem & { image: string }>
  variantUrlMap: Record<string, string>
  variantValuesMap: Record<string, ProductVariantValue[]>
}> {
  const pb = createServerPb()
  const recordId = String(baseRecord.id ?? '')
  const isParent = Boolean(baseRecord.isParent)
  const parentId = String(baseRecord.parent ?? '')

  let rawVariants: PocketBaseRecord[] = []

  if (isParent) {
    const children = await pb.collection('products').getFullList(200, {
      filter: `parent="${escapePbString(recordId)}" && isActive=true `,
      fields:
        'id,slug,sku,name,price,promoPrice,isActive,inView,description,images,currency,categories,category,isNew,isVariant,isParent,parent,variantKey,stock,updated',
      requestKey: null,
    })
    rawVariants = [baseRecord, ...(children as unknown as PocketBaseRecord[])]
  } else if (parentId && PB_ID_REGEX.test(parentId)) {
    const [parent, siblings] = await Promise.all([
      pb.collection('products').getOne(parentId, {
        fields:
          'id,slug,sku,name,price,promoPrice,isActive,inView,description,images,currency,categories,category,isNew,isVariant,isParent,parent,variantKey,stock,updated',
        requestKey: null,
      }),
      pb.collection('products').getFullList(200, {
        filter: `parent="${escapePbString(parentId)}" && isActive=true`,
        fields:
          'id,slug,sku,name,price,promoPrice,isActive,inView,description,images,currency,categories,category,isNew,isVariant,isParent,parent,variantKey,stock,updated',
        requestKey: null,
      }),
    ])
    rawVariants = [parent as unknown as PocketBaseRecord, ...(siblings as unknown as PocketBaseRecord[])]

  }

  if (rawVariants.length === 0) {
    return { variants: [], variantUrlMap: {}, variantValuesMap: {} }
  }

  const variants = rawVariants.map((v) => {
    const product = mapProduct(v, categoriesById)
    return {
      ...product,
      image: product.imageUrls[0] ?? '/aboutimg.webp',
    }
  })

  const variantUrlMap: Record<string, string> = {}
  for (const variant of variants) {
    const key = variantKeyToString(variant.variantKey ?? {})
    if (key) {
      variantUrlMap[key] = `/produit/${variant.slug}`
    }
  }

  const variableIds = new Set<string>()
  for (const variant of variants) {
    for (const raw of Object.values(variant.variantKey ?? {})) {
      const parsed = parseVariantRef(String(raw))
      if (parsed?.id && PB_ID_REGEX.test(parsed.id)) variableIds.add(parsed.id)
    }
  }

  const variableMap = new Map<string, PocketBaseRecord>()
  if (variableIds.size > 0) {
    const filter = Array.from(variableIds)
      .map((id) => `id="${escapePbString(id)}"`)
      .join(' || ')
    const records = await pb.collection('variables').getFullList(500, {
      filter,
      fields: 'id,name,color,image',
      requestKey: null,
    })
    for (const rec of records as unknown as PocketBaseRecord[]) {
      variableMap.set(String(rec.id ?? ''), rec)
    }
  }

  const variantValuesMap: Record<string, ProductVariantValue[]> = {}
  const keys = Object.keys(variants[0]?.variantKey ?? {})

  for (const key of keys) {
    const uniq = new Map<string, ProductVariantValue>()
    for (const variant of variants) {
      const raw = variant.variantKey?.[key]
      if (!raw || uniq.has(raw)) continue

      const parsed = parseVariantRef(raw)
      if (!parsed) {
        uniq.set(raw, {
          id: variant.id,
          value: raw,
          resolvedValue: { type: 'text', value: raw },
        })
        continue
      }

      const variable = variableMap.get(parsed.id)
      if (parsed.type === 'image') {
        const image = String(variable?.image ?? '')
        uniq.set(raw, {
          id: variant.id,
          value: raw,
          resolvedValue: {
            type: 'image',
            url: image ? fileUrl('variables', parsed.id, image) : '/aboutimg.webp',
            value: variable?.name ? String(variable.name) : undefined,
          },
        })
      } else {
        uniq.set(raw, {
          id: variant.id,
          value: raw,
          resolvedValue: {
            type: 'color',
            value: String(variable?.color ?? '#000000'),
          },
        })
      }
    }

    variantValuesMap[key] = Array.from(uniq.values())
  }

  return {
    variants,
    variantUrlMap,
    variantValuesMap,
  }
}

async function getRelatedProducts(
  current: ProductListItem,
  categoriesById: Map<string, ShopCategory>,
  preferredIds: string[] = []
): Promise<ProductListItem[]> {
  const pb = createServerPb()
  const baseFilter = 'isActive=true  && stock>0'
  const relatedById = new Map<string, PocketBaseRecord>()

  const addRecords = (records: PocketBaseRecord[]) => {
    for (const record of records) {
      const id = String(record.id ?? '')
      if (!id || id === current.id || relatedById.has(id)) continue
      relatedById.set(id, record)
      if (relatedById.size >= SHOP_RELATED_LIMIT) break
    }
  }

  const buildExcludeFilter = () => {
    const existing = [current.id, ...Array.from(relatedById.keys())]
    return existing.map((id) => `id!="${escapePbString(id)}"`).join(' && ')
  }

  const preferred = Array.from(
    new Set(preferredIds.filter((id) => PB_ID_REGEX.test(id) && id !== current.id))
  )

  if (preferred.length > 0) {
    const preferredFilter = preferred.map((id) => `id="${escapePbString(id)}"`).join(' || ')
    const preferredResult = await pb
      .collection('products')
      .getList(1, Math.max(preferred.length, 1), {
        filter: `${baseFilter} && (${preferredFilter})`,
        sort: '-created',
        fields:
          'id,slug,sku,name,price,promoPrice,isActive,inView,description,images,currency,categories,category,isNew,isVariant,isParent,variantKey,stock,updated',
        requestKey: null,
      })
      .catch(() => null)

    if (preferredResult?.items) {
      const ranked = (preferredResult.items as unknown as PocketBaseRecord[]).sort((a, b) => {
        const aId = String(a.id ?? '')
        const bId = String(b.id ?? '')
        return preferred.indexOf(aId) - preferred.indexOf(bId)
      })
      addRecords(ranked)
    }
  }

  if (current.categories.length > 0) {
    const relationFilters = [
      current.categories.map((id) => `category ~ "${escapePbString(id)}"`).join(' || '),
      current.categories.map((id) => `categories ~ "${escapePbString(id)}"`).join(' || '),
    ].filter(Boolean)

    for (const relationFilter of relationFilters) {
      if (relatedById.size >= SHOP_RELATED_LIMIT) break
      const sameCategory = await pb
        .collection('products')
        .getList(1, SHOP_RELATED_LIMIT * 3, {
          filter: `${baseFilter} && ${buildExcludeFilter()} && (${relationFilter})`,
          sort: '-created',
          fields:
            'id,slug,sku,name,price,promoPrice,isActive,inView,description,images,currency,categories,category,isNew,isVariant,isParent,variantKey,stock,updated',
          requestKey: null,
        })
        .catch(() => null)

      if (sameCategory?.items) {
        addRecords(sameCategory.items as unknown as PocketBaseRecord[])
      }
    }
  }

  if (relatedById.size < SHOP_RELATED_LIMIT) {
    const fallback = await pb.collection('products').getList(1, SHOP_RELATED_LIMIT, {
      filter: `${baseFilter} && ${buildExcludeFilter()}`,
      sort: '-created',
      fields:
        'id,slug,sku,name,price,promoPrice,isActive,inView,description,images,currency,categories,category,isNew,isVariant,isParent,variantKey,stock,updated',
      requestKey: null,
    })
    addRecords(fallback.items as unknown as PocketBaseRecord[])
  }

  const trimmed = Array.from(relatedById.values()).slice(0, SHOP_RELATED_LIMIT)
  return trimmed.map((r) => mapProduct(r, categoriesById))
}

async function getExplicitRelatedProducts(
  current: ProductListItem,
  preferredIds: string[],
  categoriesById: Map<string, ShopCategory>
): Promise<ProductListItem[]> {
  const preferred = Array.from(
    new Set(preferredIds.filter((id) => PB_ID_REGEX.test(id) && id !== current.id))
  )
  if (preferred.length === 0) return []

  const pb = createServerPb()
  const preferredFilter = preferred.map((id) => `id="${escapePbString(id)}"`).join(' || ')
  const result = await pb
    .collection('products')
    .getList(1, preferred.length, {
      filter: `isActive=true && (inView=true || inView=null) && (${preferredFilter})`,
      sort: '-created',
      fields:
        'id,slug,sku,name,price,promoPrice,isActive,inView,description,images,currency,categories,category,isNew,isVariant,isParent,variantKey,stock,updated',
      requestKey: null,
    })
    .catch(() => null)

  if (!result?.items) return []

  const ranked = (result.items as unknown as PocketBaseRecord[]).sort((a, b) => {
    const aId = String(a.id ?? '')
    const bId = String(b.id ?? '')
    return preferred.indexOf(aId) - preferred.indexOf(bId)
  })

  return ranked.map((item) => mapProduct(item, categoriesById))
}

export async function getProductDetailsBySlug(rawSlug: string): Promise<ProductDetailsResult | null> {
  const slug = productSlugSchema.safeParse(rawSlug)
  if (!slug.success) return null

  const pb = createServerPb()
  const escapedSlug = escapePbString(slug.data)

  let record: PocketBaseRecord
  try {
    const rec = await pb.collection('products').getFirstListItem(
      `slug="${escapedSlug}" && isActive=true `,
      {
        fields:
          'id,slug,sku,name,price,promoPrice,isActive,inView,description,images,currency,categories,category,isNew,isVariant,isParent,parent,variantKey,details,stock,related_products,updated',
        requestKey: null,
      }
    )
    record = rec as unknown as PocketBaseRecord
  } catch {
    return null
  }

  const categories = await getCachedCategories()
  const categoriesById = new Map(categories.map((category) => [category.id, category]))
  const base = mapProduct(record, categoriesById)
  const availability: ProductAvailability = {
    stock: base.stock,
    inStock: base.inStock,
  }
  const detailsRaw: ProductDetailRecord[] = Array.isArray(record.details)
    ? (record.details as ProductDetailRecord[])
    : []
  const details = detailsRaw
    .filter((item): item is { label: string; value: string } => {
      return (
        !!item &&
        typeof item === 'object' &&
        typeof item.label === 'string' &&
        typeof item.value === 'string'
      )
    })
    .map((item) => ({ label: item.label, value: item.value }))

  const categoryName =
    base.categories.length > 0
      ? categories.find((cat) => base.categories.includes(cat.id))?.name ?? ''
      : ''

  const preferredRelatedIds = normalizeRelationIds(record, 'related_products')
  const { variants, variantUrlMap, variantValuesMap } = await getVariantsAndValues(record, categoriesById)
  const explicitRelatedProducts = await getExplicitRelatedProducts(base, preferredRelatedIds, categoriesById)
  const relatedProducts = await getRelatedProducts(base, categoriesById, preferredRelatedIds)

  return {
    product: {
      ...base,
      details,
      image: base.imageUrls[0] ?? '/aboutimg.webp',
    },
    categories,
    categoryName,
    imageUrls: base.imageUrls.length > 0 ? base.imageUrls : ['/aboutimg.webp'],
    availability,
    variants,
    variantUrlMap,
    variantValuesMap,
    explicitRelatedProducts,
    relatedProducts,
  }
}
