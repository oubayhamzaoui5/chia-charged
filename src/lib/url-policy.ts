function origin(value: string | undefined, name: string, allowLoopback: boolean): string {
  let url: URL
  try { url = new URL(value ?? '') } catch { throw new Error(`${name} must be an absolute origin.`) }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
    (url.protocol !== 'https:' && !(allowLoopback && local && url.protocol === 'http:'))) {
    throw new Error(`${name} must use HTTPS, without credentials, path, query or fragment. HTTP is allowed only for supported loopback connections.`)
  }
  return url.origin
}
export function getAppOrigin(): string {
  const production = process.env.NODE_ENV === 'production'
  const result = origin(process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? (production ? undefined : 'http://localhost:3000'), 'APP_URL', !production)
  if (process.env.NEXT_PUBLIC_SITE_URL && origin(process.env.NEXT_PUBLIC_SITE_URL, 'NEXT_PUBLIC_SITE_URL', !production) !== result) throw new Error('APP_URL and NEXT_PUBLIC_SITE_URL must use the same origin.')
  return result
}
export function getServerPbOrigin(): string {
  const production = process.env.NODE_ENV === 'production'
  return origin(process.env.POCKETBASE_URL ?? (production ? undefined : process.env.NEXT_PUBLIC_PB_URL ?? 'http://127.0.0.1:8090'), 'POCKETBASE_URL', true)
}
export function getPublicPbOrigin(): string {
  const production = process.env.NODE_ENV === 'production'
  return origin(process.env.NEXT_PUBLIC_PB_URL ?? (production ? undefined : 'http://127.0.0.1:8090'), 'NEXT_PUBLIC_PB_URL', !production)
}
