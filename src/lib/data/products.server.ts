import { cache } from 'react'
import { getPb } from '@/lib/pb'
import { 
  ProductRecordSchema, 
  CategoryRecordSchema,
  VariableRecordSchema,
  type ProductRecord 
} from '@/types/product.server.types'
import type { Product, CategoryOption, Variable } from '@/types/product.types'

function buildPbFileUrl(collection: string, id: string, file?: string): string | undefined {
  if (!file || !file.trim()) return undefined
  const base =
    process.env.NEXT_PUBLIC_PB_URL ??
    process.env.POCKETBASE_URL ??
    'http://127.0.0.1:8090'
  return `${base}/api/files/${collection}/${id}/${file}`
}

/**
 * Normalize category/parent relations to array of IDs
 */
function normalizeRelationIds(p: unknown): string[] {
  if (!p) return []
  if (Array.isArray(p)) {
    return p
      .map((item) => {
        if (typeof item === 'string') return item
        if (typeof item === 'object' && item && 'id' in item) {
          return String((item as { id: unknown }).id ?? '')
        }
        return ''
      })
      .filter((value): value is string => Boolean(value))
  }
  if (typeof p === 'string') return [p]
  if (typeof p === 'object' && p && 'id' in p) {
    return [String((p as { id: unknown }).id ?? '')].filter(Boolean)
  }
  return []
}

function buildCategoryPromoMap(
  categories: Array<Record<string, unknown>>
): Map<string, { promo: number; activeAll: boolean }> {
  return new Map(
    categories.map((c) => [
      String(c.id ?? ''),
      {
        promo: Number(c.promo ?? 0),
        activeAll: Boolean(c.activeAll),
      },
    ])
  )
}

function resolvePromoPrice(
  price: number,
  productPromo: number | null,
  categoryIds: string[],
  categoryPromoById?: Map<string, { promo: number; activeAll: boolean }>
): number | null {
  const directPromo = productPromo != null && productPromo > 0 && productPromo < price ? productPromo : null
  if (!categoryPromoById || categoryIds.length === 0) return directPromo

  const overriding = categoryIds
    .map((id) => categoryPromoById.get(id))
    .filter((c): c is { promo: number; activeAll: boolean } => !!c && c.activeAll)

  if (overriding.length === 0) return directPromo

  let best: number | null = null
  for (const cat of overriding) {
    const pct = Number(cat.promo ?? 0)
    if (!Number.isFinite(pct) || pct <= 0) continue
    const safePct = Math.min(100, Math.max(0, pct))
    const candidate = Number((price * (1 - safePct / 100)).toFixed(2))
    if (candidate <= 0 || candidate >= price) continue
    if (best == null || candidate < best) best = candidate
  }

  return best
}

/**
 * Transform validated PocketBase record to client Product type
 */
function normalizeProduct(
  r: ProductRecord,
  categoryPromoById?: Map<string, { promo: number; activeAll: boolean }>
): Product {
  const categoryIds = normalizeRelationIds(r.expand?.category ?? r.category)
  const price = r.price
  const promoPrice = resolvePromoPrice(price, r.promoPrice, categoryIds, categoryPromoById)

  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    price,
    promoPrice,
    isActive: r.isActive,
    description: r.description,
    images: r.images,
    currency: r.currency,
    categories: categoryIds,
    inView: r.inView,
    isVariant: r.isVariant,
    isParent: r.isParent,
    parent: r.parent ?? null,
    variantKey: r.variantKey ?? null,
    details: Array.isArray(r.details)
      ? r.details
          .map((item) => ({
            label: String(item.label ?? '').trim(),
            value: String(item.value ?? '').trim(),
          }))
          .filter((item) => item.label || item.value)
      : [],
    relatedProducts: normalizeRelationIds(r.related_products ?? r.expand?.related_products),
  }
}

/**
 * Fetch products with categories - cached for better performance
 */
export const getProductsWithCategories = cache(async (): Promise<{
  products: Product[]
  categories: CategoryOption[]
  totalItems: number
}> => {
  const pb = getPb()

  try {
    // Fetch products and categories in parallel
    const [productsRes, categoriesRes] = await Promise.all([
      pb.collection('products').getFullList(2000, {
        sort: '-created',
        expand: 'parent,category',
      }),
      pb.collection('categories').getFullList(200, {
        sort: 'name',
      }),
    ])

    // Validate and transform categories
    const categories: CategoryOption[] = categoriesRes.map((c) => {
      const validated = CategoryRecordSchema.parse(c)
      return {
        id: validated.id,
        name: validated.name,
      }
    })
    const categoryPromoById = buildCategoryPromoMap(
      categoriesRes as unknown as Array<Record<string, unknown>>
    )

    // Validate and transform products
    const products = productsRes
      .map((r) => {
        const parsed = ProductRecordSchema.safeParse(r)
        if (!parsed.success) {
          console.warn('Skipping invalid product record:', parsed.error.flatten())
          return null
        }
        return normalizeProduct(parsed.data, categoryPromoById)
      })
      .filter((p): p is Product => p !== null)

    // Filter top-level products only
    const topLevelProducts = products.filter(
      (p) => !p.isVariant || p.isParent
    )

    return {
      products: topLevelProducts,
      categories,
      totalItems: topLevelProducts.length,
    }
  } catch (error) {
    console.error('Error fetching products with categories:', error)
    throw new Error('Failed to fetch products and categories')
  }
})

/**
 * Fetch single product by ID
 */
export const getProductById = cache(async (id: string): Promise<Product | null> => {
  const pb = getPb()

  try {
    const [record, categoriesRes] = await Promise.all([
      pb.collection('products').getOne(id, {
        expand: 'parent,category',
      }),
      pb.collection('categories').getFullList(200, { sort: 'name' }),
    ])

    const categoryPromoById = buildCategoryPromoMap(
      categoriesRes as unknown as Array<Record<string, unknown>>
    )

    const validated = ProductRecordSchema.parse(record)
    return normalizeProduct(validated, categoryPromoById)
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error)
    return null
  }
})

/**
 * Fetch parent product with all its variants
 */
export const getParentProductWithVariants = cache(async (
  parentId: string
): Promise<{
  parent: Product | null
  variants: Product[]
  categories: CategoryOption[]
  variables: Variable[]
}> => {
  const pb = getPb()

  try {
    // Fetch parent, variants, categories, and variables in parallel
    const [parentRecord, variantsRes, categoriesRes, variablesRes] = await Promise.all([
      pb.collection('products').getOne(parentId, {
        expand: 'category',
      }),
      pb.collection('products').getFullList(200, {
        filter: `parent = "${parentId}"`,
        expand: 'category',
      }),
      pb.collection('categories').getFullList(200, {
        sort: 'name',
      }),
      pb.collection('variables').getFullList(200),
    ])

    // Validate and transform parent
    const categoryPromoById = buildCategoryPromoMap(
      categoriesRes as unknown as Array<Record<string, unknown>>
    )
    const validatedParent = ProductRecordSchema.parse(parentRecord)
    const parent = normalizeProduct(validatedParent, categoryPromoById)

    // Validate and transform variants
    const variants = variantsRes.map((r) => {
      const validated = ProductRecordSchema.parse(r)
      return normalizeProduct(validated, categoryPromoById)
    })

    // Validate and transform categories
    const categories = categoriesRes.map((c) => {
      const validated = CategoryRecordSchema.parse(c)
      return {
        id: validated.id,
        name: validated.name,
      }
    })

    // Validate and transform variables
    const variables = variablesRes
      .map((v) => {
        const parsed = VariableRecordSchema.safeParse(v)
        if (!parsed.success) {
          console.warn('Skipping invalid variable record:', parsed.error.flatten())
          return null
        }

        const validated = parsed.data
        const type: Variable['type'] =
          validated.type ??
          (validated.image ? 'image' : validated.color ? 'color' : 'color')

        return {
          id: validated.id,
          name: validated.name ?? validated.key ?? '',
          type,
          color: validated.color,
          image: type === 'image' ? buildPbFileUrl('variables', validated.id, validated.image) : undefined,
        }
      })
      .filter((v): v is NonNullable<typeof v> => v !== null)

    return {
      parent,
      variants,
      categories,
      variables,
    }
  } catch (error) {
    console.error(`Error fetching parent product ${parentId}:`, error)
    throw new Error('Failed to fetch parent product with variants')
  }
})

/**
 * Get all categories (cached)
 */
export const getAllCategories = cache(async (): Promise<CategoryOption[]> => {
  const pb = getPb()

  try {
    const categoriesRes = await pb.collection('categories').getFullList(200, {
      sort: 'name',
    })

    return categoriesRes.map((c) => {
      const validated = CategoryRecordSchema.parse(c)
      return {
        id: validated.id,
        name: validated.name,
      }
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw new Error('Failed to fetch categories')
  }
})
