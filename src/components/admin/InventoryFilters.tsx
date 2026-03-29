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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
        <input
          placeholder="Search by product name or reference..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
          style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#111827' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#4F46E5')}
          onBlur={e => (e.currentTarget.style.borderColor = '#E8EAED')}
        />
      </div>

      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#374151' }}
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
        className="rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#374151' }}
      >
        <option value="sku">Sort by reference</option>
        <option value="stock-asc">Stock: low to high</option>
        <option value="stock-desc">Stock: high to low</option>
      </select>
    </div>
  )
}
