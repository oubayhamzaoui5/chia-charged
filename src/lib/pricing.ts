// src/lib/pricing.ts
import type { Product } from "@/types/product.types"
import { resolveCatalogPrice } from "@/lib/catalog-pricing"

export function effectivePrice(p: Product): number {
  const resolved = resolveCatalogPrice(toNum(p.price), p.promoPrice, [])
  return resolved ? resolved.unitPriceCents / 100 : 0
}

export function hasValidPromo(p: Product): boolean {
  const promo = toNum(p.promoPrice)
  const price = toNum(p.price)
  return promo > 0 && promo < price
}

export function discountPercent(p: Product): number {
  if (!hasValidPromo(p)) return 0
  const promo = toNum(p.promoPrice)
  const price = toNum(p.price)
  return Math.round(((price - promo) / price) * 100)
}

function toNum(v: number | null | undefined): number {
  return typeof v === "number" ? v : 0
}
