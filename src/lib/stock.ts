import { getPb } from '@/lib/pb'

type StockMap = Record<string, boolean>

function escapePbString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Given a list of product IDs, returns { productId: inStock } using products.stock > 0.
 */
export async function getProductsStockMap(productIds: string[]): Promise<StockMap> {
  if (productIds.length === 0) return {}

  const safeIds = Array.from(
    new Set(productIds.filter((id) => /^[a-zA-Z0-9]{15}$/.test(id)))
  )
  if (safeIds.length === 0) return {}

  const pb = getPb()
  const filter = safeIds.map((id) => `id="${escapePbString(id)}"`).join(' || ')

  const records = await pb.collection('products').getFullList(500, {
    filter,
    fields: 'id,stock',
    requestKey: null,
  })

  const map: StockMap = {}
  for (const record of records as Array<{ id: string; stock?: number }>) {
    map[String(record.id)] = Number(record.stock ?? 0) > 0
  }

  for (const id of safeIds) {
    if (map[id] === undefined) {
      map[id] = false
    }
  }

  return map
}

