'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { getChartRowDataAction } from '@/app/(admin)/admin/dashboard/actions';

export default function ChartsRow() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // 1. Generate dynamic labels based on today's date
  const dynamicDays = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(dayNames[d.getDay()]);
    }
    return labels;
  }, []);

  const formatDT = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const [error, setError] = useState(false)

  const load = () => {
    setLoading(true)
    setError(false)
    getChartRowDataAction()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 rounded-2xl bg-white mb-8" style={{ border: '1px solid #E8EAED' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4F46E5' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-48 items-center justify-center gap-3 rounded-2xl mb-8" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
        <span className="text-sm font-medium" style={{ color: '#991B1B' }}>Failed to load chart data.</span>
        <button onClick={load} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: '#EF4444' }}>Retry</button>
      </div>
    )
  }

  const maxSale = Math.max(...(data.weeklySalesData || [1]), 1);

  return (
    <div className="mb-8">
      {/* Weekly Sales */}
      <div className="rounded-2xl bg-white p-6" style={{ border: '1px solid #E8EAED', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold" style={{ color: '#111827' }}>Weekly Sales</h3>
        </div>
        <div className="flex items-end justify-between gap-6">
          <div className="flex flex-col justify-end pb-2">
            <p className="text-3xl font-bold text-slate-800 mb-1">
              ${formatDT(data.weeklySalesTotal)}
            </p>
            <span className={`inline-flex items-center text-sm font-medium ${data.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.salesGrowth}% &nbsp;
              {data.salesGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </span>
          </div>
          <div className="relative flex items-end gap-1.5 h-24">
            {hoveredDay !== null && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap pointer-events-none z-10 shadow-lg">
                {/* FIXED: Using dynamicDays instead of static array */}
                {dynamicDays[hoveredDay]}: ${formatDT(data.weeklySalesData[hoveredDay])}
              </div>
            )}
            {data.weeklySalesData.map((val: number, i: number) => {
              const percentage = (val / maxSale) * 100;
              const isHovered = hoveredDay === i;
              const isOtherHovered = hoveredDay !== null && hoveredDay !== i;
              
              return (
                <div 
                  key={i}
                  className="relative w-3 h-full rounded-lg cursor-pointer transition-all duration-200 overflow-hidden"
                  onMouseEnter={() => setHoveredDay(i)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    opacity: isOtherHovered ? 0.4 : 1,
                    filter: isHovered ? 'brightness(1.15)' : 'none'
                  }}
                >
                  <div className="absolute bottom-0 w-full h-full bg-slate-100 " />
                  <div 
                    className="absolute bottom-0 w-full bg-blue-500 transition-all duration-200"
                    style={{ 
                      height: `${percentage}%`,
                      minHeight: '4px'
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
