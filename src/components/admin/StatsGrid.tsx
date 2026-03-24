'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Package, CheckCircle, RotateCcw, Banknote, Receipt, TrendingUp, TrendingDown } from 'lucide-react';
import { getExtendedStatsAction } from '@/app/(admin)/admin/dashboard/actions';

export default function StatsGrid() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExtendedStatsAction().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col gap-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Orders"
          value={data.totalOrders.value} 
          growth={data.totalOrders.growth}
          icon={<Package className="w-5 h-5 text-blue-600" />}
          textColor="text-blue-600"
          highlight="border-b-2 border-blue-600"
        />
        <StatCard 
          label="Delivered Orders"
          value={data.delivered.count} 
          growth={data.delivered.countGrowth}
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          textColor="text-green-600"
          highlight="border-b-2 border-green-600"
        />
        <StatCard 
          label="Returned Orders"
          value={data.returned.count} 
          growth={data.returned.countGrowth}
          isReverseTrend
          icon={<RotateCcw className="w-5 h-5 text-red-600" />}
          textColor="text-red-600"
          highlight="border-b-2 border-red-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          label="Total Sales"
          value={data.delivered.sales} 
          growth={data.delivered.salesGrowth}
          isCurrency 
          icon={<Banknote className="w-5 h-5 text-green-600" />}
          textColor="text-green-600"
          highlight="border-b-2 border-green-600"
        />
        <StatCard 
          label="Total Returns"
          value={data.returned.sales} 
          growth={data.returned.salesGrowth}
          isCurrency 
          isReverseTrend
          icon={<Receipt className="w-5 h-5 text-red-600" />}
          textColor="text-red-600"
          highlight="border-b-2 border-red-600"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, growth, isCurrency, icon, highlight, textColor, isReverseTrend }: any) {
  // Trend color logic: reversed for returns
  const isPositive = growth > 0;
  const isNeutral = growth === 0;
  
  let trendColor = isPositive ? 'text-green-600' : 'text-red-600';
  if (isReverseTrend) {
    trendColor = isPositive ? 'text-red-600' : 'text-green-600';
  }
  if (isNeutral) trendColor = 'text-slate-400';

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 flex flex-col justify-between ${highlight}`}>
      <div className="flex justify-between items-start mb-4">
        <p className={`${textColor} text-sm font-semibold uppercase tracking-wide`}>{label}</p>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-3xl font-black ${textColor}`}>
            {value.toLocaleString('en-US')}{isCurrency ? ' $' : ''}
          </p>
        </div>
        {!isNeutral && (
          <div className={`flex items-center text-sm font-bold ${trendColor}  px-2 py-1 rounded-lg`}>
            {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(growth)}%
          </div>
        )}
      </div>
    </div>
  );
}
