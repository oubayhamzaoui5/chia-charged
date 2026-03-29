"use client"

import { useEffect, useState } from "react"
import { Clock, CheckCircle2, Truck, Package } from "lucide-react"
import { getOrdersKpisAction } from "@/app/(admin)/admin/dashboard/actions"

const kpiConfig = [
  {
    key: "pendingToday" as const,
    label: "New Orders",
    subLabel: "Today",
    icon: Clock,
    accent: '#EF4444',
    accentBg: '#FEF2F2',
  },
  {
    key: "pendingAll" as const,
    label: "Pending",
    subLabel: "All time",
    icon: Package,
    accent: '#F59E0B',
    accentBg: '#FFFBEB',
  },
  {
    key: "confirmedAll" as const,
    label: "Confirmed",
    subLabel: "Total validated",
    icon: CheckCircle2,
    accent: '#10B981',
    accentBg: '#ECFDF5',
  },
  {
    key: "deliveredToday" as const,
    label: "Delivered",
    subLabel: "Today",
    icon: Truck,
    accent: '#4F46E5',
    accentBg: '#EEF2FF',
  },
]

export default function OrdersStatsClient() {
  const [stats, setStats] = useState({
    pendingToday: 0,
    pendingAll: 0,
    confirmedAll: 0,
    deliveredToday: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    setError(false)
    try {
      const kpis = await getOrdersKpisAction()
      setStats(kpis)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  if (error) {
    return (
      <div className="flex h-28 items-center justify-center gap-3 rounded-2xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
        <span className="text-sm font-medium" style={{ color: '#991B1B' }}>Failed to load order stats.</span>
        <button onClick={fetchOrders} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: '#EF4444' }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon
        return (
          <div
            key={kpi.label}
            className="relative overflow-hidden rounded-2xl bg-white p-5"
            style={{
              border: '1px solid #E8EAED',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: '#9CA3AF' }}
                >
                  {kpi.label}
                </p>
                {loading ? (
                  <div
                    className="h-9 w-12 animate-pulse rounded-lg"
                    style={{ background: '#F3F4F6' }}
                  />
                ) : (
                  <h3
                    className="text-3xl font-extrabold tracking-tight"
                    style={{ color: '#111827', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {stats[kpi.key]}
                  </h3>
                )}
                <p className="text-[11px] font-medium" style={{ color: '#9CA3AF' }}>
                  {kpi.subLabel}
                </p>
              </div>
              <div
                className="rounded-xl p-2.5"
                style={{ background: kpi.accentBg }}
              >
                <Icon className="h-5 w-5" style={{ color: kpi.accent }} />
              </div>
            </div>
            {/* Accent bottom bar */}
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: kpi.accent, opacity: 0.35 }}
            />
          </div>
        )
      })}
    </div>
  )
}
