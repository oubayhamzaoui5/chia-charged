'use client'

import { useMemo, useState } from 'react'
import { Image, Trash2 } from 'lucide-react'

import { deleteVariableAction } from './actions'
import CreateVariable from './create-variable'
import { useAdminToast } from '@/components/admin/AdminToast'

type VariableRecord = {
  id: string
  name: string
  type: 'image'
  image?: string
}

export default function VariablesClient({
  variables: initialVariables,
}: {
  variables: VariableRecord[]
}) {
  const [variables, setVariables] = useState<VariableRecord[]>(initialVariables)
  const [query, setQuery] = useState('')
  const { toast, ToastContainer } = useAdminToast()

  const filteredImages = useMemo(() => {
    const lower = query.toLowerCase()
    return variables.filter((v) => v.name.toLowerCase().includes(lower))
  }, [query, variables])

  async function deleteVariable(id: string) {
    if (!confirm('Delete this variable?')) return
    const prev = variables
    setVariables((current) => current.filter((v) => v.id !== id))
    try {
      await deleteVariableAction(id)
      toast('Variable deleted.', 'success')
    } catch (error) {
      console.error(error)
      setVariables(prev)
      toast('Delete failed.', 'error')
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
          Catalog
        </p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>Variables</h1>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
          Manage the images used in your products.
        </p>
      </div>

      <div className="mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search variables..."
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="mb-8">
        <CreateVariable
          onCreated={(next) => {
            setVariables((current) => [next, ...current])
            toast('Variable created.', 'success')
          }}
          onError={(message) => toast(message, 'error')}
        />
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Image className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-800">Images</h2>
          <span className="text-sm text-slate-500">({filteredImages.length})</span>
        </div>

        {filteredImages.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 py-12 text-center">
            <Image className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm text-slate-600">No images found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredImages.map((v) => (
<div
  key={v.id}
  className="group relative aspect-square flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md"
>
  <button
    onClick={() => deleteVariable(v.id)}
    className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-red-600 opacity-0 transition group-hover:opacity-100 hover:bg-red-50"
    aria-label="Delete"
  >
    <Trash2 className="h-4 w-4" />
  </button>

  <div className="flex flex-col items-center gap-3 text-center w-full">
    <div className="h-16 w-16 overflow-visible rounded-none bg-transparent sm:h-20 sm:w-20">
      <img
        src={v.image || '/aboutimg.webp'}
        alt={v.name}
        className="h-full w-full object-contain"
      />
    </div>
    <p className="w-full truncate text-sm font-medium text-slate-800 px-2">
      {v.name}
    </p>
  </div>
</div>
            ))}
          </div>
        )}
      </section>
      {ToastContainer}
    </div>
  )
}
