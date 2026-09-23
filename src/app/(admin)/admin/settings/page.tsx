import { requireAdmin } from '@/lib/auth'
import SettingsClient from './settings.client'
import { getShippingPolicy } from '@/lib/shipping.server'
import { getStoreSettings } from '@/lib/store-settings.server'
import StoreSettingsForm from './store-settings'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const session = await requireAdmin()
  const shippingPolicy = await getShippingPolicy().catch(() => null)
  const storeSettings = await getStoreSettings().catch(() => null)
  return <><SettingsClient user={session.user} shippingPolicy={shippingPolicy} /><div className="mx-auto max-w-2xl px-6 pb-8"><p className="mb-4"><Link className="underline" href="/admin/notifications">View email delivery status</Link></p><StoreSettingsForm initial={storeSettings} /></div></>
}
