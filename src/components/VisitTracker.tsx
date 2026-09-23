'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { isTrackedPath } from '@/lib/visit-path'

export default function VisitTracker() {
  const pathname = usePathname()
  const { analyticsEnabled } = useStoreSettings()
  useEffect(() => {
    if (!analyticsEnabled || !isTrackedPath(pathname) || navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return
    void fetch('/api/track-visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: pathname }), keepalive: true }).catch(() => {})
  }, [pathname, analyticsEnabled])
  return null
}
