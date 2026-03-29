'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Skip admin and API paths
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return

    const payload = JSON.stringify({ path: pathname })

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
