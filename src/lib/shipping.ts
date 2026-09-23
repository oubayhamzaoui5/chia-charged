export type ShippingPolicy = {
  rateCents: number
  version: string
  currency: 'USD'
  country: 'US'
}

export const SHIPPING_RECORD_ID = 'shippingconfig1'
export const MAX_SHIPPING_CENTS = 999999

export function parseShippingRate(value: unknown): number {
  if (typeof value !== 'string' || !/^\d{1,4}(?:\.\d{1,2})?$/.test(value.trim())) {
    throw new Error('Enter a shipping rate from $0.00 to $9,999.99, with at most two decimal places.')
  }
  const cents = Math.round(Number(value.trim()) * 100)
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_SHIPPING_CENTS) {
    throw new Error('Invalid shipping rate.')
  }
  return cents
}

export function parseShippingPolicy(value: unknown): ShippingPolicy {
  if (!value || typeof value !== 'object') throw new Error('Shipping is unavailable.')
  const record = value as Record<string, unknown>
  if (!Number.isSafeInteger(record.rateCents) || Number(record.rateCents) < 0 ||
      Number(record.rateCents) > MAX_SHIPPING_CENTS || typeof record.version !== 'string' || !record.version) {
    throw new Error('Shipping is unavailable.')
  }
  return { rateCents: Number(record.rateCents), version: record.version, currency: 'USD', country: 'US' }
}
