import { getAdminVariables } from '@/lib/admin/data'
import type { AdminVariableRecord } from '@/lib/admin/data'
import VariablesClient from './variables.client'

export const dynamic = 'force-dynamic'

export default async function AdminVariablesPage() {
  const variables = (await getAdminVariables()).filter(
    (v): v is AdminVariableRecord & { type: 'image' } => v.type === 'image'
  )
  return <VariablesClient variables={variables} />
}
