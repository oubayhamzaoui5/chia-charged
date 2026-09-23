import PocketBase from 'pocketbase'
import { getServerPbOrigin, getPublicPbOrigin } from '@/lib/url-policy'

let clientPb: PocketBase | null = null

export function createServerPb() {
  const serverUrl = getServerPbOrigin()

  const pb = new PocketBase(serverUrl)
  pb.autoCancellation(false)
  // Never resend authentication bodies to a redirect target.
  pb.beforeSend = (url, options) => ({ url, options: { ...options, redirect: 'error' } })
  return pb
}

export function getPb(_persistSession = false) {
  // Never share auth state across server requests.
  if (typeof window === 'undefined') {
    return createServerPb()
  }

  if (clientPb) return clientPb

  const clientUrl = getPublicPbOrigin()

  clientPb = new PocketBase(clientUrl)
  clientPb.autoCancellation(false)

  return clientPb
}

export const getClientPb = getPb
