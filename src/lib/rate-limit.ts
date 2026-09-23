// Shared production limits require Redis; local preview uses bounded in-process fallback.
import Redis from 'ioredis'
import { isIP } from 'node:net'

let redis: Redis | null = null
let lastFailureLog = 0
const localWindows = new Map<string, { count: number; resetAt: number }>()
const incrementScript = `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`


function getRedis(): Redis {
  if (!redis) {
    const options = { lazyConnect: true, enableOfflineQueue: true, maxRetriesPerRequest: 1, connectTimeout: 1000, commandTimeout: 1500 }
    redis = process.env.REDIS_URL
      ? new Redis(process.env.REDIS_URL, options)
      : new Redis({ ...options, host: process.env.REDIS_HOST ?? 'localhost', port: Number(process.env.REDIS_PORT ?? 6379), password: process.env.REDIS_PASSWORD || undefined })
    redis.on('error', () => {
      // Suppress unhandled error events — failures are handled in rateLimit()
    })
  }
  return redis
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const resetAt = now + windowMs
  if (!Number.isSafeInteger(limit) || limit < 1 || !Number.isSafeInteger(windowMs) || windowMs < 1) throw new Error('Invalid rate limit configuration.')

  try {
    const client = getRedis()
    const redisKey = `rl:${key}`

    // Count and expiry share one atomic operation; interrupted clients cannot leave permanent keys.
    const result = await client.eval(incrementScript, 1, redisKey, windowMs) as [number, number]
    const [count, ttl] = result
    const actualResetAt = now + ttl

    if (count > limit) {
      return { allowed: false, remaining: 0, resetAt: actualResetAt }
    }

    return { allowed: true, remaining: limit - count, resetAt: actualResetAt }
  } catch {
    if (process.env.NODE_ENV === 'production') {
      if (now - lastFailureLog > 60000) { console.error('Rate limiter unavailable; protected requests blocked. Check Redis.'); lastFailureLog = now }
      return { allowed: false, remaining: 0, resetAt }
    }
    for (const [entryKey, entry] of localWindows) if (entry.resetAt <= now) localWindows.delete(entryKey)
    const entry = localWindows.get(key) ?? { count: 0, resetAt }
    if (!localWindows.has(key) && localWindows.size >= 10000) return { allowed: false, remaining: 0, resetAt }
    entry.count += 1; localWindows.set(key, entry)
    return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt }
  }
}

export function getClientIp(request: Request): string {
  // Enable only behind an ingress which replaces these headers and blocks direct access.
  if (process.env.TRUST_PROXY_HEADERS !== 'true') return 'unknown'
  const raw = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? ''
  return isIP(raw) ? raw : 'unknown'
}
