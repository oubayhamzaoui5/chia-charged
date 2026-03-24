import 'server-only'
import { getPb } from '@/lib/pb'

export async function listProducts({ limit = 24, filter = 'isActive=true' } = {}) {
  const pb = getPb()
  return pb.collection('products').getList(1, limit, { filter, expand: 'category' })
}

export async function getProductBySlug(slug: string) {
  const pb = getPb()
  return pb.collection('products').getFirstListItem(`slug="${slug}" && isActive=true`, { expand: 'category' })
}
