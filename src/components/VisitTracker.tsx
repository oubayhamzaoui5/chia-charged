'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

function getVisitorId(): string {
  try {
    const key = 'visitor_id'
    let id = localStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return 'unknown'
  }
}

export default function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return

    const visitorId = getVisitorId()
    const payload = JSON.stringify({ path: pathname, visitorId })

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/track-visit',
        new Blob([payload], { type: 'application/json' })
      )
    } else {
      fetch('/api/track-visit', {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {})
    }
  }, [pathname])

  return null
}
