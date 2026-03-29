// utils/product.utils.ts
import type { Product } from '@/types/product.types'
import { slugify as sharedSlugify } from '@/utils/slug'

export function slugify(input: string): string {
  return sharedSlugify(input)
}

export function fileUrl(id: string, filename: string): string {
  const PB_URL = process.env.NEXT_PUBLIC_PB_URL ?? ''
  return `${PB_URL}/api/files/products/${id}/${encodeURIComponent(filename)}`
}

export function filePreview(file: File): string {
  return URL.createObjectURL(file)
}

export function getVariantValue(
  variant: Product,
  key: string
): string {
  return variant.variantKey?.[key] ?? ''
}

export function normalizeRelationIds(p: unknown): string[] {
  if (!p) return []
  if (Array.isArray(p)) {
    return p
      .map((item) => (typeof item === 'string' ? item : (item as { id?: string })?.id))
      .filter((v): v is string => !!v)
  }
  if (typeof p === 'string') return [p]
  if (typeof p === 'object' && p && 'id' in p) return [String((p as { id: string }).id)]
  return []
}

export function normalizeFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean)
      }
    } catch {
      return [trimmed]
    }
  }
  return []
}
