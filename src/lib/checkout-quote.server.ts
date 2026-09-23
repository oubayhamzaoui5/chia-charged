import 'server-only'
import { createServerPb } from '@/lib/pb'
import { catalogCategoryIds, resolveCatalogPrice } from '@/lib/catalog-pricing'
import { firstOrderUnitPrice } from '@/lib/store-settings'

export const PRICING_VERSION = 'usd-v1'
export const MAX_DISTINCT_ITEMS = 50
export const MAX_QUANTITY_PER_ITEM = 99
export const MAX_TOTAL_UNITS = 200
export const MAX_ORDER_CENTS = 99_999_999

type IncomingItem = { productId?: unknown; quantity?: unknown }
type CatalogRecord = Record<string, unknown> & { id: string }

export type CheckoutItemSnapshot = {
  productId: string
  name: string
  sku: string
  quantity: number
  currency: 'USD'
  baseUnitPriceCents: number
  unitPriceCents: number
  unitPrice: number
  lineSubtotalCents: number
  discount: { type: 'none' | 'product' | 'category' | 'first-order'; amountCents: number; categoryId?: string; percent?: number }
}

export type CheckoutQuote = {
  pricingVersion: typeof PRICING_VERSION
  currency: 'USD'
  items: CheckoutItemSnapshot[]
  subtotalCents: number
  discountCents: number
  itemsTotalCents: number
  shippingCents: number
  taxCents: 0
  totalCents: number
}

export class CheckoutQuoteError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}

function parseItems(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) throw new CheckoutQuoteError('Cart is empty.')
  if (value.length > MAX_DISTINCT_ITEMS) throw new CheckoutQuoteError('Cart contains too many different products.')
  const seen = new Set<string>()
  let totalUnits = 0
  const items = value.map((raw) => {
    if (!raw || typeof raw !== 'object') throw new CheckoutQuoteError('Invalid cart item.')
    const item = raw as IncomingItem
    const productId = typeof item.productId === 'string' ? item.productId : ''
    const quantity = item.quantity
    if (!/^[A-Za-z0-9]{15}$/.test(productId) || seen.has(productId)) throw new CheckoutQuoteError('Invalid or duplicate product in cart.')
    if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
      throw new CheckoutQuoteError('Invalid product quantity.')
    }
    seen.add(productId); totalUnits += quantity
    return { productId, quantity }
  })
  if (totalUnits > MAX_TOTAL_UNITS) throw new CheckoutQuoteError('Cart contains too many items.')
  return items
}

export async function quoteCheckout(rawItems: unknown, shippingCents: number, firstOrderPercent = 0): Promise<CheckoutQuote> {
  if (!Number.isSafeInteger(shippingCents) || shippingCents < 0 || shippingCents > MAX_ORDER_CENTS) {
    throw new CheckoutQuoteError('Invalid shipping quote.', 503)
  }
  const requested = parseItems(rawItems)
  const ids = requested.map(item => item.productId)
  const catalog = createServerPb()
  const products = await catalog.collection('products').getFullList<CatalogRecord>({
    filter: ids.map(id => `id = '${id}'`).join(' || '),
    fields: 'id,name,sku,price,promoPrice,currency,stock,isActive,inView,category',
    requestKey: null,
  })
  if (products.length !== requested.length) throw new CheckoutQuoteError('A product is unavailable.')

  const categoryIds = [...new Set(products.flatMap(product => catalogCategoryIds(product.category)))]
  const categories = categoryIds.length === 0 ? [] : await catalog.collection('categories').getFullList<CatalogRecord>({
    filter: categoryIds.map(id => `id = '${id}'`).join(' || '), fields: 'id,promo,activeAll', requestKey: null,
  })
  const categoryMap = new Map(categories.map(category => [category.id, category]))
  const productMap = new Map(products.map(product => [product.id, product]))

  const items = requested.map(({ productId, quantity }) => {
    const product = productMap.get(productId)
    if (!product || product.isActive === false) throw new CheckoutQuoteError('A product is unavailable.')
    if (product.currency !== 'USD') throw new CheckoutQuoteError('A product requires currency review.', 503)
    const stock = Number(product.stock)
    if (!Number.isSafeInteger(stock) || stock < quantity) throw new CheckoutQuoteError('Requested quantity is unavailable.', 409)
    const price = resolveCatalogPrice(
      Number(product.price),
      product.promoPrice === null || product.promoPrice === undefined ? null : Number(product.promoPrice),
      catalogCategoryIds(product.category).map(id => {
        const category = categoryMap.get(id)
        return { id, percent: Number(category?.promo ?? 0), active: category?.activeAll === true }
      }),
    )
    if (!price || price.baseUnitPriceCents > MAX_ORDER_CENTS) throw new CheckoutQuoteError('Invalid product price in catalog.', 503)
    const { baseUnitPriceCents } = price
    const unitPriceCents = firstOrderPercent ? firstOrderUnitPrice(baseUnitPriceCents, price.unitPriceCents, firstOrderPercent) : price.unitPriceCents
    const discount: CheckoutItemSnapshot['discount'] = unitPriceCents < price.unitPriceCents
      ? { type: 'first-order', amountCents: baseUnitPriceCents - unitPriceCents, percent: firstOrderPercent }
      : price.discount
    const lineSubtotalCents = unitPriceCents * quantity
    if (!Number.isSafeInteger(lineSubtotalCents)) throw new CheckoutQuoteError('Order amount is too large.')
    return {
      productId, name: String(product.name || 'Product'), sku: String(product.sku || ''), quantity,
      currency: 'USD' as const, baseUnitPriceCents, unitPriceCents, unitPrice: unitPriceCents / 100,
      lineSubtotalCents, discount,
    }
  })

  const subtotalCents = items.reduce((sum, item) => sum + item.baseUnitPriceCents * item.quantity, 0)
  const discountCents = items.reduce((sum, item) => sum + item.discount.amountCents * item.quantity, 0)
  const itemsTotalCents = subtotalCents - discountCents
  const taxCents = 0 as const
  const totalCents = itemsTotalCents + shippingCents + taxCents
  if (!Number.isSafeInteger(totalCents) || totalCents < 1 || totalCents > MAX_ORDER_CENTS) throw new CheckoutQuoteError('Order total is outside supported limits.')
  return { pricingVersion: PRICING_VERSION, currency: 'USD', items, subtotalCents, discountCents, itemsTotalCents, shippingCents, taxCents, totalCents }
}
