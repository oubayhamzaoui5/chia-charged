import AlertNotifications from '@/components/admin/AlertNotifications'
import ChartsRow from '@/components/admin/ChartsRow'
import DashboardHeader from '@/components/admin/DashboardHeader'
import OrdersStatsClient from '@/components/admin/OrdersStatsClient'
import OrdersTrendChart from '@/components/admin/OrdersTrendChart'
import SalesTrendChart from '@/components/admin/SalesTrendChart'
import StatsGrid from '@/components/admin/StatsGrid'
import TodayStats from '@/components/admin/TodayStats'

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <DashboardHeader name="Admin" />
        <TodayStats />
        <OrdersStatsClient />
        <AlertNotifications />
        <ChartsRow />
        <StatsGrid />
        <OrdersTrendChart />
        <SalesTrendChart />
      </div>
    </div>
  )
}
