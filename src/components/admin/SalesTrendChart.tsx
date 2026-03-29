'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { Loader2, CalendarDays, CalendarRange, Wallet} from 'lucide-react';
import { getMonthlySalesTrendAction } from '@/app/(admin)/admin/dashboard/actions';

const MONTHS_FR = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function SalesTrendChart() {
  const now = new Date();
  const [data, setData] = useState<any[] | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartError, setChartError] = useState(false);
  const [showSales, setShowSales] = useState(true);
  
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const loadData = useCallback(async () => {
    setLoading(true);
    setChartError(false);
    try {
      const result = await getMonthlySalesTrendAction(viewMode, selectedMonth, selectedYear);
      const formattedData = result.labels.map((label: string, i: number) => ({
        name: label,
        sales: result.sales[i],
      }));
      setData(formattedData);
      setTotalRevenue(result.totalRevenue);
    } catch {
      setChartError(true);
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedMonth, selectedYear]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="rounded-2xl bg-white p-6 mb-8" style={{ border: '1px solid #E8EAED', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: '#111827' }}>
            <Wallet className="w-5 h-5 text-green-600" />
            Sales
          </h3>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            {viewMode === 'month' ? `Daily sales - ${MONTHS_FR[selectedMonth]}` : `Monthly sales - ${selectedYear}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Switcher */}
          <div className="flex p-1 rounded-xl mr-2" style={{ background: '#F4F6FB' }}>
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-[#4F46E5]' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Monthly
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'year' ? 'bg-white shadow-sm text-[#4F46E5]' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              <CalendarRange className="w-3.5 h-3.5" /> Yearly
            </button>
          </div>

          {/* Date Selectors */}
          <div className="flex items-center gap-2 p-1 rounded-xl" style={{ background: '#F4F6FB', border: '1px solid #E8EAED' }}>
            {viewMode === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent text-sm font-medium outline-none p-1 cursor-pointer"
                style={{ color: '#374151' }}
              >
                {MONTHS_FR.map((name, i) => <option key={name} value={i}>{name}</option>)}
              </select>
            )}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-sm font-medium outline-none p-1 cursor-pointer"
              style={{ color: '#374151' }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Interactive Total Toggle */}
          <div className="flex items-center gap-4 ml-2 border-l pl-4 border-slate-200">
            <button 
              onClick={() => setShowSales(!showSales)}
              className={`cursor-pointer group flex items-center gap-3 px-4 py-1.5 rounded-xl transition-all duration-200 active:scale-95 hover:bg-emerald-50 
                ${showSales ? 'opacity-100 ring-1 ring-green-100 shadow-sm' : 'opacity-40 grayscale'}`}
            >
              <div className="text-right">
                <p className="text-[10px] text-green-600 uppercase font-black tracking-wider">Total sales</p>
                <p className="text-lg font-black text-green-600 leading-tight">
                    {formatCurrency(totalRevenue)}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="h-80 w-full relative">
        {chartError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl" style={{ background: '#FEF2F2' }}>
            <span className="text-sm font-medium" style={{ color: '#991B1B' }}>Failed to load chart.</span>
            <button onClick={loadData} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: '#EF4444' }}>Retry</button>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        )}
        
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data ?? []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              minTickGap={viewMode === 'year' ? 0 : 30}
              tickFormatter={(value) => viewMode === 'month' ? value.split(' ')[1] : value} 
            />
            <YAxis 
              tick={{ fill: '#94a3b8', fontSize: 11 }} 
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Sales"]}
              contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' , fontWeight: "bold", color: "#000000" }}
              labelStyle={{ fontWeight: "bold", color: "#000000", marginBottom: '4px' }}
              cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
            />
            {showSales && (
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#22c55e" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorSales)" 
                dot={{ r: 4, fill: '#22c55e', stroke: '#fff' }} 
                activeDot={{ r: 6 }} 
                animationDuration={1200}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
