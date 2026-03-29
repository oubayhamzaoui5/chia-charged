/**
 * Redis-backed rate limiter using local Redis (redis://localhost:6379).
 * Works correctly across multiple processes/instances on the same server.
 * Falls back to allowing the request if Redis is unavailable.
 */

import Redis from 'ioredis'

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    })
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
  const windowSecs = Math.ceil(windowMs / 1000)

  try {
    const client = getRedis()
    const redisKey = `rl:${key}`

    // INCR atomically increments (creates key at 0 if missing, then increments to 1)
    const count = await client.incr(redisKey)

    // Set expiry only on first request in the window
    if (count === 1) {
      await client.expire(redisKey, windowSecs)
    }

    // Get remaining TTL to compute resetAt accurately
    const ttl = await client.pttl(redisKey)
    const actualResetAt = ttl > 0 ? now + ttl : resetAt

    if (count > limit) {
      return { allowed: false, remaining: 0, resetAt: actualResetAt }
    }

    return { allowed: true, remaining: limit - count, resetAt: actualResetAt }
  } catch {
    // If Redis is down, fail open (allow the request) to avoid blocking all users
    return { allowed: true, remaining: limit, resetAt }
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}
