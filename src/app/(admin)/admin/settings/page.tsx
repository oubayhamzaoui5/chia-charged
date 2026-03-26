import { getGoogleKeysStatusAction } from './actions'
import SettingsClient from './settings.client'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const status = await getGoogleKeysStatusAction()
  return <SettingsClient configured={status.configured} clientIdMasked={status.clientIdMasked} />
}
