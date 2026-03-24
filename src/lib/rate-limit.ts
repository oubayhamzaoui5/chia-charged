/**
 * Simple in-memory rate limiter.
 * Works reliably for single-server deployments.
 * For multi-instance / serverless, swap the store for Upstash Redis.
 */

type Entry = {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Purge expired entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
  if (cleanupTimer !== null) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, CLEANUP_INTERVAL_MS)

  // Allow Node.js to exit even if the timer is still active
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    (cleanupTimer as { unref(): void }).unref()
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  ensureCleanup()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}
