import PocketBase from 'pocketbase'

let clientPb: PocketBase | null = null

export function createServerPb() {
  const serverUrl =
    process.env.POCKETBASE_URL ??
    process.env.NEXT_PUBLIC_PB_URL ??
    'http://127.0.0.1:8090'

  const pb = new PocketBase(serverUrl)
  pb.autoCancellation(false)
  return pb
}

export function getPb(_persistSession = false) {
  // Never share auth state across server requests.
  if (typeof window === 'undefined') {
    return createServerPb()
  }

  if (clientPb) return clientPb

  const clientUrl =
    process.env.NEXT_PUBLIC_PB_URL ??
    process.env.POCKETBASE_URL ??
    'http://127.0.0.1:8090'

  clientPb = new PocketBase(clientUrl)
  clientPb.autoCancellation(false)

  return clientPb
}

export const getClientPb = getPb
