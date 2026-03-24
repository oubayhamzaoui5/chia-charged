export type HomeProduct = {
  id: string
  slug: string
  name: string
  price: number
  promoPrice: number | null
  currency: string
  imageUrl: string
  shortDescription: string
  category: string
  inStock: boolean
}

export type HomeProductsResponse = {
  products: HomeProduct[]
}
