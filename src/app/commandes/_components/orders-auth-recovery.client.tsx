'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getClientPb } from '@/lib/pb'

export default function OrdersAuthRecoveryClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const attempted = searchParams.get('authSync') === '1'
      const pb = getClientPb(true)

      if (!pb.authStore.isValid || !pb.authStore.token || !pb.authStore.model?.id) {
        router.replace('/connexion?next=%2Fcommandes')
        return
      }

      if (attempted) {
        router.replace('/connexion?next=%2Fcommandes')
        return
      }

      try {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: pb.authStore.token,
            user: pb.authStore.model,
          }),
        })

        if (!cancelled && res.ok) {
          router.replace('/commandes?authSync=1')
          return
        }
      } catch {
        // ignore
      }

      if (!cancelled) {
        router.replace('/connexion?next=%2Fcommandes')
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-4xl items-center justify-center px-4">
      <p className="text-sm text-slate-500">Vérification de votre session...</p>
    </div>
  )
}
