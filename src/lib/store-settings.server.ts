import 'server-only'
import { createServerPb } from '@/lib/pb'
import { STORE_SETTINGS_ID, storeSettingsSchema } from '@/lib/store-settings'

export async function getStoreSettings() {
  const record = await createServerPb().collection('store_settings').getOne(STORE_SETTINGS_ID, { requestKey: null })
  return storeSettingsSchema.parse(record)
}
