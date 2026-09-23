export type CategoryPromotion = { id: string; percent: number; active: boolean }
export type CatalogPrice = {
  baseUnitPriceCents: number
  unitPriceCents: number
  discount: { type: 'none' | 'product' | 'category'; amountCents: number; categoryId?: string; percent?: number }
}

function cents(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const result = Math.round(value * 100)
  return Number.isSafeInteger(result) && Math.abs(value * 100 - result) <= 1e-7 ? result : null
}

export function catalogCategoryIds(value: unknown) {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
  return [...new Set(values.map(String).filter(id => /^[A-Za-z0-9]{15}$/.test(id)))]
}

export function resolveCatalogPrice(basePrice: number, directPromoPrice: number | null, categories: CategoryPromotion[]): CatalogPrice | null {
  const baseUnitPriceCents = cents(basePrice)
  if (baseUnitPriceCents === null || baseUnitPriceCents <= 0) return null
  const overriding = categories.filter(category => category.active)
  if (overriding.length > 0) {
    let best: { cents: number; category: CategoryPromotion } | undefined
    for (const category of overriding) {
      if (!Number.isFinite(category.percent) || category.percent <= 0 || category.percent >= 100) continue
      const candidate = Math.round(baseUnitPriceCents * (100 - category.percent) / 100)
      if (candidate > 0 && candidate < baseUnitPriceCents && (!best || candidate < best.cents)) best = { cents: candidate, category }
    }
    if (best) return {
      baseUnitPriceCents, unitPriceCents: best.cents,
      discount: { type: 'category', amountCents: baseUnitPriceCents - best.cents, categoryId: best.category.id, percent: best.category.percent },
    }
    return { baseUnitPriceCents, unitPriceCents: baseUnitPriceCents, discount: { type: 'none', amountCents: 0 } }
  }
  const promoCents = directPromoPrice === null ? null : cents(directPromoPrice)
  if (promoCents !== null && promoCents > 0 && promoCents < baseUnitPriceCents) {
    return { baseUnitPriceCents, unitPriceCents: promoCents, discount: { type: 'product', amountCents: baseUnitPriceCents - promoCents } }
  }
  return { baseUnitPriceCents, unitPriceCents: baseUnitPriceCents, discount: { type: 'none', amountCents: 0 } }
}
