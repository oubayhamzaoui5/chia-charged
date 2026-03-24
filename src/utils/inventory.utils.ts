export function productImageUrl(id: string, filename: string) {
  const PB_URL = process.env.NEXT_PUBLIC_PB_URL!
  return `${PB_URL}/api/files/products/${id}/${filename}`
}
