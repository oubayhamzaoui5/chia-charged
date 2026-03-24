'use client';

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { Loader2, CalendarDays, CalendarRange, Box } from 'lucide-react';
import { getMonthlyOrdersTrendAction } from '@/app/(admin)/admin/dashboard/actions';

const MONTHS_FR = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function OrdersTrendChart() {
  const now = new Date();
  const [data, setData] = useState<any[] | null>(null);
  const [totals, setTotals] = useState({ delivered: 0, returned: 0 });
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [showDelivered, setShowDelivered] = useState(true);
  const [showReturned, setShowReturned] = useState(true);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const trend = await getMonthlyOrdersTrendAction(viewMode, selectedMonth, selectedYear);
        const formattedData = trend.labels.map((label: string, i: number) => ({
          name: label,
          delivered: trend.delivered[i],
          returned: trend.returned[i],
        }));
        setData(formattedData);
        setTotals({ delivered: trend.deliveredTotal, returned: trend.returnedTotal });
      } catch (error) {
        console.error("Failed to load chart:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [viewMode, selectedMonth, selectedYear]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-slate-100">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
        <div>
           <h3 className="text-slate-800 font-semibold text-lg flex items-center gap-2">
            <Box className="w-5 h-5 text-blue-600" />
            Orders
          </h3>
          <p className="text-sm text-slate-500">
            {viewMode === 'month' ? `Daily view for ${MONTHS_FR[selectedMonth]}` : `Monthly view for ${selectedYear}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
            <button 
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Monthly
            </button>
            <button 
              onClick={() => setViewMode('year')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'year' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <CalendarRange className="w-3.5 h-3.5" /> Yearly
            </button>
          </div>

          {/* Selectors */}
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
            {viewMode === 'month' && (
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent text-sm font-medium text-slate-600 outline-none p-1 cursor-pointer"
              >
                {MONTHS_FR.map((name, i) => <option key={name} value={i}>{name}</option>)}
              </select>
            )}
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-600 outline-none p-1 cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* INTERACTIVE TOGGLES */}
          <div className="flex items-center gap-4 ml-2 border-l pl-4 border-slate-200">
            {/* Delivered Toggle */}
            <button 
              onClick={() => setShowDelivered(!showDelivered)}
              className={`cursor-pointer group flex items-center gap-3 px-3 py-1 rounded-lg transition-all duration-200 active:scale-95 hover:bg-green-50 
                ${showDelivered ? 'opacity-100' : 'opacity-40 grayscale'}`}
              title={showDelivered ? "Hide delivered" : "Show delivered"}
            >
              <div className="text-right">
                <p className="text-[10px] text-green-600 uppercase font-black tracking-wider">Delivered</p>
                <p className="text-base font-black text-green-700 leading-tight">{totals.delivered}</p>
              </div>
            </button>

            {/* Returned Toggle */}
            <button 
              onClick={() => setShowReturned(!showReturned)}
              className={`cursor-pointer group flex items-center gap-3 px-3 py-1 rounded-lg transition-all duration-200 active:scale-95 hover:bg-red-50 
                ${showReturned ? 'opacity-100' : 'opacity-40 grayscale'}`}
              title={showReturned ? "Hide returns" : "Show returns"}
            >
              <div className="text-right">
                <p className="text-[10px] text-red-600 uppercase font-black tracking-wider">Returns</p>
                <p className="text-base font-black text-red-700 leading-tight">{totals.returned}</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="h-72 w-full relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}
        
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data ?? []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorReturned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              minTickGap={viewMode === 'year' ? 0 : 30}
              tickFormatter={(value) => viewMode === 'month' ? value.split(' ')[1] : value} 
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: "bold", marginBottom: '4px' }}
              itemStyle={{ fontWeight: "bolder", fontSize: '14px', padding: '2px 0' }}
              cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
            />
            {showReturned && (
              <Area 
                type="monotone" 
                dataKey="returned" 
                name="Returns" 
                stroke="#ef4444" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorReturned)" 
                dot={{ r: 4, fill: '#ef4444', stroke: '#fff' }} 
                activeDot={{ r: 6 }} 
              />
            )}
            {showDelivered && (
              <Area 
                type="monotone" 
                dataKey="delivered" 
                name="Delivered" 
                stroke="#22c55e" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorDelivered)" 
                dot={{ r: 4, fill: '#22c55e', stroke: '#fff' }} 
                activeDot={{ r: 6 }} 
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
