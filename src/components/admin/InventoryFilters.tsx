import { Search } from 'lucide-react'
import type { CategoryOption } from '@/types/inventory.types'

type InventoryFiltersProps = {
  query: string
  setQuery: (value: string) => void
  sortBy: 'sku' | 'stock-asc' | 'stock-desc'
  setSortBy: (value: 'sku' | 'stock-asc' | 'stock-desc') => void
  categoryFilter: string
  setCategoryFilter: (value: string) => void
  allCategories: CategoryOption[]
}

export default function InventoryFilters({
  query,
  setQuery,
  sortBy,
  setSortBy,
  categoryFilter,
  setCategoryFilter,
  allCategories,
}: InventoryFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-3 md:flex-row">
      <div className="relative w-full flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Search by product name or reference..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        />
      </div>

      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
      >
        <option value="">All categories</option>
        {allCategories.map((c: CategoryOption) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as 'sku' | 'stock-asc' | 'stock-desc')}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
      >
        <option value="sku">Sort by reference</option>
        <option value="stock-asc">Stock: low to high</option>
        <option value="stock-desc">Stock: high to low</option>
      </select>
    </div>
  )
}
