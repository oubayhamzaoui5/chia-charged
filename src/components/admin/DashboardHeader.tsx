'use client'

import { OrderNotificationsControl } from '@/components/admin/order-notifications'

type DashboardHeaderProps = {
  name: string
}

export default function DashboardHeader({ name }: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p
          className="mb-1 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: '#9CA3AF' }}
        >
          Overview
        </p>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: '#111827' }}
        >
          Good morning,{' '}
          <span style={{ color: '#4F46E5' }}>{name}</span>
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
          Here are the key metrics for your store today.
        </p>
      </div>
      <div className="w-full max-w-md">
        <OrderNotificationsControl />
      </div>
    </div>
  )
}
