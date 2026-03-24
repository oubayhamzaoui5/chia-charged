'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTodaySalesAction } from '@/app/(admin)/admin/dashboard/actions';

export default function TodayStats() {
  const { data: totalSales, isLoading, error } = useQuery({
    queryKey: ['today-sales'],
    queryFn: getTodaySalesAction,
    refetchInterval: 60000, // Refresh every minute
  });

  return (
    <div className="grid grid-cols-2 gap-8 mb-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      {/* Section Visites */}
      <div>
        <p className="text-slate-500 text-sm mb-1">Visits today</p>
        <p className="text-4xl font-bold text-slate-900 tracking-tight">
          Coming soon
        </p>
      </div>

      {/* Section Ventes */}
      <div>
        <p className="text-slate-500 text-sm mb-1">Total sales today</p>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold text-slate-900 tracking-tight">
            {isLoading ? (
              <span className="inline-block h-8 w-24 animate-pulse bg-slate-200 rounded" />
            ) : (
              totalSales?.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            )}
          </p>
          <span className="text-xl font-medium text-slate-500">$</span>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">Failed to update</p>}
      </div>
    </div>
  );
}
