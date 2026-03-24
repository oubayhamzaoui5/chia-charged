// src/lib/api/products.pb.ts
import 'server-only'
import { cookies, headers } from 'next/headers'
import PocketBase from 'pocketbase'

const PB_URL = process.env.NEXT_PUBLIC_PB_URL!

/**
 * If you set PB_ADMIN_TOKEN in your env (admin auth token),
 * we'll include it to fetch ALL products (draft/archived too).
 * Otherwise, we fall back to public rule (isActive=true).
 */
function getServerPb() {
  const pb = new PocketBase(PB_URL)
  const adminToken = process.env.PB_ADMIN_TOKEN
  if (adminToken) {
    pb.authStore.save(adminToken, null as any) // bearer token
  }
  return pb
}

export type PBProduct = {
  id: string
  sku: string
  name: string
  slug: string
  description?: string
  price: number
  currency?: string
  category?: string // id
  images?: string[] // file names
  isActive?: boolean
  status?: 'draft' | 'active' | 'archived'
  promoPrice?: number | null
  // PocketBase adds:
  expand?: Record<string, any>
  collectionId?: string
  collectionName?: string
  created?: string
  updated?: string
}

type PBList<T> = { page: number; perPage: number; totalItems: number; items: T[] }

/** Best practice: small wrapper with safe default filter if no admin token */
export async function listProductsForAdminUI(opts?: {
  page?: number
  perPage?: number
  search?: string
  sort?: string // e.g. 'name' or '-price'
}) {
  const { page = 1, perPage = 50, search, sort } = opts ?? {}
  const pb = getServerPb()

  // If we have admin token → no filter (see your rules)
  // Else → only active products to respect public rules.
  const hasAdmin = !!process.env.PB_ADMIN_TOKEN
  const baseFilter = hasAdmin ? 'id != ""' : 'isActive = true'

  const searchFilter = search
    ? `&& (name ~ "${search}" || sku ~ "${search}")`
    : ''

  const filter = `${baseFilter} ${searchFilter}`

  const res = (await pb
    .collection('products')
    .getList<PBProduct>(page, perPage, {
      filter,
      sort: sort ?? 'name',
      expand: 'category',
    })) as unknown as PBList<PBProduct>

  return res
}
