'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, Package, CheckCircle, RotateCcw, Banknote, Receipt, TrendingUp, TrendingDown } from 'lucide-react'
import { getExtendedStatsAction } from '@/app/(admin)/admin/dashboard/actions'

export default function StatsGrid() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setError(false)
    getExtendedStatsAction()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mb-8 flex h-48 items-center justify-center rounded-2xl bg-white" style={{ border: '1px solid #E8EAED' }}>
        <Loader2 className="animate-spin" style={{ color: '#4F46E5' }} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mb-8 flex h-32 items-center justify-center gap-3 rounded-2xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
        <span className="text-sm font-medium" style={{ color: '#991B1B' }}>Failed to load stats.</span>
        <button
          onClick={() => { setLoading(true); setError(false); getExtendedStatsAction().then(setData).catch(() => setError(true)).finally(() => setLoading(false)) }}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
          style={{ background: '#EF4444' }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Orders"
          value={data.totalOrders.value}
          growth={data.totalOrders.growth}
          icon={<Package className="w-5 h-5" style={{ color: '#4F46E5' }} />}
          accent="#4F46E5"
          accentBg="#EEF2FF"
        />
        <StatCard
          label="Delivered Orders"
          value={data.delivered.count}
          growth={data.delivered.countGrowth}
          icon={<CheckCircle className="w-5 h-5" style={{ color: '#10B981' }} />}
          accent="#10B981"
          accentBg="#ECFDF5"
        />
        <StatCard
          label="Refunded Orders"
          value={data.returned.count}
          growth={data.returned.countGrowth}
          isReverseTrend
          icon={<RotateCcw className="w-5 h-5" style={{ color: '#EF4444' }} />}
          accent="#EF4444"
          accentBg="#FEF2F2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          label="Total Sales"
          value={data.delivered.sales}
          growth={data.delivered.salesGrowth}
          isCurrency
          icon={<Banknote className="w-5 h-5" style={{ color: '#10B981' }} />}
          accent="#10B981"
          accentBg="#ECFDF5"
        />
        <StatCard
          label="Total Refunded"
          value={data.returned.sales}
          growth={data.returned.salesGrowth}
          isCurrency
          isReverseTrend
          icon={<Receipt className="w-5 h-5" style={{ color: '#EF4444' }} />}
          accent="#EF4444"
          accentBg="#FEF2F2"
        />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  growth,
  isCurrency,
  icon,
  accent,
  accentBg,
  isReverseTrend,
}: any) {
  const isPositive = growth > 0
  const isNeutral = growth === 0

  let trendColor = isPositive ? '#10B981' : '#EF4444'
  if (isReverseTrend) trendColor = isPositive ? '#EF4444' : '#10B981'
  if (isNeutral) trendColor = '#9CA3AF'

  return (
    <div
      className="rounded-2xl bg-white p-5"
      style={{
        border: '1px solid #E8EAED',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        borderTop: `3px solid ${accent}`,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
          {label}
        </p>
        <div className="rounded-lg p-1.5" style={{ background: accentBg }}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: '#111827', fontVariantNumeric: 'tabular-nums' }}
        >
          {isCurrency ? '$' : ''}{value.toLocaleString('en-US')}
        </p>
        {!isNeutral && (
          <div
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold"
            style={{ color: trendColor, background: `${trendColor}15` }}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(growth)}%
          </div>
        )}
      </div>
    </div>
  )
}
