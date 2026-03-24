'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, Loader2, Package } from 'lucide-react';
import { fetchBestSellingProducts } from '@/lib/services/stats';

export default function BestSellingProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDT = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Fetch data on mount
  useEffect(() => {
    async function loadBestSellers() {
      try {
        setLoading(true);
        const data = await fetchBestSellingProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error loading best sellers:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBestSellers();
  }, []);

  const totalOrdersCount = products.reduce((sum, p) => sum + p.orders, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <p className="text-slate-500 text-sm italic">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      {/* Header Grid */}
      <div className="grid grid-cols-[3fr_1fr_1.5fr] gap-4 mb-4 pb-2 border-b border-slate-50">
        <div className="text-slate-700 font-bold text-base">Best Sellers</div>
        <div className="text-slate-500 text-sm font-medium text-center">Sales</div>
        <div className="text-slate-500 text-sm font-medium text-right">Revenue ($)</div>
      </div>

      <div className="space-y-1">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Package className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm italic">No sales recorded in the last 7 days.</p>
          </div>
        ) : (
          products.map((product, index) => (
            <div key={index} className="grid grid-cols-[3fr_1fr_1.5fr] gap-4 items-center py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-1 rounded-lg">
              {/* Product Info */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Inside your .map loop in BestSellingProducts.tsx */}
<div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
  {product.image?.startsWith('http') ? (
    <img 
      src={product.image} 
      alt={product.name} 
      className="w-full h-full object-cover"
      onError={(e) => {
        // Fallback if the URL returns a 404
        (e.target as HTMLImageElement).src = '/aboutimg.webp'; 
      }}
    />
  ) : (
    <span className="text-xl">{product.image || '📦'}</span>
  )}
</div>
                <div className="min-w-0">
                  <p className="text-slate-800 font-semibold text-sm truncate">{product.name}</p>
                </div>
              </div>

              {/* Quantity/Orders */}
              <div className="text-slate-700 font-medium text-center  rounded-md py-1 text-sm">
                {product.orders}
              </div>

              {/* Revenue */}
              <div className="text-slate-900 font-bold text-sm text-right">
                {formatDT(product.revenue)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-medium">
          Last 7 days <ChevronDown className="w-4 h-4" />
        </button>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-bold">
          View All
        </button>
      </div>
    </div>
  );
}
