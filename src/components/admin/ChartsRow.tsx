'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { getChartRowDataAction } from '@/app/(admin)/admin/dashboard/actions';

export default function ChartsRow() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
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

  const getSegmentPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const startX = 18 + outerRadius * Math.cos(startAngle);
    const startY = 18 + outerRadius * Math.sin(startAngle);
    const endX = 18 + outerRadius * Math.cos(endAngle);
    const endY = 18 + outerRadius * Math.sin(endAngle);
    const innerStartX = 18 + innerRadius * Math.cos(startAngle);
    const innerStartY = 18 + innerRadius * Math.sin(startAngle);
    const innerEndX = 18 + innerRadius * Math.cos(endAngle);
    const innerEndY = 18 + innerRadius * Math.sin(endAngle);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    
    return `
      M ${startX} ${startY}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}
      L ${innerEndX} ${innerEndY}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}
      Z
    `;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

      {/* Top Categories */}
      <div className="rounded-2xl bg-white p-6" style={{ border: '1px solid #E8EAED', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 className="font-semibold mb-6" style={{ color: '#111827' }}>Top Categories</h3>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-3 w-full max-w-[220px]">
            {data.topCategories.map((item: any) => (
              <div 
                key={item.name} 
                className="flex items-center justify-between cursor-pointer transition-opacity duration-200 hover:opacity-70"
                onMouseEnter={() => setHoveredCategory(item.name)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 text-sm font-medium truncate">{item.name}</span>
                </div>
                <span className="text-slate-400 text-sm font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>

          <div className="relative w-32 h-32 mr-4">
            {hoveredCategory && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-100 whitespace-nowrap pointer-events-none z-10 shadow-md">
                {hoveredCategory}: {data.topCategories.find((c: any) => c.name === hoveredCategory)?.count}
              </div>
            )}
            
            <svg 
              className="w-full h-full transform -rotate-90" 
              viewBox="0 0 36 36"
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="transparent" strokeWidth="3.8" pointerEvents="all" />
              {(() => {
                let cumulativeAngle = 0;
                return data.topCategories.map((item: any, index: number) => {
                  const percentage = item.value / 100;
                  const startAngle = (cumulativeAngle * 2 * Math.PI);
                  const endAngle = ((cumulativeAngle + percentage) * 2 * Math.PI);
                  cumulativeAngle += percentage;
                  
                  const isHovered = hoveredCategory === item.name;
                  const path = getSegmentPath(startAngle, endAngle, 12.1, 15.9);
                  
                  return (
                    <g key={index}>
                      <path d={getSegmentPath(startAngle, endAngle, 10, 18)} fill="transparent" className="cursor-pointer" onMouseEnter={() => setHoveredCategory(item.name)} pointerEvents="all" />
                      <path
                        d={path}
                        fill={item.color}
                        className="transition-all duration-200 pointer-events-none"
                        style={{ 
                          opacity: hoveredCategory && !isHovered ? 0.4 : 1,
                          filter: isHovered ? 'brightness(1.15)' : 'none',
                          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: 'center'
                        }}
                      />
                    </g>
                  );
                });
              })()}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
