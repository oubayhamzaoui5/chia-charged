'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  updateVariantKeyAction,
} from '@/app/(admin)/admin/products/actions'
import { normalizeRelationIds } from '@/utils/product.utils'
import type {
  Product,
  CategoryOption,
  EditState,
  ID,
} from '@/types/product.types'

function parseNumericInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const maybeError = error as {
      message?: unknown
      response?: { message?: unknown; data?: unknown }
    }

    const responseData = maybeError.response?.data
    if (responseData && typeof responseData === 'object') {
      const fieldErrors = Object.entries(responseData as Record<string, unknown>)
        .map(([field, detail]) => {
          if (!detail || typeof detail !== 'object') return null
          const message = (detail as { message?: unknown }).message
          if (typeof message !== 'string' || !message.trim()) return null
          return `${field}: ${message}`
        })
        .filter((item): item is string => !!item)

      if (fieldErrors.length > 0) return fieldErrors.join(' | ')
    }

    const responseMessage = maybeError.response?.message
    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage
    }

    if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
      return maybeError.message
    }
  }

  return fallback
}

function sanitizeVariantKey(input: Record<string, string | null>): Record<string, string> {
  const cleaned: Record<string, string> = {}
  for (const [rawKey, rawValue] of Object.entries(input)) {
    const key = rawKey.trim()
    const value = (rawValue ?? '').trim()
    if (!key || !value) continue
    cleaned[key] = value
  }
  return cleaned
}

type UseProductsProps = {
  initialProducts: Product[]
  perPage: number
  initialPage: number
  initialQuery: string
  initialSort: 'name' | 'price'
  allCategories: CategoryOption[]
  parent?: Product
}

export function useProducts({
  initialProducts,
  perPage,
  initialPage,
  initialQuery,
  initialSort,
  allCategories,
  parent,
}: UseProductsProps) {
  // State
  const [products, setProducts] = useState<Product[]>(initialProducts ?? [])
  const [query, setQuery] = useState(initialQuery || '')
  const [sortBy, setSortBy] = useState<'name' | 'price'>(initialSort)
  const [page, setPage] = useState(initialPage)
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ mode: 'create' })
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)

  // Auto-dismiss notice after 5 seconds
  const setTimedNotice = useCallback((message: string) => {
    setNotice(message)
    setTimeout(() => setNotice(null), 5000)
  }, [])

  // Filtered and sorted products
  const filtered = useMemo(() => {
    const q = query.toLowerCase()

    return products
      .filter(
        (p) =>
          // Match query
          (p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q)) &&
          // Match category
          (!categoryFilter ||
            p.categories?.some?.((c) => c === categoryFilter) ||
            p.categories.includes(categoryFilter))
      )
      .sort((a, b) =>
        sortBy === 'name'
          ? a.name.localeCompare(b.name)
          : a.price - b.price
      )
  }, [products, query, sortBy, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))

  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page, perPage])

  // Form state
  const [form, setForm] = useState({
    sku: '',
    name: '',
    price: '',
    promoPrice: '',
    description: '',
    isActive: true,
    inView: true,
    currency: '$',
    slug: '',
    existing: [] as string[],
    files: [] as File[],
    categories: [] as string[],
  })

  const [isVariant, setIsVariant] = useState(false)
  const [parentId, setParentId] = useState<string | null>(null)
  const [isParent, setIsParent] = useState(false)
  const [variantKey, setVariantKey] = useState<Record<string, string | null>>({})

  // Reset form
  const resetForm = useCallback(() => {
    setForm({
      sku: '',
      name: '',
      price: '',
      promoPrice: '',
      description: '',
      isActive: true,
      inView: true,
      currency: '$',
      slug: '',
      existing: [],
      files: [],
      categories: [],
    })
    setIsVariant(false)
    setIsParent(false)
    setParentId(null)
    setVariantKey({})
  }, [])

  // Open create form
  const openCreateForm = useCallback(() => {
    setEditState({ mode: 'create' })

    if (parent) {
      // Prefill for variant
      setForm({
        sku: parent.sku ?? '',
        name: parent.name ?? '',
        price: parent.price ? String(parent.price) : '',
        promoPrice: parent.promoPrice != null ? String(parent.promoPrice) : '',
        description: parent.description ?? '',
        isActive: true,
        inView: true,
        currency: '$',
        slug: '',
        existing: [],
        files: [],
        categories: Array.isArray(parent.categories)
          ? parent.categories.slice()
          : normalizeRelationIds(parent.expand?.category),
      })
      setParentId(parent.id)
      setIsVariant(true)
      setIsParent(false)
      setVariantKey({})
    } else {
      resetForm()
      setIsParent(false)
    }

    setOpen(true)
  }, [parent, resetForm])

  // Open edit form
  const openEditForm = useCallback((p: Product) => {
    setEditState({ mode: 'edit', id: p.id })
    setForm({
      sku: p.sku ?? '',
      name: p.name ?? '',
      price: p.price ? String(p.price) : '',
      promoPrice: p.promoPrice != null ? String(p.promoPrice) : '',
      description: p.description ?? '',
      isActive: !!p.isActive,
      inView: p.inView ?? true,
      currency: typeof p.currency === 'string' && p.currency ? p.currency : 'DT',
      slug: '',
      existing: Array.isArray(p.images) ? p.images.slice() : [],
      files: [],
      categories: Array.isArray(p.categories) ? p.categories.slice() : [],
    })
    setIsVariant(p.isVariant ?? false)
    setIsParent(p.isParent ?? (!p.isVariant && !p.parent))
    setParentId(p.parent ?? null)
    setVariantKey(p.variantKey ?? {})
    setOpen(true)
  }, [])

  // Create product
  const create = useCallback(
    async (fd: FormData, categories: string[]) => {
      setAdding(true)
      try {
        const rec = await createProductAction(fd)
        setCreatedProductId(rec.id)

        const normalized: Product = {
          ...rec,
          categories,
        }

        setProducts((prev) => [normalized, ...prev])
        setTimedNotice('Product created successfully')
        setOpen(false)
        resetForm()
      } catch (e) {
        setTimedNotice(extractErrorMessage(e, 'Failed to create product'))
        console.error('Create product error:', e)
      } finally {
        setAdding(false)
      }
    },
    [resetForm, setTimedNotice]
  )

  // Update product
  const update = useCallback(
    async (id: ID, fd: FormData, updatedCategories: string[]) => {
      setAdding(true)
      try {
        const rec = await updateProductAction(id, fd)

        setProducts((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...rec,
                  categories: updatedCategories,
                }
              : p
          )
        )

        setTimedNotice('Product updated successfully')
        setOpen(false)
        resetForm()
      } catch (e) {
        setTimedNotice(extractErrorMessage(e, 'Failed to update product'))
        console.error('Update product error:', e)
      } finally {
        setAdding(false)
      }
    },
    [resetForm, setTimedNotice]
  )

  // Delete product
  const remove = useCallback(
    async (id: ID) => {
      if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return
      }

      try {
        await deleteProductAction(id)
        setProducts((prev) => prev.filter((p) => p.id !== id))
        setTimedNotice('Product deleted successfully')
      } catch (e) {
        setTimedNotice(extractErrorMessage(e, 'Failed to delete product'))
        console.error('Delete product error:', e)
      }
    },
    [setTimedNotice]
  )

  // Update variant value
  const updateVariantValue = useCallback(
    async (variantId: ID, key: string, value: string) => {
      const product = products.find((p) => p.id === variantId)
      if (!product) return

      const newVariant = {
        ...(product.variantKey ?? {}),
        [key]: value,
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === variantId ? { ...p, variantKey: newVariant } : p
        )
      )

      try {
        await updateVariantKeyAction(variantId, newVariant)
      } catch (e) {
        console.error('Update variant key error:', e)
        // Revert on error
        setProducts((prev) =>
          prev.map((p) =>
            p.id === variantId ? { ...p, variantKey: product.variantKey } : p
          )
        )
        setTimedNotice(extractErrorMessage(e, 'Failed to update variant'))
      }
    },
    [products, setTimedNotice]
  )

  const submitProduct = useCallback(async () => {
    const sku = form.sku.trim()
    const name = form.name.trim()
    const price = parseNumericInput(form.price)
    const promoPrice = parseNumericInput(form.promoPrice)

    if (!sku || !name || price == null || price <= 0) {
      setTimedNotice('Please provide SKU, name, and a price greater than 0.')
      return
    }

    if (
      editState.mode === 'create' &&
      Boolean(parent) &&
      isVariant &&
      sku === (parent?.sku ?? '').trim()
    ) {
      setTimedNotice('Please change the SKU for this variant.')
      return
    }

    if (form.promoPrice.trim() && (promoPrice == null || promoPrice < 0)) {
      setTimedNotice('Promotion price must be a valid number.')
      return
    }

    const fd = new FormData()

    fd.set('sku', sku)
    fd.set('name', name)
    fd.set('price', String(price))
    fd.set('promoPrice', form.promoPrice.trim() === '' ? '' : String(promoPrice))
    fd.set('description', form.description)
    fd.set('isActive', String(form.isActive))
    fd.set('inView', String(form.inView))
    fd.set('currency', form.currency || 'DT')
    if (form.categories.length === 0) {
      fd.set('category', '')
    } else {
      for (const categoryId of form.categories) {
        fd.append('category', categoryId)
      }
    }

    const slugInput = form.slug.trim()
    const variantAutoSlug = isVariant ? `${name}-${sku}` : ''
    const effectiveSlug = slugInput || variantAutoSlug
    if (effectiveSlug) fd.set('slug', effectiveSlug)
    fd.set('isVariant', String(isVariant))
    fd.set('isParent', String(isParent))
    fd.set('parent', parentId ?? '')
    fd.set('variantKey', JSON.stringify(sanitizeVariantKey(variantKey)))

    if (editState.mode === 'create') {
      for (const file of form.files) {
        fd.append('images', file)
      }
      await create(fd, form.categories)
      return
    }

    // For edit, send the full desired image state:
    // - keep existing filenames that remain
    // - append newly uploaded files
    // This prevents PocketBase from replacing images with only the new files.
    if (form.existing.length === 0 && form.files.length === 0) {
      fd.set('images', '')
    } else {
      for (const existingFilename of form.existing) {
        fd.append('images', existingFilename)
      }
      for (const file of form.files) {
        fd.append('images', file)
      }
    }

    await update(editState.id, fd, form.categories)
  }, [
    create,
    editState,
    form,
    isParent,
    isVariant,
    parent,
    parentId,
    update,
    variantKey,
  ])

  return {
    // State
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
    setEditState,
    categoryFilter,
    setCategoryFilter,

    // CRUD
    create,
    update,
    remove,
    updateVariantValue,

    // Form handlers
    openCreateForm,
    openEditForm,
    resetForm,
    submitProduct,
  }
}

