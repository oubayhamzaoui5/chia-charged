import { getAdminInventoryData } from '@/lib/admin/data'
import InventoryClient from './inventory.client'

export const dynamic = 'force-dynamic'

export default async function AdminInventoryPage() {
  const { products, allCategories } = await getAdminInventoryData()
  return <InventoryClient products={products} allCategories={allCategories} />
}
