import 'server-only'

import { createServerPb } from '@/lib/pb'
import { parseShippingPolicy, SHIPPING_RECORD_ID, type ShippingPolicy } from '@/lib/shipping'

export class ShippingError extends Error {
  constructor(message: string, public status: number, public policy?: ShippingPolicy) {
    super(message)
  }
}

export async function getShippingPolicy(): Promise<ShippingPolicy> {
  try {
    const record = await createServerPb().collection('shipping_settings').getOne(SHIPPING_RECORD_ID, {
      fields: 'rateCents,version', requestKey: null, cache: 'no-store',
    })
    return parseShippingPolicy(record)
  } catch {
    throw new ShippingError('Shipping is temporarily unavailable. Please try again.', 503)
  }
}

export async function quoteShipping(country: string, version: unknown): Promise<ShippingPolicy> {
  if (country.trim().toUpperCase() !== 'US') {
    throw new ShippingError('We currently deliver within the United States only.', 400)
  }
  const policy = await getShippingPolicy()
  if (version !== policy.version) {
    throw new ShippingError('The shipping rate has changed. Review the updated total and try again.', 409, policy)
  }
  return policy
}
