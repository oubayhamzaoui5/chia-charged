import { z } from 'zod'

function coerceVariantKey(value: unknown): Record<string, unknown> | null | unknown {
  if (value == null) return null

  if (!Array.isArray(value)) return value

  const out: Record<string, unknown> = {}

  for (const item of value) {
    if (!item || typeof item !== 'object') continue

    const maybeKey = (item as { key?: unknown }).key
    const maybeValue = (item as { value?: unknown }).value

    if (typeof maybeKey !== 'string' || maybeKey.length === 0) continue
    out[maybeKey] = maybeValue ?? null
  }

  return out
}

function coerceDetails(
  value: unknown
): Array<{ label: string; value: string }> {
  let parsed: unknown = value

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed)) return []

  return parsed
    .map((item) => {
      if (!item || typeof item !== 'object') return null

      const label =
        'label' in item ? String((item as { label?: unknown }).label ?? '').trim() : ''
      const detailValue =
        'value' in item ? String((item as { value?: unknown }).value ?? '').trim() : ''

      return { label, value: detailValue }
    })
    .filter((item): item is { label: string; value: string } => !!item)
}

// Schema for validating PocketBase responses
export const ProductRecordSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  price: z.union([z.number(), z.string()]).transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ),
  promoPrice: z.union([z.number(), z.string(), z.null()]).transform(val => 
    val == null ? null : typeof val === 'string' ? parseFloat(val) : val
  ),
  isActive: z.boolean().optional().default(true),
  description: z.string().optional().default(''),
  images: z.array(z.string()).optional().default([]),
  currency: z.string().optional().default('DT'),
  category: z.union([
    z.string(),
    z.array(z.string()),
    z.array(z.object({ id: z.string() }))
  ]).optional(),
  inView: z.boolean().optional().default(true),
  isVariant: z.boolean().optional().default(false),
  isParent: z.boolean().optional().default(false),
  parent: z.string().nullable().optional(),
  variantKey: z.preprocess(
    coerceVariantKey,
    z.record(z.string(), z.unknown()).nullable()
  ).optional(),
  details: z.preprocess(
    coerceDetails,
    z
      .array(
        z.object({
          label: z.string().optional().default(''),
          value: z.string().optional().default(''),
        })
      )
      .optional()
      .default([])
  ),
  related_products: z
    .union([z.string(), z.array(z.string()), z.array(z.object({ id: z.string() }))])
    .optional(),
  expand: z.object({
    category: z.any().optional(),
    parent: z.any().optional(),
    related_products: z.any().optional(),
  }).optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
})

export type ProductRecord = z.infer<typeof ProductRecordSchema>

export const CategoryRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  promo: z.union([z.number(), z.string()]).optional(),
  activeAll: z.boolean().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
})

export type CategoryRecord = z.infer<typeof CategoryRecordSchema>

export const VariableRecordSchema = z.object({
  id: z.string(),
  // Legacy shape support
  key: z.string().optional(),
  value: z.string().optional(),
  // Current shape support
  name: z.string().optional(),
  type: z.enum(['color', 'image']).optional(),
  color: z.string().optional(),
  image: z.string().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
})

export type VariableRecord = z.infer<typeof VariableRecordSchema>
