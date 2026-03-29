'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Alert } from '@/types/dashboard'
import { getAlertCountsAction } from '@/app/(admin)/admin/dashboard/actions'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'

const alertConfig = {
  danger: {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    text: '#991B1B',
    link: '#DC2626',
    icon: AlertCircle,
    iconColor: '#EF4444',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FCD34D',
    text: '#92400E',
    link: '#D97706',
    icon: AlertTriangle,
    iconColor: '#F59E0B',
  },
  info: {
    bg: '#EFF6FF',
    border: '#93C5FD',
    text: '#1E3A5F',
    link: '#2563EB',
    icon: Info,
    iconColor: '#3B82F6',
  },
}

export default function AlertNotifications() {
  const { data: counts, isLoading } = useQuery({
    queryKey: ['alert-counts'],
    queryFn: getAlertCountsAction,
    refetchInterval: 30000,
  })

  const alerts: (Alert & { type: 'danger' | 'warning' | 'info' })[] = [
    {
      type: 'danger',
      message: `${counts?.outOfStock || 0} products are out of stock`,
      link: '/admin/inventory',
      linkText: 'Manage stock',
    },
    {
      type: 'warning',
      message: `${counts?.lowStock || 0} products have low stock`,
      link: '/admin/inventory',
      linkText: 'Manage stock',
    },
    {
      type: 'info',
      message: `${counts?.pendingOrders || 0} orders are pending`,
      link: '/admin/orders',
      linkText: 'View orders',
    },
  ]

  if (isLoading) {
    return (
      <div
        className="mb-6 h-12 w-full animate-pulse rounded-xl"
        style={{ background: '#F3F4F6' }}
      />
    )
  }

  const activeAlerts = alerts.filter((a) => {
    const match = a.message.match(/^(\d+)/)
    return match ? parseInt(match[1]) > 0 : false
  })

  if (activeAlerts.length === 0) return null

  return (
    <div className="mb-6 space-y-2">
      {activeAlerts.map((alert, index) => {
        const config = alertConfig[alert.type]
        const Icon = config.icon
        const match = alert.message.match(/^(\d+)/)
        const boldText = match ? match[1] : ''
        const normalText = boldText ? alert.message.slice(boldText.length) : alert.message

        return (
          <div
            key={index}
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{
              background: config.bg,
              border: `1px solid ${config.border}`,
            }}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0" style={{ color: config.iconColor }} />
              <span className="text-sm" style={{ color: config.text }}>
                <span className="font-bold">{boldText}</span>
                {normalText}
              </span>
            </div>
            <a
              href={alert.link}
              className="ml-4 shrink-0 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: config.link }}
            >
              {alert.linkText} →
            </a>
          </div>
        )
      })}
    </div>
  )
}
