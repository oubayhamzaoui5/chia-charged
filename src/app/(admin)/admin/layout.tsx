import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'

import { OrderNotificationsListener } from '@/components/admin/order-notifications'
import Sidebar from '@/components/admin/sidebar'
import { requireAdmin } from '@/lib/auth'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdmin()

  return (
    <div className={`${jakarta.className} flex h-screen overflow-hidden`} style={{ background: '#F4F6FB' }}>
      <OrderNotificationsListener />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
