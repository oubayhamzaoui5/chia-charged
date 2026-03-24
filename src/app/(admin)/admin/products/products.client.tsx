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
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            {parent ? `Variants of ${parent.name}` : 'Products'}
          </h1>
          <p className="text-slate-600 text-lg">
            {parent
              ? 'Manage variants for the selected product'
              : 'Manage your product catalog'}
          </p>
        </div>
        <button onClick={openCreateForm}           className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
>
          <Plus className="h-5 w-5" />
          {parent ? 'New variant' : 'New product'}
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by reference or name..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 transition-all"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm outline-none focus:border-blue-500"
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
          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm outline-none focus:border-blue-500"
        >
          <option value="name">Sort by name</option>
          <option value="price">Sort by price</option>
        </select>
      </div>

      {notice && (
        <div className="rounded-md border border-foreground/15 bg-foreground/5 px-4 py-3 text-sm">
          {notice}
        </div>
      )}

      {pageItems.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Adjust your filters or add a new product"
        />
      ) : (
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
