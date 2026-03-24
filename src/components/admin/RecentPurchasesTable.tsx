'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link'; // Assuming you are using Next.js
import { Trash2, Pause, ShoppingCart, CheckCircle2, Clock, Truck, ChevronRight } from 'lucide-react';
import { fetchRecentPurchases } from '@/lib/services/stats'; 

type Status = 'pending' | 'confirmed' | 'delevering' | 'delivered' | 'cancelled' | 'on hold' | 'returned';

interface Purchase {
  customer: string;
  phone: string;
  product: string;
  status: Status;
  amount: number;
}

export default function RecentPurchasesTable() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const statusIcon = (status: Status) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />
      case 'confirmed': return <CheckCircle2 className="w-3 h-3" />
      case 'delevering': return <Truck className="w-3 h-3" />
      case 'delivered': return <ShoppingCart className="w-3 h-3" />
      case 'cancelled': return <Trash2 className="w-3 h-3" />
      case 'on hold': return <Pause className="w-3 h-3" />
      case 'returned': return <Truck className="w-3 h-3" />
    }
  }

  const statusBadgeClass = (status: Status) => {
    switch (status) {
      case 'pending': return 'bg-orange-50 text-orange-700'
      case 'confirmed': return 'bg-blue-50 text-blue-700'
      case 'delevering': return 'bg-purple-50 text-purple-700'
      case 'delivered': return 'bg-emerald-50 text-emerald-700'
      case 'cancelled': return 'bg-red-50 text-red-700'
      case 'on hold': return 'bg-slate-100 text-slate-600'
      case 'returned': return 'bg-red-50 text-red-700'
    }
  }

  const statusLabels: Record<Status, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    delevering: 'Out for delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    'on hold': 'On hold',
    returned: 'Returned',
  }

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchRecentPurchases();
        setPurchases(data);
      } catch (error) {
        console.error("Failed to load recent purchases", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-slate-800 font-semibold text-lg">Recent Orders</h3>
          <p className="text-sm text-slate-500">Snapshot of recent transactions</p>
        </div>
        <Link 
          href="/admin/orders" 
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors"
        >
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              {['Customer', 'Phone', 'Products', 'Status', 'Amount'].map((header) => (
                <th key={header} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm animate-pulse">Loading...</td></tr>
            ) : purchases.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">No orders found.</td></tr>
            ) : (
              purchases.map((purchase, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-blue-600 font-semibold text-sm">{purchase.customer}</span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 text-sm">{purchase.phone}</td>
                  <td className="py-4 px-4 text-slate-600 text-sm ">
                    {purchase.product}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center justify-center gap-1.5 w-32 py-1 rounded-full text-xs font-bold ${statusBadgeClass(purchase.status)}`}>
                      {statusLabels[purchase.status]}
                      {statusIcon(purchase.status)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-900 font-bold text-sm text-nowrap">
                    ${purchase.amount.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
