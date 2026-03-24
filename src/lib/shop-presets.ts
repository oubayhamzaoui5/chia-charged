export type ShopSearchParams = Record<string, string | string[] | undefined>
export type NormalizedShopSearchParams = Record<string, string>

export type ShopPreset = 'nouveautes' | 'promotions' | 'wishlist'

const PRESET_PATHS: Record<ShopPreset, string> = {
  nouveautes: '/Nouveautes',
  promotions: '/Promotions',
  wishlist: '/Wishlist',
}

const PRESET_QUERY_KEYS: Record<ShopPreset, string[]> = {
  nouveautes: ['sort', 'nouveautes'],
  promotions: ['promotions'],
  wishlist: ['wishlist'],
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export function normalizeShopSearchParams(searchParams: ShopSearchParams): NormalizedShopSearchParams {
  const normalized: NormalizedShopSearchParams = {}
  for (const [key, value] of Object.entries(searchParams)) {
    const current = firstParam(value)
    if (current) normalized[key] = current
  }
  return normalized
}

export function detectShopPreset(searchParams: ShopSearchParams): ShopPreset | null {
  const wishlist = firstParam(searchParams.wishlist)
  if (wishlist === '1') return 'wishlist'

  const promotions = firstParam(searchParams.promotions)
  if (promotions === '1') return 'promotions'

  const sort = firstParam(searchParams.sort)
  const nouveautes = firstParam(searchParams.nouveautes)
  if (sort === 'latest' || nouveautes === '1') return 'nouveautes'

  return null
}

export function getShopPresetPath(preset: ShopPreset): string {
  return PRESET_PATHS[preset]
}

export function stripPresetParams(
  searchParams: URLSearchParams,
  preset: ShopPreset
): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString())
  for (const key of PRESET_QUERY_KEYS[preset]) {
    next.delete(key)
  }
  return next
}

export function getPresetInjectedSearchParams(
  preset: ShopPreset
): Record<string, string> {
  if (preset === 'nouveautes') return { sort: 'latest' }
  if (preset === 'promotions') return { promotions: '1' }
  return { wishlist: '1' }
}
