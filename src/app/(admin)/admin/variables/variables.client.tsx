'use client'

import { useMemo, useState } from 'react'
import { Image, Palette, Trash2 } from 'lucide-react'

import { deleteVariableAction } from './actions'
import CreateVariable from './create-variable'

type VariableRecord = {
  id: string
  name: string
  type: 'color' | 'image'
  color?: string
  image?: string
}

export default function VariablesClient({
  variables: initialVariables,
}: {
  variables: VariableRecord[]
}) {
  const [variables, setVariables] = useState<VariableRecord[]>(initialVariables)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const { filteredColors, filteredImages } = useMemo(() => {
    const lower = query.toLowerCase()
    const filtered = variables.filter((v) => v.name.toLowerCase().includes(lower))
    return {
      filteredColors: filtered.filter((v) => v.type === 'color'),
      filteredImages: filtered.filter((v) => v.type === 'image'),
    }
  }, [query, variables])

  async function deleteVariable(id: string) {
    if (!confirm('Delete this variable?')) return
    const prev = variables
    setVariables((current) => current.filter((v) => v.id !== id))
    try {
      await deleteVariableAction(id)
      setNotice('Variable deleted.')
    } catch (error) {
      console.error(error)
      setVariables(prev)
      setNotice('Delete failed.')
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-blue-600">Variables</h1>
        <p className="text-lg text-slate-600">
          Manage the colors and images used in your products.
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

      {notice && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">
          {notice}
        </div>
      )}

      <div className="mb-8">
        <CreateVariable
          onCreated={(next) => {
            setVariables((current) => [next, ...current])
            setNotice('Variable created.')
          }}
          onError={(message) => setNotice(message)}
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
              // Inside both filteredImages.map and filteredColors.map:

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
    {/* Image or Color Circle */}
    <div 
      className="w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200"
      style={v.type === 'color' ? { backgroundColor: v.color } : {}}
    >
      {v.type === 'image' && (
        <img
          src={v.image || '/aboutimg.webp'}
          alt={v.name}
          className="h-full w-full object-cover"
        />
      )}
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

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-800">Colors</h2>
          <span className="text-sm text-slate-500">({filteredColors.length})</span>
        </div>

        {filteredColors.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 py-12 text-center">
            <Palette className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm text-slate-600">No colors found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredColors.map((v) => (
              // Inside both filteredImages.map and filteredColors.map:

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
    {/* Image or Color Circle */}
    <div 
      className="w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200"
      style={v.type === 'color' ? { backgroundColor: v.color } : {}}
    >
      {v.type === 'image' && (
        <img
          src={v.image || '/aboutimg.webp'}
          alt={v.name}
          className="h-full w-full object-cover"
        />
      )}
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
    </div>
  )
}
