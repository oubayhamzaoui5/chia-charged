'use client'
import { useState } from 'react'
import { useInventory } from '@/hooks/useInventory'
import InventoryFilters from '@/components/admin/InventoryFilters'
import EmptyState from '@/components/admin/empty-state'
import { productImageUrl } from '@/utils/inventory.utils'
import type { ProductStock, CategoryOption } from '@/types/inventory.types'
import { SquarePen } from 'lucide-react'
import { updateProductStockAction } from './actions'
import { useAdminToast } from '@/components/admin/AdminToast'

export default function InventoryClient({
  products,
  allCategories,
}: {
  products: ProductStock[]
  allCategories: CategoryOption[]
}) {
  const { toast, ToastContainer } = useAdminToast()
  const [savingId, setSavingId] = useState<string | null>(null)

  const inv = useInventory(products, async (id, stock) => {
    await updateProductStockAction(id, stock)
  })

  function formatCountFlavor(count?: string | null, flavor?: string | null) {
    const c = typeof count === 'string' ? count.trim() : ''
    const f = typeof flavor === 'string' ? flavor.trim() : ''
    if (c && f) return `${c} / ${f}`
    if (c) return c
    if (f) return f
    return ''
  }

  async function commitStock(productId: string, fallbackStock: number) {
    if (savingId) return
    const next = inv.draftStock ?? fallbackStock
    setSavingId(productId)
    try {
      await inv.updateStock(productId, next)
      toast('Stock updated.', 'success')
    } catch {
      toast('Failed to update stock.', 'error')
    } finally {
      setSavingId(null)
      inv.setEditingId(null)
      inv.setDraftStock(null)
    }
  }
  
  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="mb-8">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
          Operations
        </p>
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>
            Product Stock
          </h1>
          <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
            {inv.filtered.length} product{inv.filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
          Manage stock quantities for all products.
        </p>
      </div>
    
      <InventoryFilters {...inv} allCategories={allCategories} />

      <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #F0F2F5' }}>
                <th className="py-4 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
                  Product details
                </th>
                <th className="py-4 text-center text-xs font-semibold uppercase tracking-widest min-w-[120px]" style={{ color: '#9CA3AF' }}>
                  Stock
                </th>
              </tr>
            </thead>
            <tbody>
              {/* --- ETAT VIDE --- */}
              {inv.filtered.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-12">
                    <EmptyState
                      title="No products found"
                      description="Try adjusting your filters or search."
                    />
                  </td>
                </tr>
              ) : (
                /* --- LISTE DES PRODUITS --- */
                inv.filtered.map((p) => {
                  const image = p.images?.[0]
                      ? productImageUrl(p.id, p.images[0])
                      : '/aboutimg.webp'

                  const isOutOfStock = p.stock <= 0
                  const isLowStock = p.stock < 10

                  const rowBg = isOutOfStock 
                    ? 'bg-red-100 hover:bg-red-200' 
                    : isLowStock 
                      ? 'bg-orange-100 hover:bg-orange-200' 
                      : 'hover:bg-slate-50'

                  const stockTextColor = isOutOfStock 
                    ? 'text-red-600' 
                    : isLowStock 
                      ? 'text-orange-600' 
                      : 'text-slate-800'

                  return (
                    <tr key={p.id} className={`${rowBg} transition-colors`}>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                            <img
                              src={image}
                              className="h-full w-full object-cover"
                              alt={p.name}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-800 font-medium text-sm">{p.name}</span>
                            <span className="text-slate-500 text-xs font-mono">
                              {formatCountFlavor(p.count, p.flavor) || p.sku || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="relative text-center min-w-[120px] py-4 px-2">
                        {inv.editingId === p.id ? (
                          savingId === p.id ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4F46E5' }}>
                              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                              Saving…
                            </span>
                          ) : (
                          <input
                            type="number"
                            autoFocus
                            value={inv.draftStock ?? p.stock}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => inv.setDraftStock(Number(e.target.value))}
                            onBlur={async () => {
                              await commitStock(p.id, p.stock)
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                await commitStock(p.id, p.stock)
                              }
                            }}
                            disabled={!!savingId}
                            className={`
                              w-24 h-9 rounded-lg border text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50
                              ${isLowStock ? 'border-orange-400' : 'border-slate-200'}
                            `}
                          />
                          )
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className={`font-bold text-base ${stockTextColor}`}>
                              {p.stock}
                            </span>
                            <button
                              onClick={() => {
                                inv.setEditingId(p.id)
                                inv.setDraftStock(p.stock)
                              }}
                              disabled={!!savingId}
                              className="p-1.5 rounded-md hover:bg-white/50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Edit stock"
                            >
                              <SquarePen className="h-4 w-4 text-slate-600" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      {ToastContainer}
    </div>
  )
}
