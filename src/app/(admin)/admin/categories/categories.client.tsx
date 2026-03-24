'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, $createHeadingNode, $isHeadingNode } from '@lexical/rich-text'
import { ListNode, ListItemNode, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
} from 'lexical'
import EmptyState from '@/components/admin/empty-state'
import { slugify } from '@/utils/slug'
import { ArrowDown, ArrowUp, Bold, List, Pencil, Plus, Trash2, X, Search, ChevronDown } from 'lucide-react'
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  updateCategoryAction,
} from './actions'

type Category = {
  id: string
  name: string
  slug: string
  order: number
  parents: string[]
  desc?: string | null
  promo: number
  activeAll: boolean
  coverImage?: string | null
  coverImageUrl?: string
  features: string[]
}

type EditState =
  | { mode: 'create' }
  | { mode: 'edit'; id: string }

const inputClasses =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400'

const descEditorTheme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'text-slate-400',
  paragraph: 'mb-2',
  text: { bold: 'font-bold' },
  list: { ul: 'ml-6 list-disc', listItem: 'pl-1' },
  heading: {
    h1: 'mb-3 text-2xl font-bold text-[var(--accent)]',
    h2: 'mb-2 text-xl font-semibold text-black',
  },
}

// Normalize "parent" or "parents" from PocketBase into an array of ids
function normalizeParentIds(p: unknown): string[] {
  if (!p) return []
  if (Array.isArray(p)) {
    return p
      .map((item) => {
        if (!item) return null
        if (typeof item === 'string') return item
        if (typeof item === 'object' && 'id' in item) return item.id as string
        return null
      })
      .filter((v): v is string => !!v)
  }
  if (typeof p === 'string') return [p]
  if (typeof p === 'object' && 'id' in p) return [p.id as string]
  return []
}

function compareCategories(a: Category, b: Category) {
  const orderA = Number.isFinite(a.order) ? a.order : 0
  const orderB = Number.isFinite(b.order) ? b.order : 0
  if (orderA !== orderB) return orderA - orderB
  return a.name.localeCompare(b.name)
}

function normalizeFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean)
      }
    } catch {
      return [trimmed]
    }
  }
  return []
}

function stripHtmlToText(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function CategoriesClient(props: { initialCategories: Category[] }) {
  const { initialCategories } = props

  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [movingId, setMovingId] = useState<string | null>(null)

  const [editState, setEditState] = useState<EditState>({ mode: 'create' })

  const [form, setForm] = useState({
    name: '',
    slug: '',
    order: '0',
    parents: [] as string[],
    desc: '',
    features: [] as string[],
    promo: '',
    activeAll: false,
  })
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState('')
  const coverPreviewObjectUrlRef = useRef<string | null>(null)
  const [descInitialHtml, setDescInitialHtml] = useState('')

  const nextOrderValue = useMemo(() => {
    return (
      categories.reduce((max, item) => {
        const value = Number.isFinite(item.order) ? item.order : 0
        return Math.max(max, value)
      }, 0) + 1
    )
  }, [categories])

  // UI state for custom parents dropdown
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false)
  const [parentSearch, setParentSearch] = useState('')
  const descEditorConfig = useMemo<InitialConfigType>(
    () => ({
      namespace: 'CategoryDescEditor',
      theme: descEditorTheme,
      nodes: [HeadingNode, ListNode, ListItemNode],
      onError: (error: Error) => console.error(error),
    }),
    []
  )

  // Keep slug auto-updated from name (internal)
  useEffect(() => {
    const s = slugify(form.name)
    setForm((prev) => ({ ...prev, slug: s }))
  }, [form.name])

  useEffect(() => {
    return () => {
      if (coverPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(coverPreviewObjectUrlRef.current)
      }
    }
  }, [])

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>()
    for (const c of categories) map.set(c.id, c)
    return map
  }, [categories])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return categories
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
    )
  }, [categories, query])

  // visible categories sorted by name
  const visible = useMemo(() => {
    return filtered.slice().sort(compareCategories)
  }, [filtered])

  const visibleIds = useMemo(
    () => new Set(visible.map((c) => c.id)),
    [visible]
  )

  // childrenByParentId: for table hierarchy
  const childrenByParentId = useMemo(() => {
    const m = new Map<string, Category[]>()
    for (const c of visible) {
      for (const pid of c.parents ?? []) {
        if (!visibleIds.has(pid)) continue // only group under visible parents
        if (!m.has(pid)) m.set(pid, [])
        m.get(pid)!.push(c)
      }
    }
    // sort each children list by custom order
    for (const [key, arr] of m.entries()) {
      arr.sort(compareCategories)
      m.set(key, arr)
    }
    return m
  }, [visible, visibleIds])

  // top level: those whose parents are not visible (or no parents)
  const topLevelCategories = useMemo(
    () =>
      visible.filter(
        (c) =>
          !(c.parents ?? []).some((pid) => visibleIds.has(pid))
      ),
    [visible, visibleIds]
  )

  // Options to show in the parents dropdown
  const parentOptions = useMemo(() => {
    const q = parentSearch.trim().toLowerCase()
    return categories
      .filter((c) =>
        editState.mode === 'edit'
          ? c.id !== editState.id // prevent selecting itself
          : true
      )
      .filter((c) =>
        !q ? true : c.name.toLowerCase().includes(q)
      )
      .sort(compareCategories)
  }, [categories, editState, parentSearch])

  function resetForm() {
    setForm({
      name: '',
      slug: '',
      order: String(nextOrderValue),
      parents: [],
      desc: '',
      features: [],
      promo: '',
      activeAll: false,
    })
    setDescInitialHtml('')
    setCoverImageFile(null)
    setCoverImagePreview('')
    if (coverPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(coverPreviewObjectUrlRef.current)
      coverPreviewObjectUrlRef.current = null
    }
    setParentSearch('')
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
      order: String(cat.order ?? 0),
      parents: cat.parents ?? [],
      desc: cat.desc ?? '',
      features: cat.features ?? [],
      promo: cat.promo > 0 ? String(cat.promo) : '',
      activeAll: !!cat.activeAll,
    })
    setDescInitialHtml(cat.desc ?? '')
    setCoverImageFile(null)
    setCoverImagePreview(cat.coverImageUrl ?? '')
    if (coverPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(coverPreviewObjectUrlRef.current)
      coverPreviewObjectUrlRef.current = null
    }
    setParentSearch('')
    setOpen(true)
  }

  function onCoverImageChange(file: File | null) {
    setCoverImageFile(file)

    if (coverPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(coverPreviewObjectUrlRef.current)
      coverPreviewObjectUrlRef.current = null
    }

    if (!file) {
      if (editState.mode === 'edit') {
        const existing = categories.find((item) => item.id === editState.id)
        setCoverImagePreview(existing?.coverImageUrl ?? '')
      } else {
        setCoverImagePreview('')
      }
      return
    }

    const nextPreview = URL.createObjectURL(file)
    coverPreviewObjectUrlRef.current = nextPreview
    setCoverImagePreview(nextPreview)
  }

  function toggleParent(id: string) {
    setForm((prev) => {
      const exists = prev.parents.includes(id)
      return {
        ...prev,
        parents: exists
          ? prev.parents.filter((p) => p !== id)
          : [...prev.parents, id],
      }
    })
  }

  function closeParentDropdown() {
    setParentDropdownOpen(false)
    setParentSearch('')
  }

  function addFeatureRow() {
    setForm((prev) => ({
      ...prev,
      features: [...prev.features, ''],
    }))
  }

  function updateFeatureRow(index: number, nextValue: string) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.map((row, rowIndex) =>
        rowIndex === index ? nextValue : row
      ),
    }))
  }

  function removeFeatureRow(index: number) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, rowIndex) => rowIndex !== index),
    }))
  }

  async function submitCategory() {
    if (!form.name) {
      setNotice('Please fill the required field: Name.')
      return
    }

    setSaving(true)
    setNotice(null)

    try {
      const features = form.features.map((item) => item.trim()).filter(Boolean)

      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        order: form.order.trim() === '' ? nextOrderValue : Number(form.order),
        parentIds: form.parents,
        desc: form.desc || '',
        features,
        promo: form.promo.trim() === '' ? 0 : Number(form.promo),
        activeAll: form.activeAll,
        coverImage: coverImageFile,
      }

      if (editState.mode === 'create') {
        const created = await createCategoryAction(payload)
        const rec: Category = {
          id: created.id,
          name: created.name ?? payload.name,
          slug: created.slug ?? payload.slug,
          order: Number(created.order ?? payload.order ?? 0),
          parents: normalizeParentIds(created.parent ?? payload.parentIds),
          desc: created.desc ?? payload.desc,
          features: normalizeFeatures(created.features ?? payload.features),
          promo: Number(created.promo ?? payload.promo ?? 0),
          activeAll: Boolean(created.activeAll ?? payload.activeAll),
          coverImage: typeof created.coverImage === 'string' ? created.coverImage : null,
          coverImageUrl: coverImagePreview || undefined,
        }
        setCategories((prev) => [...prev, rec])
        setNotice('Category created successfully.')
      } else {
        const id = editState.id
        const updatedRec = await updateCategoryAction(id, payload)
        const updated: Category = {
          id: updatedRec.id,
          name: updatedRec.name ?? payload.name,
          slug: updatedRec.slug ?? payload.slug,
          order: Number(updatedRec.order ?? payload.order ?? 0),
          parents: normalizeParentIds(updatedRec.parent ?? payload.parentIds),
          desc: updatedRec.desc ?? payload.desc,
          features: normalizeFeatures(updatedRec.features ?? payload.features),
          promo: Number(updatedRec.promo ?? payload.promo ?? 0),
          activeAll: Boolean(updatedRec.activeAll ?? payload.activeAll),
          coverImage: typeof updatedRec.coverImage === 'string' ? updatedRec.coverImage : null,
          coverImageUrl: coverImagePreview || undefined,
        }
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        setNotice('Category updated successfully.')
      }

      setOpen(false)
      resetForm()
      closeParentDropdown()
    } catch (e) {
      console.error(e)
      setNotice(
        'Failed to save category. Check your PocketBase URL, collection fields, and rules.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category?')) return
    try {
      await deleteCategoryAction(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      setNotice('Category deleted.')
    } catch (e) {
      console.error(e)
      setNotice('Failed to delete category.')
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
    setNotice(null)
    setCategories((prev) =>
      prev.map((item) =>
        updatesMap.has(item.id)
          ? { ...item, order: updatesMap.get(item.id) ?? item.order }
          : item
      )
    )

    try {
      await reorderCategoriesAction(updates)
      setNotice('Category order updated.')
    } catch (e) {
      console.error(e)
      setCategories(snapshot)
      setNotice('Failed to update category order.')
    } finally {
      setMovingId(null)
    }
  }

  const selectedParents = form.parents
    .map((id) => categoryById.get(id))
    .filter((c): c is Category => !!c)

  const parentSummary =
    selectedParents.length === 0
      ? 'No parent categories'
      : selectedParents.length === 1
        ? selectedParents[0].name
        : `${selectedParents[0].name} + ${selectedParents.length - 1} others`

  // Recursive renderer so children-of-children (and deeper) are shown
  function renderRows(cats: Category[], level = 0): React.ReactNode {
    return cats.map((cat, index) => {
      const children = childrenByParentId.get(cat.id) ?? []

      const rowClass = 'border-b border-slate-100 hover:bg-slate-50'

      return (
        <Fragment key={cat.id}>
          <tr className={rowClass}>
            <td className="py-4 px-4">
              <div
                className="flex items-center gap-2"
                style={{ paddingLeft: level * 18 }}
              >
                {level > 0 && (
                  <span className="text-slate-400 text-[20px]">
                    {'->'}
                  </span>
                )}
                <div className="relative inline-block pr-8">
                  <span
                    className={
                      level === 0
                        ? 'text-blue-600 font-medium'
                        : 'text-slate-700 font-medium'
                    }
                  >
                    {cat.name}
                  </span>
                  <span className="ml-2 text-xs text-slate-400">#{cat.order}</span>
                  {cat.promo > 0 && (
                    <span className="absolute -right-1 -top-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                      {cat.promo}%
                    </span>
                  )}
                </div>
              </div>
            </td>
            <td className="py-4 px-4 text-slate-600 text-sm">
              {cat.desc ? (
                <span className="line-clamp-2">{stripHtmlToText(cat.desc)}</span>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </td>
            <td className="py-4 px-4">
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => moveCategory(cat.id, cats, 'up')}
                  disabled={index === 0 || movingId === cat.id}
                  className="inline-flex items-center rounded-lg px-2 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Move up ${cat.name}`}
                  title="Move up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveCategory(cat.id, cats, 'down')}
                  disabled={index === cats.length - 1 || movingId === cat.id}
                  className="inline-flex items-center rounded-lg px-2 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Move down ${cat.name}`}
                  title="Move down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => openEdit(cat)}
                  className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  aria-label={`Edit ${cat.name}`}
                  title="Edit"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                  aria-label={`Delete ${cat.name}`}
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </button>
              </div>
            </td>
          </tr>

          {/* recursively render children */}
          {children.length > 0 && renderRows(children, level + 1)}
        </Fragment>
      )
    })
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">
          Categories
        </h1>
        <p className="text-slate-600 text-lg">
          Manage and organize all product categories.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 transition-all"
          />
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
        >
          <Plus className="h-5 w-5" />
          New category
        </button>
      </div>

      {/* Notice */}
      {notice && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-slate-700">
          {notice}
        </div>
      )}

      {/* Table list */}
      {visible.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="Try adjusting your search or add a new category."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
               <th className="py-4 text-left text-slate-700 font-semibold text-base w-1/4">
      Category
    </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Description</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {renderRows(topLevelCategories)}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over Add/Edit Category */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => {
              setOpen(false)
              closeParentDropdown()
            }}
          />
          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editState.mode === 'create' ? 'Add category' : 'Edit category'}
              </h2>
              <button
                onClick={() => {
                  setOpen(false)
                  closeParentDropdown()
                }}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="h-[calc(100%-5rem)] overflow-y-auto p-6">
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Order</label>
                    <input
                      type="number"
                      min={0}
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: e.target.value })}
                      className={inputClasses}
                    />
                  </div>

                  {/* Custom multi-select dropdown with search + checkboxes */}
                  <div className="relative">
                    <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Parent categories
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setParentDropdownOpen((v) => !v)
                      }
                      className="mt-1.5 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-3 text-left text-sm text-slate-700 transition-all focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"
                    >
                      <span
                        className={
                          selectedParents.length === 0
                            ? 'text-slate-400'
                            : ''
                        }
                      >
                        {parentSummary}
                      </span>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </button>

                    {parentDropdownOpen && (
                      <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
                        {/* Search */}
                        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                          <Search className="h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search categories..."
                            value={parentSearch}
                            onChange={(e) =>
                              setParentSearch(e.target.value)
                            }
                            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                          />
                        </div>

                        {/* Options */}
                        <div className="max-h-56 overflow-y-auto p-1.5 text-sm">
                          {parentOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-slate-500">
                              No categories found.
                            </div>
                          ) : (
                            parentOptions.map((cat) => {
                              const checked = form.parents.includes(
                                cat.id
                              )
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => toggleParent(cat.id)}
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50"
                                >
                                  <span
                                    className={`inline-flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                                      checked
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-300 bg-white text-transparent'
                                    }`}
                                  >
                                    ✓
                                  </span>
                                  <span className={`truncate text-sm ${checked ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                                    {cat.name}
                                  </span>
                                </button>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}

                    <p className="mt-1.5 text-xs text-slate-500">
                      You can select multiple parent categories.
                    </p>
                  </div>

                  <div>
                    <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Description
                    </label>
                    <div className="mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <LexicalComposer
                        initialConfig={descEditorConfig}
                        key={`${editState.mode}-${editState.mode === 'edit' ? editState.id : 'create'}`}
                      >
                        <CategoryDescToolbar />
                        <div className="relative">
                          <RichTextPlugin
                            contentEditable={
                              <ContentEditable className="min-h-[220px] p-4 text-sm leading-relaxed text-slate-800 outline-none" />
                            }
                            placeholder={
                              <div className="pointer-events-none absolute left-4 top-4 text-sm text-slate-400">
                                Write the category description...
                              </div>
                            }
                            ErrorBoundary={LexicalErrorBoundary}
                          />
                          <HistoryPlugin />
                          <ListPlugin />
                          <EditorInitialHtmlPlugin initialHtml={descInitialHtml} />
                          <EditorOnChangePlugin onChange={(value) => setForm((prev) => ({ ...prev, desc: value }))} />
                        </div>
                      </LexicalComposer>
                    </div>
                  </div>

                  <div>
                    <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Cover image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onCoverImageChange(e.target.files?.[0] ?? null)}
                      className={`${inputClasses} file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100`}
                    />
                    {coverImagePreview ? (
                      <div className="mt-2 aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        <img src={coverImagePreview} alt="Category cover preview" className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/30 p-5">
                    <div className="flex items-center justify-between">
                      <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Features
                      </label>
                      <button
                        type="button"
                        onClick={addFeatureRow}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-blue-600 shadow-sm transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    </div>

                    {form.features.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center">
                        <p className="text-xs italic text-slate-400">No features added.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {form.features.map((row, index) => (
                          <div key={index} className="group flex items-center gap-2">
                            <input
                              type="text"
                              value={row}
                              onChange={(e) => updateFeatureRow(index, e.target.value)}
                              placeholder="Feature"
                              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5"
                            />
                            <button
                              type="button"
                              onClick={() => removeFeatureRow(index)}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Promo (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.promo}
                        onChange={(e) => setForm({ ...form, promo: e.target.value })}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Global activation
                      </label>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, activeAll: !prev.activeAll }))}
                        className={`mt-1.5 inline-flex h-[44px] w-full items-center rounded-xl border px-4 text-sm font-medium transition-colors ${
                          form.activeAll
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50/30 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {form.activeAll ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={submitCategory}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {saving
                      ? 'Saving...'
                      : editState.mode === 'create'
                      ? 'Add category'
                      : 'Save changes'}
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false)
                      closeParentDropdown()
                    }}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function CategoryDescToolbar() {
  const [editor] = useLexicalComposerContext()
  const [activeBlock, setActiveBlock] = useState<'h1' | 'h2' | 'p' | null>(null)
  const [isBold, setIsBold] = useState(false)

  function setBlock(tag: 'h1' | 'h2' | 'p') {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      if (tag === 'p') {
        selection.insertNodes([$createParagraphNode()])
        return
      }
      selection.insertNodes([$createHeadingNode(tag)])
    })
  }

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      let nextBlock: 'h1' | 'h2' | 'p' | null = null
      let nextBold = false

      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return

        nextBold = selection.hasFormat('bold')

        const anchorNode = selection.anchor.getNode()
        const topLevel = anchorNode.getTopLevelElementOrThrow()

        if ($isHeadingNode(topLevel)) {
          const headingTag = topLevel.getTag()
          if (headingTag === 'h1' || headingTag === 'h2') {
            nextBlock = headingTag
            return
          }
        }

        if (topLevel.getType() === 'paragraph') {
          nextBlock = 'p'
        }
      })

      setActiveBlock(nextBlock)
      setIsBold(nextBold)
    })
  }, [editor])

  const blockBtnClass = (isActive: boolean) =>
    `rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
      isActive
        ? 'border-blue-300 bg-blue-100 text-blue-700'
        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
    }`

  const formatBtnClass = (isActive: boolean) =>
    `rounded-lg border p-1.5 transition ${
      isActive
        ? 'border-blue-300 bg-blue-100 text-blue-700'
        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
    }`

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
      <button type="button" onClick={() => setBlock('h1')} className={blockBtnClass(activeBlock === 'h1')}>
        H1
      </button>
      <button type="button" onClick={() => setBlock('h2')} className={blockBtnClass(activeBlock === 'h2')}>
        H2
      </button>
      <button type="button" onClick={() => setBlock('p')} className={blockBtnClass(activeBlock === 'p')}>
        P
      </button>
      <div className="mx-0.5 h-4 w-px bg-slate-300" />
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        className={formatBtnClass(isBold)}
        title="Gras"
        aria-label="Gras"
      >
        <Bold size={14} />
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
        className={formatBtnClass(false)}
        title="Liste a puces"
        aria-label="Liste a puces"
      >
        <List size={14} />
      </button>
    </div>
  )
}

function EditorOnChangePlugin({ onChange }: { onChange: (value: string) => void }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        onChange($generateHtmlFromNodes(editor, null))
      })
    })
  }, [editor, onChange])

  return null
}

function EditorInitialHtmlPlugin({ initialHtml }: { initialHtml: string }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot()
      root.clear()

      if (!initialHtml) {
        root.append($createParagraphNode())
        return
      }

      const parser = new DOMParser()
      const dom = parser.parseFromString(initialHtml, 'text/html')
      const nodes = $generateNodesFromDOM(editor, dom)
      if (nodes.length > 0) {
        root.append(...nodes)
      } else {
        root.append($createParagraphNode())
      }
    })
  }, [editor, initialHtml])

  return null
}


