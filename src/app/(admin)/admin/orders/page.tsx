import { getAdminOrders } from '@/lib/admin/data'

import OrdersClient from './orders.client'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const initialOrders = await getAdminOrders()
  return <OrdersClient initialOrders={initialOrders} />
}
