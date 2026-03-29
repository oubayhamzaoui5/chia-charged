import { requireAdmin } from '@/lib/auth'
import SettingsClient from './settings.client'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const session = await requireAdmin()
  return <SettingsClient user={session.user} />
}
