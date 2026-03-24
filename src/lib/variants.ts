// lib/variants.ts
import type { Product } from "@/types/product.types"

export function getVariantLinks(
  parentId: string,
  products: Product[]
) {
  // get all variants of the parent
  const variants = products.filter((p) => p.parent === parentId)

  if (variants.length === 0) return {}

  // build key => values mapping
  const keys: Record<string, { value: string; id: string }[]> = {}

  for (const v of variants) {
    for (const [key, val] of Object.entries(v.variantKey ?? {})) {
      if (!keys[key]) keys[key] = []
      const safeValue = String(val)
      // prevent duplicates
      if (!keys[key].some((x) => x.value === safeValue)) {
        keys[key].push({ value: safeValue, id: v.id })
      }
    }
  }

  return keys
}
