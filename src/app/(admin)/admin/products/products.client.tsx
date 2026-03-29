'use client'

import { useMemo, useState } from 'react'
import EmptyState from '@/components/admin/empty-state'
import { Plus, Search } from 'lucide-react'
import type { Product, CategoryOption, ID } from '@/types/product.types'
import { fileUrl } from '@/utils/product.utils'
import { Price } from '@/components/admin/Price'
import ProductCard from '@/components/admin/ProductCard'
import ProductForm from '@/components/admin/ProductForm'
import { useProducts } from '@/hooks/useProducts'

type ProductsClientProps = {
  initialProducts: Product[]
  totalItems: number
  initialPage: number
  perPage: number
  initialQuery: string
  initialSort: 'name' | 'price'
  allCategories: CategoryOption[]
  parentVariantKeys: { key: string; value: string }[]
  variables: any[]
  parent?: Product
}

export default function ProductsClient({
  initialProducts,
  perPage,
  initialPage,
  initialQuery,
  initialSort,
  allCategories,
  parentVariantKeys,
  variables,
  parent,
}: ProductsClientProps) {
  const {
    products,
    pageItems,
    totalPages,
    query,
    setQuery,
    sortBy,
    setSortBy,
    page,
    setPage,
    open,
    setOpen,
    adding,
    notice,
    form,
    setForm,
    categoryDropdownOpen,
    setCategoryDropdownOpen,
    categorySearch,
    setCategorySearch,
    createdProductId,
    isVariant,
    setIsVariant,
    isParent,
    setIsParent,
    parentId,
    setParentId,
    variantKey,
    setVariantKey,
    editState,
    categoryFilter,
    setCategoryFilter,
    create,
    remove,
    updateVariantValue,
    openCreateForm,
    openEditForm,
    submitProduct,
  } = useProducts({
    initialProducts,
    perPage,
    initialPage,
    initialQuery,
    initialSort,
    allCategories,
    parent,
  })

  const [imageIndexes, setImageIndexes] = useState<Record<ID, number>>({})

  const categoryMap = useMemo(() => {
    const m = new Map<string, CategoryOption>()
    for (const c of allCategories) m.set(c.id, c)
    return m
  }, [allCategories])

  const relatedProductOptions = useMemo(() => {
    return products
      .filter((product) => product.isParent || !product.isVariant)
      .map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
      }))
  }, [products])

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
            Catalog
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>
            {parent ? `Variants of ${parent.name}` : 'Products'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
            {parent
              ? 'Manage variants for the selected product'
              : 'Manage your product catalog'}
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
          style={{ background: '#4F46E5' }}
        >
          <Plus className="h-4 w-4" />
          {parent ? 'New variant' : 'New product'}
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search by reference or name..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              border: '1px solid #E8EAED',
              background: '#FFFFFF',
              color: '#111827',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#4F46E5')}
            onBlur={e => (e.currentTarget.style.borderColor = '#E8EAED')}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#374151' }}
        >
          <option value="">All categories</option>
          {allCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'price')}
          className="rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#374151' }}
        >
          <option value="name">Sort by name</option>
          <option value="price">Sort by price</option>
        </select>
      </div>

      {notice && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>
          {notice}
        </div>
      )}

      {/* Result count */}
      <p className="text-sm" style={{ color: '#9CA3AF' }}>
        {products.length === 0
          ? 'No products'
          : `${pageItems.length > 0 ? (page - 1) * perPage + 1 : 0}–${Math.min(page * perPage, products.filter(p => !categoryFilter || p.categories?.includes(categoryFilter)).length)} of ${products.filter(p => !categoryFilter || p.categories?.includes(categoryFilter)).length} product${products.length !== 1 ? 's' : ''}`}
      </p>

      {pageItems.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Adjust your filters or add a new product"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            {pageItems.map((p) => {
              const imgs = p.images ?? []
              const currentIndex = imageIndexes[p.id] ?? 0
              const hasImages = imgs.length > 0
              const clampedIndex = hasImages
                ? Math.max(0, Math.min(currentIndex, imgs.length - 1))
                : 0
              const currentSrc = hasImages
                ? fileUrl(p.id, imgs[clampedIndex])
                : '/aboutimg.webp'
              const cats = (p.categories || [])
                .map((id) => categoryMap.get(id))
                .filter(Boolean) as CategoryOption[]

              return (
                <div key={p.id} className="col-span-1 h-full flex">
                  <ProductCard
                    product={p}
                    imageSrc={currentSrc}
                    categories={cats}
                    parentVariantKeys={parentVariantKeys}
                    variables={variables}
                    openEdit={openEditForm}
                    deleteProduct={remove}
                    updateVariantValue={updateVariantValue}
                    Price={Price}
                  />
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#374151' }}
              >
                ← Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-sm" style={{ color: '#9CA3AF' }}>…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className="h-9 w-9 rounded-xl text-sm font-medium transition-colors"
                        style={{
                          background: page === p ? '#4F46E5' : '#FFFFFF',
                          color: page === p ? '#FFFFFF' : '#374151',
                          border: `1px solid ${page === p ? '#4F46E5' : '#E8EAED'}`,
                        }}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#374151' }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {open && (
        <ProductForm
          open={open}
          setOpen={setOpen}
          form={form}
          setForm={setForm}
          allCategories={allCategories}
          categoryDropdownOpen={categoryDropdownOpen}
          setCategoryDropdownOpen={setCategoryDropdownOpen}
          categorySearch={categorySearch}
          setCategorySearch={setCategorySearch}
          editState={editState}
          createdProductId={createdProductId}
          isVariant={isVariant}
          setIsVariant={setIsVariant}
          isParent={isParent}
          setIsParent={setIsParent}
          parentId={parentId}
          setParentId={setParentId}
          variantKey={variantKey}
          setVariantKey={setVariantKey}
          hideCollectionToggle={Boolean(parent)}
          submitProduct={submitProduct}
          adding={adding}
          relatedProductOptions={relatedProductOptions}
          parentSku={parent?.sku}
        />
      )}
    </div>
  )
}
