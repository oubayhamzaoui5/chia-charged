'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'

import { addVedetteProductAction, removeVedetteAction } from './actions'

type VedetteProduct = {
  id: string
  name: string
  slug: string
  sku: string
  price: number
  promoPrice: number | null
  imageUrl?: string
  isActive: boolean
  inView: boolean
  stock: number
}

type Vedette = {
  id: string
  productId: string
  product: VedetteProduct | null
}

const MAX_VEDETTES = 6

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`
}

export default function VedettesClient({
  initialVedettes,
  allProducts,
}: {
  initialVedettes: Vedette[]
  allProducts: VedetteProduct[]
}) {
  const [vedettes, setVedettes] = useState<Vedette[]>(initialVedettes)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)

  const selectedProductIds = useMemo(
    () => new Set(vedettes.map((item) => item.productId)),
    [vedettes]
  )

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allProducts
    return allProducts.filter((product) => {
      return (
        product.name.toLowerCase().includes(q) ||
        product.slug.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q)
      )
    })
  }, [allProducts, query])

  async function addProduct(product: VedetteProduct) {
    if (selectedProductIds.has(product.id)) {
      setNotice('This product is already in the selection.')
      return
    }
    if (vedettes.length >= MAX_VEDETTES) {
      setNotice(`Maximum ${MAX_VEDETTES} products.`)
      return
    }

    setPendingProductId(product.id)
    setNotice(null)
    try {
      const result = await addVedetteProductAction(product.id)
      if (result.status === 'exists') {
        setNotice('This product is already in the selection.')
        return
      }

      setVedettes((prev) => [
        ...prev,
        {
          id: result.vedetteId,
          productId: product.id,
          product,
        },
      ])
      setNotice('Product added to Best Sellers.')
    } catch (error) {
      console.error(error)
      setNotice('Failed to add product.')
    } finally {
      setPendingProductId(null)
    }
  }

  async function removeProduct(vedette: Vedette) {
    setPendingRemoveId(vedette.id)
    setNotice(null)
    try {
      await removeVedetteAction(vedette.id)
      setVedettes((prev) => prev.filter((item) => item.id !== vedette.id))
      setNotice('Product removed from Best Sellers.')
    } catch (error) {
      console.error(error)
      setNotice('Failed to remove product.')
    } finally {
      setPendingRemoveId(null)
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-blue-600">Featured Products</h1>
        <p className="text-lg text-slate-600">
          Select up to {MAX_VEDETTES} products for the Best Sellers section on the homepage.
        </p>
      </div>

      {notice && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">
          {notice}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-slate-700">Current selection</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          {vedettes.length}/{MAX_VEDETTES}
        </span>
      </div>

      <section className="mb-10">
        {vedettes.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-600">
            No featured products.
          </div>
        ) : (
          <div className="grid gap-3">
            {vedettes.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-md bg-slate-100">
                    {item.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.product?.name ?? 'Deleted product'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.product?.sku || item.product?.slug || item.productId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.product ? (
                    <span className="text-sm font-medium text-slate-700">
                      {formatPrice(item.product.promoPrice ?? item.product.price)}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeProduct(item)}
                    disabled={pendingRemoveId === item.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-800">Add a product</h2>
        </div>

        <div className="mb-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, slug or SKU..."
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filteredProducts.map((product) => {
            const isSelected = selectedProductIds.has(product.id)
            const disabled = isSelected || vedettes.length >= MAX_VEDETTES

            return (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                  <p className="truncate text-xs text-slate-500">{product.sku || product.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => addProduct(product)}
                  disabled={disabled || pendingProductId === product.id}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {isSelected ? 'Selected' : 'Add'}
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
