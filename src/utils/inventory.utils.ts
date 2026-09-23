export function productImageUrl(id: string, filename: string) {
  return `/api/pb-files/products/${id}/${filename}`
}
