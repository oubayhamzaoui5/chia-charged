'use client'
import { useState } from 'react'
import { useInventory } from '@/hooks/useInventory'
import InventoryFilters from '@/components/admin/InventoryFilters'
import EmptyState from '@/components/admin/empty-state'
import { productImageUrl } from '@/utils/inventory.utils'
import type { ProductStock, CategoryOption } from '@/types/inventory.types'
import { SquarePen } from 'lucide-react'
import { updateProductStockAction } from './actions'

export default function InventoryClient({
  products,
  allCategories,
}: {
  products: ProductStock[]
  allCategories: CategoryOption[]
}) {
  const [notice, setNotice] = useState<string | null>(null)

  const inv = useInventory(products, async (id, stock) => {
    await updateProductStockAction(id, stock)
  })

  async function commitStock(productId: string, fallbackStock: number) {
    const next = inv.draftStock ?? fallbackStock
    try {
      await inv.updateStock(productId, next)
      setNotice('Stock updated.')
    } catch {
      setNotice('Failed to update stock.')
    } finally {
      inv.setEditingId(null)
      inv.setDraftStock(null)
    }
  }
  
  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">
          Product Stock
        </h1>
        <p className="text-slate-600 text-lg">
          Manage stock quantities for all products.
        </p>
      </div>
    
      <InventoryFilters {...inv} allCategories={allCategories} />

      {notice && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">
          {notice}
        </div>
      )}
      
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-4 text-left text-slate-700 font-semibold text-base">
                  Product details
                </th>
                <th className="py-4 text-center text-slate-600 text-sm font-medium min-w-[120px]">
                  Stock
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                              {p.sku || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="relative text-center min-w-[120px] py-4 px-2">
                        {inv.editingId === p.id ? (
                          <input
                            type="number"
                            autoFocus
                            value={inv.draftStock ?? p.stock}
                            onChange={(e) => inv.setDraftStock(Number(e.target.value))}
                            onBlur={async () => {
                              await commitStock(p.id, p.stock)
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                await commitStock(p.id, p.stock)
                              }
                            }}
                            className={`
                              w-24 h-9 rounded-lg border text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500
                              ${isLowStock ? 'border-orange-400' : 'border-slate-200'}
                            `}
                          />
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
                              className="p-1.5 rounded-md hover:bg-white/50 transition"
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
    </div>
  )
}


