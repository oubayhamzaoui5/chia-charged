import { getAdminCategories } from '@/lib/admin/data'
import CategoriesClient from './categories.client'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const initialCategories = await getAdminCategories()
  return <CategoriesClient initialCategories={initialCategories} />
}
