'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

import { Switch } from '@/components/ui/switch'

const STORAGE_ENABLED_KEY = 'admin:order-notifications:enabled'
const STORAGE_LAST_ID_KEY = 'admin:order-notifications:last-order-id'
const POLL_MS = 5000
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? ''

type LatestOrder = {
  id: string
  created: string
  total: number
  currency: string
  customerName: string
} | null

function readEnabledFlag(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(STORAGE_ENABLED_KEY) === '1'
}

function writeEnabledFlag(value: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_ENABLED_KEY, value ? '1' : '0')
}

function readLastSeenOrderId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_LAST_ID_KEY)
}

function writeLastSeenOrderId(orderId: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_LAST_ID_KEY, orderId)
}

async function getLatestOrder(): Promise<LatestOrder> {
  const res = await fetch('/api/admin/orders/latest', {
    method: 'GET',
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = (await res.json()) as { order?: LatestOrder }
  return data.order ?? null
}

function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  const normalized = String(base64Url ?? '').trim()
  const base64 = normalized.replace(/-/g, '+').replace(/_/g, '/')
  const remainder = base64.length % 4
  const requiredPad = remainder === 0 ? 0 : 4 - remainder
  const safePadCount = Number.isFinite(requiredPad) ? Math.max(0, Math.min(3, requiredPad)) : 0
  const pad = '='.repeat(safePadCount)
  const raw = window.atob(`${base64}${pad}`)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i)
  }
  return output.buffer
}

async function registerPushSubscription() {
  if (typeof window === 'undefined') {
    throw new Error('Client only')
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker non supporte sur ce navigateur')
  }

  if (!('PushManager' in window)) {
    throw new Error('Push API non supportee sur ce navigateur')
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error('Cle VAPID publique manquante')
  }

  const registration = await navigator.serviceWorker.register('/admin-order-notifications-sw.js', {
    scope: '/',
  })

  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToArrayBuffer(VAPID_PUBLIC_KEY),
    }))

  const res = await fetch('/api/admin/push-subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  })

  if (!res.ok) {
    throw new Error('Failed to register push subscription')
  }
}

async function unregisterPushSubscription() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.getRegistration('/')
  const subscription = await registration?.pushManager.getSubscription()

  if (subscription) {
    await fetch('/api/admin/push-subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })
    await subscription.unsubscribe()
  }
}

function useOrderNotificationsListener(enabled: boolean) {
  const pollLatest = useCallback(async () => {
    if (!enabled || typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    // Avoid duplicate alerts: if Web Push is active, the service worker owns notifications.
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.getRegistration('/')
      const activeSubscription = await registration?.pushManager.getSubscription()
      if (activeSubscription) return
    }

    const latest = await getLatestOrder()
    if (!latest?.id) return

    const lastSeenId = readLastSeenOrderId()
    if (!lastSeenId) {
      writeLastSeenOrderId(latest.id)
      return
    }
    if (lastSeenId === latest.id) return

    writeLastSeenOrderId(latest.id)

    const amount = `${latest.total.toFixed(2)} ${latest.currency}`
    const notification = new Notification('New Order', {
      body: `${latest.customerName} placed an order (${amount}).`,
      tag: `order-${latest.id}`,
    })

    notification.onclick = () => {
      window.focus()
      window.location.href = '/admin/orders'
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    let mounted = true
    const tick = async () => {
      if (!mounted) return
      try {
        await pollLatest()
      } catch (error) {
        console.error('Order notifications polling failed:', error)
      }
    }

    void tick()
    const timer = window.setInterval(() => {
      void tick()
    }, POLL_MS)

    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [enabled, pollLatest])
}

export function OrderNotificationsControl() {
  const [enabled, setEnabled] = useState(false)
  const [info, setInfo] = useState('Desactive par defaut')

  useEffect(() => {
    const initialEnabled = readEnabledFlag()
    setEnabled(initialEnabled)
    if (initialEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      writeEnabledFlag(false)
      setEnabled(false)
      setInfo('Permission non accordee, notifications desactivees')
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_ENABLED_KEY) {
        setEnabled(event.newValue === '1')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const permissionText = useMemo(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'Notifications non supportees'
    if (Notification.permission === 'granted') return 'Permission accordee'
    if (Notification.permission === 'denied') return 'Permission refusee'
    return 'Permission requise'
  }, [enabled])

  const onToggle = async (checked: boolean) => {
    if (!checked) {
      await unregisterPushSubscription()
      writeEnabledFlag(false)
      setEnabled(false)
      setInfo('Notifications desactivees')
      return
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      writeEnabledFlag(false)
      setEnabled(false)
      setInfo('Ce navigateur ne supporte pas les notifications')
      return
    }

    const permission =
      Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission

    if (permission !== 'granted') {
      writeEnabledFlag(false)
      setEnabled(false)
      setInfo('Permission refusee, notifications desactivees')
      return
    }

    try {
      await registerPushSubscription()

      const latest = await getLatestOrder()
      if (latest?.id) writeLastSeenOrderId(latest.id)

      writeEnabledFlag(true)
      setEnabled(true)
      setInfo('Notifications actives sur cet appareil, meme en arriere plan')
    } catch (error) {
      console.error('Push registration failed:', error)
      writeEnabledFlag(false)
      setEnabled(false)
      setInfo('Activation impossible: verification de la configuration push requise')
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            {enabled ? <Bell className="h-4 w-4 text-emerald-600" /> : <BellOff className="h-4 w-4 text-slate-500" />}
            Order Notifications
          </div>
          <p className="text-xs text-slate-500">{permissionText}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      <p className="mt-2 text-xs text-slate-500">{info}</p>
    </div>
  )
}

export function OrderNotificationsListener() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const active = readEnabledFlag()
    if (active && typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      writeEnabledFlag(false)
      setEnabled(false)
      return
    }
    setEnabled(active)

    if (active) {
      void registerPushSubscription().catch((error) => {
        console.error('Push re-subscription failed:', error)
      })
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_ENABLED_KEY) {
        setEnabled(event.newValue === '1')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useOrderNotificationsListener(enabled)
  return null
}
