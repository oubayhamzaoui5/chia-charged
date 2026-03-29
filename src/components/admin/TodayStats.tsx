'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTodaySalesAction, getTodayVisitsAction } from '@/app/(admin)/admin/dashboard/actions'
import { Eye, TrendingUp } from 'lucide-react'

export default function TodayStats() {
  const {
    data: totalSales,
    isLoading: salesLoading,
    error: salesError,
    refetch: refetchSales,
  } = useQuery({
    queryKey: ['today-sales'],
    queryFn: getTodaySalesAction,
    refetchInterval: 60_000,
    retry: 2,
  })

  const {
    data: totalVisits,
    isLoading: visitsLoading,
    error: visitsError,
    refetch: refetchVisits,
  } = useQuery({
    queryKey: ['today-visits'],
    queryFn: getTodayVisitsAction,
    refetchInterval: 30_000,
    retry: 2,
  })

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Visits */}
      <div
        className="rounded-2xl bg-white p-5 flex flex-col gap-3"
        style={{ border: '1px solid #E8EAED', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: '#9CA3AF' }}
          >
            Visits today
          </span>
          <div className="rounded-lg p-1.5" style={{ background: '#EEF2FF' }}>
            <Eye className="w-4 h-4" style={{ color: '#4F46E5' }} />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          {visitsLoading ? (
            <div className="h-8 w-16 animate-pulse rounded-lg" style={{ background: '#F3F4F6' }} />
          ) : (
            <p
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: '#111827', fontVariantNumeric: 'tabular-nums' }}
            >
              {(totalVisits ?? 0).toLocaleString()}
            </p>
          )}
        </div>

        {visitsError ? (
          <div className="flex items-center gap-2">
            <p className="text-xs" style={{ color: '#EF4444' }}>Failed to load</p>
            <button
              onClick={() => refetchVisits()}
              className="text-xs font-semibold underline"
              style={{ color: '#EF4444' }}
            >
              Retry
            </button>
          </div>
        ) : (
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Page views since midnight</p>
        )}
      </div>

      {/* Sales */}
      <div
        className="rounded-2xl bg-white p-5 flex flex-col gap-3"
        style={{ border: '1px solid #E8EAED', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: '#9CA3AF' }}
          >
            Sales today
          </span>
          <div className="rounded-lg p-1.5" style={{ background: '#ECFDF5' }}>
            <TrendingUp className="w-4 h-4" style={{ color: '#10B981' }} />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          {salesLoading ? (
            <div className="h-8 w-28 animate-pulse rounded-lg" style={{ background: '#F3F4F6' }} />
          ) : (
            <p
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: '#111827', fontVariantNumeric: 'tabular-nums' }}
            >
              ${totalSales?.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) ?? '0.00'}
            </p>
          )}
        </div>

        {salesError && (
          <div className="flex items-center gap-2">
            <p className="text-xs" style={{ color: '#EF4444' }}>Failed to load</p>
            <button
              onClick={() => refetchSales()}
              className="text-xs font-semibold underline"
              style={{ color: '#EF4444' }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
