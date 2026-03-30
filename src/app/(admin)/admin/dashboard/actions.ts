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

  const PB_URL = process.env.POCKETBASE_URL ?? process.env.NEXT_PUBLIC_PB_URL ?? 'http://127.0.0.1:8090'
  const email = process.env.PB_ADMIN_EMAIL ?? ''
  const password = process.env.PB_ADMIN_PASSWORD ?? ''

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  try {
    const PocketBase = (await import('pocketbase')).default
    const pb = new PocketBase(PB_URL)
    pb.autoCancellation(false)
    await pb.collection('_superusers').authWithPassword(email, password)

    try {
      const records = await pb.collection('visits').getFullList({
        filter: pb.filter('created >= {:start}', { start }),
        fields: 'visitorId',
        requestKey: null,
      })

      const uniqueVisitors = new Set(
        records.map((r: any) => r.visitorId).filter(Boolean)
      )
      return uniqueVisitors.size
    } catch (filterErr: any) {
      if (filterErr?.status !== 400) throw filterErr

      // Fallback for PocketBase instances that reject date filter parsing.
      const uniqueVisitors = new Set<string>()
      const perPage = 200
      let page = 1

      while (true) {
        const batch = await pb.collection('visits').getList(page, perPage, {
          sort: '-created',
          fields: 'visitorId,created',
          requestKey: null,
          skipTotal: true,
        })

        if (!batch.items.length) break

        let reachedOlderRecords = false
        for (const record of batch.items as any[]) {
          const createdAt = record?.created ? new Date(record.created) : null
          if (!createdAt || Number.isNaN(createdAt.getTime())) continue

          if (createdAt >= start) {
            if (typeof record.visitorId === 'string' && record.visitorId) {
              uniqueVisitors.add(record.visitorId)
            }
            continue
          }

          reachedOlderRecords = true
          break
        }

        if (reachedOlderRecords || batch.items.length < perPage) break
        page += 1
      }

      return uniqueVisitors.size
    }
  } catch (err) {
    const e = err as any
    console.error('[getTodayVisitsAction]', {
      status: e?.status,
      url: e?.url,
      response: e?.response,
      message: e?.message,
    })
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
      filter: `status = "paid" && updated >= "${pbDate}"`,
    }),
    pb.collection('orders').getList(1, 1, {
      filter: `status = "delivered" && updated >= "${pbDate}"`,
    }),
    pb.collection('orders').getList(1, 1, {
      filter: 'status = "paid"',
    }),
    pb.collection('orders').getList(1, 1, {
      filter: 'status = "delivering"',
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
