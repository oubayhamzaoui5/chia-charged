'use server'

import { requireAdmin } from '@/lib/auth'
import { getAdminPbForAction } from '@/lib/admin/actions'
import {
  fetchAlertCounts,
  fetchChartRowData,
  fetchExtendedStats,
  fetchMonthlyOrdersTrend,
  fetchMonthlySalesTrend,
  fetchTodaySales,
} from '@/lib/services/stats'

export async function getTodaySalesAction() {
  await requireAdmin()
  return fetchTodaySales()
}

export async function getTodayVisitsAction(): Promise<number> {
  await requireAdmin()
  const { pb } = await getAdminPbForAction()
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const toPb = (d: Date) =>
    d.toISOString().replace('T', ' ').split('.')[0]
  try {
    const result = await pb.collection('visits').getList(1, 1, {
      filter: `created >= "${toPb(start)}"`,
      requestKey: null,
    })
    return result.totalItems
  } catch {
    return 0
  }
}

export async function getAlertCountsAction() {
  await requireAdmin()
  return fetchAlertCounts()
}

export async function getChartRowDataAction() {
  await requireAdmin()
  return fetchChartRowData()
}

export async function getExtendedStatsAction() {
  await requireAdmin()
  return fetchExtendedStats()
}

export async function getMonthlyOrdersTrendAction(
  viewMode: 'month' | 'year',
  month: number,
  year: number
) {
  await requireAdmin()
  return fetchMonthlyOrdersTrend(viewMode, month, year)
}

export async function getMonthlySalesTrendAction(
  viewMode: 'month' | 'year',
  month: number,
  year: number
) {
  await requireAdmin()
  return fetchMonthlySalesTrend(viewMode, month, year)
}

export async function getPendingOrdersCountAction() {
  const { pb } = await getAdminPbForAction()
  const pending = await pb.collection('orders').getList(1, 1, {
    filter: 'status = "pending"',
  })
  return pending.totalItems
}

export async function getOrdersKpisAction() {
  const { pb } = await getAdminPbForAction()
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const toPb = (d: Date) => d.toISOString().replace('T', ' ').split('.')[0]
  const pbDate = toPb(start)

  const [pendingToday, deliveredToday, pendingAll, confirmedAll] = await Promise.all([
    pb.collection('orders').getList(1, 1, {
      filter: `status = "pending" && updated >= "${pbDate}"`,
    }),
    pb.collection('orders').getList(1, 1, {
      filter: `status = "delivered" && updated >= "${pbDate}"`,
    }),
    pb.collection('orders').getList(1, 1, {
      filter: 'status = "pending"',
    }),
    pb.collection('orders').getList(1, 1, {
      filter: 'status = "confirmed"',
    }),
  ])

  return {
    pendingToday: pendingToday.totalItems,
    deliveredToday: deliveredToday.totalItems,
    pendingAll: pendingAll.totalItems,
    confirmedAll: confirmedAll.totalItems,
  }
}

export async function getLatestOrderForNotificationAction() {
  const { pb } = await getAdminPbForAction()
  const res = await pb.collection('orders').getList(1, 1, {
    sort: '-created',
    fields: 'id,created,total,currency,firstName,lastName',
    requestKey: null,
  })

  const item = res.items[0]
  if (!item) return null

  const firstName = typeof item.firstName === 'string' ? item.firstName : ''
  const lastName = typeof item.lastName === 'string' ? item.lastName : ''

  return {
    id: String(item.id ?? ''),
    created: String(item.created ?? ''),
    total: Number(item.total ?? 0),
    currency: typeof item.currency === 'string' ? item.currency : '$',
    customerName: `${firstName} ${lastName}`.trim() || 'Customer',
  }
}
