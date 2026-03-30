'use client'

import { useMemo, useState } from 'react'
import EmptyState from '@/components/admin/empty-state'
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  updateCategoryAction,
} from './actions'
import { useAdminToast } from '@/components/admin/AdminToast'
import { slugify } from '@/utils/slug'

type Category = {
  id: string
  name: string
  slug: string
  order: number
}

type EditState = { mode: 'create' } | { mode: 'edit'; id: string }

const inputClasses =
  'mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/5 placeholder:text-[#9CA3AF] bg-white'

function compareCategories(a: Category, b: Category) {
  const orderA = Number.isFinite(a.order) ? a.order : 0
  const orderB = Number.isFinite(b.order) ? b.order : 0
  if (orderA !== orderB) return orderA - orderB
  return a.name.localeCompare(b.name)
}

export default function CategoriesClient(props: { initialCategories: Category[] }) {
  const { initialCategories } = props

  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ mode: 'create' })
  const [form, setForm] = useState({ name: '', slug: '' })
  const { toast, ToastContainer } = useAdminToast()

  const nextOrderValue = useMemo(
    () =>
      categories.reduce((max, item) => {
        const value = Number.isFinite(item.order) ? item.order : 0
        return Math.max(max, value)
      }, 0) + 1,
    [categories]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
  }, [categories, query])

  const visible = useMemo(() => filtered.slice().sort(compareCategories), [filtered])

  function resetForm() {
    setForm({ name: '', slug: '' })
  }

  function openCreate() {
    setEditState({ mode: 'create' })
    resetForm()
    setOpen(true)
  }

  function openEdit(cat: Category) {
    setEditState({ mode: 'edit', id: cat.id })
    setForm({
      name: cat.name ?? '',
      slug: slugify(cat.slug || cat.name || ''),
    })
    setOpen(true)
  }

  async function submitCategory() {
    const name = form.name.trim()
    if (!name) {
      toast('Please fill the required field: Name.', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name,
        slug: form.slug || slugify(name),
        order:
          editState.mode === 'edit'
            ? categories.find((item) => item.id === editState.id)?.order ?? 0
            : nextOrderValue,
      }

      if (editState.mode === 'create') {
        const created = await createCategoryAction(payload)
        const rec: Category = {
          id: created.id,
          name: created.name ?? payload.name,
          slug: created.slug ?? payload.slug,
          order: Number(created.order ?? payload.order ?? 0),
        }
        setCategories((prev) => [...prev, rec])
        toast('Category created successfully.', 'success')
      } else {
        const updatedRec = await updateCategoryAction(editState.id, payload)
        const updated: Category = {
          id: updatedRec.id,
          name: updatedRec.name ?? payload.name,
          slug: updatedRec.slug ?? payload.slug,
          order: Number(updatedRec.order ?? payload.order ?? 0),
        }
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        toast('Category updated successfully.', 'success')
      }

      setOpen(false)
      resetForm()
    } catch (e) {
      console.error(e)
      toast('Failed to save category.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category?')) return
    try {
      await deleteCategoryAction(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast('Category deleted.', 'success')
    } catch (e) {
      console.error(e)
      toast('Failed to delete category.', 'error')
    }
  }

  async function moveCategory(catId: string, siblings: Category[], direction: 'up' | 'down') {
    if (movingId) return
    const currentIndex = siblings.findIndex((item) => item.id === catId)
    if (currentIndex < 0) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= siblings.length) return

    const reordered = siblings.slice()
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, moved)

    const updates = reordered.map((item, index) => ({
      id: item.id,
      order: index + 1,
    }))
    const updatesMap = new Map(updates.map((item) => [item.id, item.order]))
    const snapshot = categories

    setMovingId(catId)
    setCategories((prev) =>
      prev.map((item) =>
        updatesMap.has(item.id) ? { ...item, order: updatesMap.get(item.id) ?? item.order } : item
      )
    )

    try {
      await reorderCategoriesAction(updates)
      toast('Category order updated.', 'success')
    } catch (e) {
      console.error(e)
      setCategories(snapshot)
      toast('Failed to update category order.', 'error')
    } finally {
      setMovingId(null)
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
          Catalog
        </p>
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>
            Categories
          </h1>
          <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
            {visible.length} result{visible.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
          Manage and organize all product categories.
        </p>
      </div>

      <div className="mb-6 flex flex-col items-center gap-3 md:flex-row">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
            style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#111827' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#4F46E5')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E8EAED')}
          />
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#4F46E5' }}
        >
          <Plus className="h-5 w-5" />
          New category
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No categories found" description="Try adjusting your search or add a new category." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-left text-sm font-medium text-slate-600">Category</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-slate-600">Order</th>
                <th className="py-3 px-4 text-center text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((cat, index) => (
                <tr key={cat.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4">
                    <span className="font-medium text-slate-800">{cat.name}</span>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">#{cat.order}</td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => moveCategory(cat.id, visible, 'up')}
                        disabled={index === 0 || movingId === cat.id || query.trim().length > 0}
                        className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                        title={query.trim().length > 0 ? 'Clear search to reorder' : 'Move up'}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveCategory(cat.id, visible, 'down')}
                        disabled={index === visible.length - 1 || movingId === cat.id || query.trim().length > 0}
                        className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                        title={query.trim().length > 0 ? 'Clear search to reorder' : 'Move down'}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(cat)}
                        className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="inline-flex items-center rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editState.mode === 'create' ? 'Add category' : 'Edit category'}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="h-[calc(100%-5rem)] overflow-y-auto p-6">
              <div className="space-y-5">
                <div>
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={submitCategory}
                    disabled={saving}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {saving ? 'Saving...' : editState.mode === 'create' ? 'Add category' : 'Save changes'}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {ToastContainer}
    </div>
  )
}
