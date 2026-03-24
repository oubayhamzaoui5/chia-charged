import { getAdminVariables } from '@/lib/admin/data'
import VariablesClient from './variables.client'

export const dynamic = 'force-dynamic'

export default async function AdminVariablesPage() {
  const variables = await getAdminVariables()
  return <VariablesClient variables={variables} />
}
