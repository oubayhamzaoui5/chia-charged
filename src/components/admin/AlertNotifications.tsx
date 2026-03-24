'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Alert } from '@/types/dashboard';
import { getAlertCountsAction } from '@/app/(admin)/admin/dashboard/actions';

export default function AlertNotifications() {
  // 1. Fetch real-time data from PocketBase
  const { data: counts, isLoading } = useQuery({
    queryKey: ['alert-counts'],
    queryFn: getAlertCountsAction,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // 2. Map the data to our Alert structure
  const alerts: (Alert & { type: 'danger' | 'warning' | 'info' })[] = [
    {
      type: 'danger',
      message: `${counts?.outOfStock || 0} products are out of stock`,
      link: '/admin/inventory',
      linkText: 'Manage stock'
    },
    {
      type: 'warning',
      message: `${counts?.lowStock || 0} products have low stock`,
      link: '/admin/inventory',
      linkText: 'Manage stock'
    },
    {
      type: 'info',
      message: `${counts?.pendingOrders || 0} orders are pending`,
      link: '/admin/orders',
      linkText: 'View orders'
    }
  ];

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-400',
          dot: 'bg-red-500',
          link: 'text-red-600 hover:text-red-700',
          text: 'text-red-900'
        };
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-400',
          dot: 'bg-orange-500',
          link: 'text-orange-600 hover:text-orange-700',
          text: 'text-orange-900'
        };
      default: // info
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-400',
          dot: 'bg-blue-500',
          link: 'text-blue-600 hover:text-blue-700',
          text: 'text-blue-900'
        };
    }
  };

  if (isLoading) return <div className="h-20 w-full bg-slate-100 animate-pulse rounded-lg mb-8" />;

  return (
    <div className="space-y-3 mb-8">
      {alerts.map((alert, index) => {
        // Only show the alert if the count is greater than 0
        const count = parseInt(alert.message);
        if (count === 0) return null;

        const styles = getAlertStyles(alert.type);
        const match = alert.message.match(/^(\d+)/);
        const boldText = match ? match[1] : '';
        const normalText = boldText ? alert.message.slice(boldText.length) : alert.message;

        return (
          <div
            key={index}
            className={`${styles.bg} border-l-4 ${styles.border} p-4 flex items-center justify-between rounded-lg shadow-sm transition-all`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 ${styles.dot} rounded-full`}></div>
              <span className={`${styles.text} text-sm`}>
                <span className="font-bold text-base">{boldText}</span>
                {normalText}
              </span>
            </div>
            <a href={alert.link} className={`${styles.link} font-bold text-sm flex items-center gap-1`}>
              {alert.linkText} →
            </a>
          </div>
        );
      })}
    </div>
  );
}
