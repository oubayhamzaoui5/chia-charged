'use client'
import { useQuery } from '@tanstack/react-query'
import { EMPTY_STORE_SETTINGS, storeSettingsSchema } from '@/lib/store-settings'

export function useStoreSettings() {
  const query = useQuery({ queryKey: ['store-settings'], staleTime: 0, refetchInterval: 60000,
    queryFn: async () => {
      const response = await fetch('/api/store-settings', { cache: 'no-store' })
      if (!response.ok) throw new Error('Store settings unavailable.')
      return storeSettingsSchema.parse(await response.json())
    },
  })
  return query.isError ? EMPTY_STORE_SETTINGS : query.data ?? EMPTY_STORE_SETTINGS
}
