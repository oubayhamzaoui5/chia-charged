import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Update Design | Orders',
}

export default async function OrdersPage() {
  redirect('/commandes')
}
