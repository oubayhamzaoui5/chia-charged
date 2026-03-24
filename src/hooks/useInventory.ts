'use client'

import { useMemo, useState } from 'react'
import type { ProductStock } from '@/types/inventory.types'

type UpdateStockFn = (id: string, stock: number) => Promise<void>

function sanitizeStock(raw: number) {
  if (!Number.isFinite(raw)) return 0
  return Math.max(0, Math.floor(raw))
}

export function useInventory(initialProducts: ProductStock[], updateStockOnServer: UpdateStockFn) {
  const [items, setItems] = useState(initialProducts)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] =
    useState<'sku' | 'stock-asc' | 'stock-desc'>('sku')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftStock, setDraftStock] = useState<number | null>(null)

  // FILTER + SORT
  const filtered = useMemo(() => {
    const q = query.toLowerCase()

    const result = items.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q)

      const matchCategory =
        !categoryFilter || p.categories?.includes(categoryFilter)

      return matchSearch && matchCategory
    })

    switch (sortBy) {
      case 'stock-asc':
        return [...result].sort((a, b) => a.stock - b.stock)

      case 'stock-desc':
        return [...result].sort((a, b) => b.stock - a.stock)

      default:
        return [...result].sort((a, b) =>
          (a.sku ?? '').localeCompare(b.sku ?? '', undefined, { numeric: true })
        )
    }
  }, [items, query, sortBy, categoryFilter])

  // API
  async function updateStock(id: string, stock: number) {
    const nextStock = sanitizeStock(stock)
    const prev = items

    setItems((current) =>
      current.map((p) => (p.id === id ? { ...p, stock: nextStock } : p))
    )

    try {
      await updateStockOnServer(id, nextStock)
    } catch (error) {
      setItems(prev)
      throw error
    }
  }

  return {
    filtered,

    query,
    setQuery,

    sortBy,
    setSortBy,

    categoryFilter,
    setCategoryFilter,

    editingId,
    setEditingId,

    draftStock,
    setDraftStock,

    updateStock,
  }
}
