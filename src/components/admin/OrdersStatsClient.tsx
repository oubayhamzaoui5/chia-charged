"use client"

import { useEffect, useState } from "react"
import { Clock, CheckCircle2, Truck, Package } from "lucide-react"
import { getOrdersKpisAction } from "@/app/(admin)/admin/dashboard/actions"
import Card from "@/components/admin/card"

export default function OrdersStatsClient() {
  const [stats, setStats] = useState({
    pendingToday: 0,
    pendingAll: 0,
    confirmedAll: 0,
    deliveredToday: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const kpis = await getOrdersKpisAction()
        setStats(kpis)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const kpis = [
    {
      label: "New Orders",
      subLabel: "Today",
      value: stats.pendingToday,
      icon: Clock,
      theme: "text-rose-600 bg-rose-50 border-rose-100",
    },
    {
      label: "Pending",
      subLabel: "All time",
      value: stats.pendingAll,
      icon: Package,
      theme: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      label: "Confirmed",
      subLabel: "Total validated",
      value: stats.confirmedAll,
      icon: CheckCircle2,
      theme: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      label: "Delivered",
      subLabel: "Today",
      value: stats.deliveredToday,
      icon: Truck,
      theme: "text-blue-600 bg-blue-50 border-blue-100",
    },
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card
            key={kpi.label}
            className="group relative overflow-hidden border border-slate-100 bg-white p-6 transition-all duration-300  rounded-3xl"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
                {loading ? (
                  <div className="h-9 w-12 animate-pulse rounded-md bg-slate-100" />
                ) : (
                  <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                    {kpi.value}
                  </h3>
                )}
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {kpi.subLabel}
                </p>
              </div>

              <div className={`rounded-2xl p-3 transition-colors ${kpi.theme}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>

            {/* Subtle background decoration */}
            <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-5 transition-transform group-hover:scale-110 ${kpi.theme.split(' ')[1]}`} />
          </Card>
        )
      })}
    </div>
  )
}