export type ProductStock = {
  id: string
  name: string
  sku?: string | null
  images?: string[]
  stock: number
  categories?: string[]
}

export type CategoryOption = {
  id: string
  name: string
}
