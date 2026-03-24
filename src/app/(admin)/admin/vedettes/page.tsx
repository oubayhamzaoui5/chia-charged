import { getAdminVedettesData } from '@/lib/admin/data'
import VedettesClient from './vedettes.client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminVedettesPage() {
  const { vedettes, products } = await getAdminVedettesData()
  return <VedettesClient initialVedettes={vedettes} allProducts={products} />
}
