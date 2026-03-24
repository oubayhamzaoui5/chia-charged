// Client-side types
export type ID = string
export type ProductDetail = {
  label: string
  value: string
}

export type Product = {
  id: ID
  sku: string
  name: string
  price: number
  promoPrice: number | null
  isActive: boolean
  description: string
  images: string[]
  currency: string
  categories: string[]
  inView: boolean
  isVariant: boolean
  isParent: boolean
  parent: string | null
  variantKey: Record<string, any> | null
  details: ProductDetail[]
  relatedProducts: string[]
  expand?: {
    category?: any
    parent?: any
  }
}

export type CategoryOption = {
  id: string
  name: string
}

export type VariantRef = {
  key: string
  value: string
}

export type EditState = 
  | { mode: 'create' }
  | { mode: 'edit'; id: ID }

export type ParentVariantKey = {
  key: string
  value?: string
}

export type Variable = {
  id: string
  name: string
  type: 'color' | 'image'
  color?: string
  image?: string
}
