import { getPb } from '../pb'
import type { ID, Product } from '@/types/product.types'

const COLLECTION = 'products'

/* ---------------- CREATE ---------------- */

export async function createProduct(fd: FormData) {
  const pb = getPb()
  return pb.collection(COLLECTION).create(fd)
}

/* ---------------- UPDATE ---------------- */

export async function updateProduct(id: ID, fd: FormData) {
  const pb = getPb()
  return pb.collection(COLLECTION).update(id, fd)
}

/* ---------------- DELETE ---------------- */

export async function deleteProductApi(id: ID) {
  const pb = getPb()
  return pb.collection(COLLECTION).delete(id)
}

/* ---------------- GET ONE ---------------- */

export async function getProduct(id: ID) {
  const pb = getPb()
  return pb.collection(COLLECTION).getOne<Product>(id)
}

/* ---------------- VARIANT ---------------- */

export async function updateVariantKeyApi(
  id: ID,
  variantKey: Record<string, string | null>
) {
  const pb = getPb()
  return pb.collection(COLLECTION).update(id, { variantKey })
}
