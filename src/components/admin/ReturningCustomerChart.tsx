'use client';

import React from 'react';
import { TrendingUp, ChevronDown } from 'lucide-react';
import type { CustomerData } from '@/types/dashboard';

interface ReturningCustomerChartProps {
  data: CustomerData;
}

export default function ReturningCustomerChart({ data }: ReturningCustomerChartProps) {
  const { rate, change, newCustomers, returningCustomers } = data;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-slate-700 font-medium text-base">Returning Customer Rate</h3>
        <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm">
          Jan <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex items-center gap-3 mb-6">
        <p className="text-4xl font-bold text-blue-600">${rate}%</p>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-sm font-medium">
          <TrendingUp className="w-3 h-3" />
          {change}%
        </span>
      </div>

      <p className="text-slate-600 text-sm mb-4 font-medium">Customers</p>

      <div className="relative">
        <svg viewBox="0 0 1300 350" className="w-full h-72">
          <line x1="60" y1="280" x2="1280" y2="280" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="60" y1="210" x2="1280" y2="210" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="60" y1="140" x2="1280" y2="140" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="60" y1="70" x2="1280" y2="70" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="60" y1="0" x2="1280" y2="0" stroke="#e5e7eb" strokeWidth="1" />

          <text x="45" y="285" className="text-xs fill-slate-400" textAnchor="end">0</text>
          <text x="45" y="215" className="text-xs fill-slate-400" textAnchor="end">30</text>
          <text x="45" y="145" className="text-xs fill-slate-400" textAnchor="end">60</text>
          <text x="45" y="75" className="text-xs fill-slate-400" textAnchor="end">90</text>
          <text x="45" y="5" className="text-xs fill-slate-400" textAnchor="end">120</text>

          <defs>
            <linearGradient id="blueGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="orangeGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#fb923c" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <path
            d={`M 90,${280 - newCustomers[0] * 1.8} 
                ${newCustomers.map((val: number, i: number) => `L ${90 + i * 100},${280 - val * 1.8}`).join(' ')}
                L ${90 + (newCustomers.length - 1) * 100},280 L 90,280 Z`}
            fill="url(#blueGradient)"
          />
          
          <polyline
            points={newCustomers.map((val: number, i: number) => `${90 + i * 100},${280 - val * 1.8}`).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
          />

          <path
            d={`M 90,${280 - returningCustomers[0] * 1.8} 
                ${returningCustomers.map((val: number, i: number) => `L ${90 + i * 100},${280 - val * 1.8}`).join(' ')}
                L ${90 + (returningCustomers.length - 1) * 100},280 L 90,280 Z`}
            fill="url(#orangeGradient)"
          />

          <polyline
            points={returningCustomers.map((val: number, i: number) => `${90 + i * 100},${280 - val * 1.8}`).join(' ')}
            fill="none"
            stroke="#fb923c"
            strokeWidth="2.5"
          />

          {['Jan 1', '4', '7', '10', '13', '16', '19', '22', '25', '28', '31'].map((label, i) => (
            <text key={label} x={90 + i * 100} y="310" className="text-xs fill-slate-400" textAnchor="middle">
              {label}
            </text>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-slate-600">New</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
            <span className="text-sm text-slate-600">Returning</span>
          </div>
        </div>
        <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View report →
        </a>
      </div>
    </div>
  );
}
