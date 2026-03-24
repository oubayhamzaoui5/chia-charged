import type { Product } from '@/types/product.types'

export function Price({ p }: { p: Product }) {
  // Only consider promo price if it's > 0 and less than the actual price
  const hasPromo = p.promoPrice != null && p.promoPrice > 0 && p.promoPrice < p.price

  if (!hasPromo) {
    return (
      <span className="font-semibold">
        {p.price.toFixed(2)} {p.currency}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold">
        {p.promoPrice!.toFixed(2)} {p.currency}
      </span>
      <span className="text-xs line-through text-foreground/60">
        {p.price.toFixed(2)} {p.currency}
      </span>
    </div>
  )
}
