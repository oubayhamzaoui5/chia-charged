'use client'

import { useState } from 'react'
import { Plus, Upload } from 'lucide-react'

import { createVariableAction } from './actions'

type VariableRecord = {
  id: string
  name: string
  type: 'color' | 'image'
  color?: string
  image?: string
}

function buildVariableImageUrl(id: string, image?: string) {
  if (!image || !image.trim()) return undefined
  const base =
    process.env.NEXT_PUBLIC_PB_URL ??
    process.env.POCKETBASE_URL ??
    'http://127.0.0.1:8090'
  return `${base}/api/files/variables/${id}/${image}`
}

export default function CreateVariable({
  onCreated,
  onError,
}: {
  onCreated?: (next: VariableRecord) => void
  onError?: (message: string) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'color' | 'image'>('color')
  const [color, setColor] = useState('#000000')
  const [image, setImage] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const isDisabled = name.trim() === '' || (type === 'image' && !image)

  async function submit() {
    if (isDisabled) return

    setSaving(true)
    try {
      const data = new FormData()
      data.append('name', name)
      data.append('type', type)
      if (type === 'color') data.append('color', color)
      if (type === 'image' && image) data.append('image', image)

      const created = await createVariableAction(data)
      onCreated?.({
        id: created.id,
        name: created.name ?? name,
        type,
        color: type === 'color' ? (created.color ?? color) : undefined,
        image: type === 'image' ? buildVariableImageUrl(created.id, created.image) : undefined,
      })

      setName('')
      setType('color')
      setColor('#000000')
      setImage(null)
    } catch (error) {
      console.error(error)
      onError?.('Failed to create variable')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Variable name *
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Ocean blue..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="min-w-[140px]">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
          <div className="flex h-10 overflow-hidden rounded-lg border border-slate-300">
            {[
              { value: 'color', label: 'Color' },
              { value: 'image', label: 'Image' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setType(item.value as 'color' | 'image')}
                className={`flex-1 px-4 text-sm font-medium transition ${
                  type === item.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {type === 'color' && (
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Color</label>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-12 cursor-pointer rounded border border-slate-300"
              />
              <span className="font-mono text-sm text-slate-600">{color}</span>
            </div>
          </div>
        )}

        {type === 'image' && (
          <div className="min-w-[200px]">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Image *</label>
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 border-dashed px-3 text-sm text-slate-600 transition-all hover:border-blue-400 hover:bg-slate-50">
              <Upload className="h-4 w-4 text-slate-400" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              <span className="truncate">{image ? image.name : 'Choose an image'}</span>
            </label>
          </div>
        )}

        <button
          type="button"
          className={`inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-medium transition-colors ${
            isDisabled || saving
              ? 'cursor-not-allowed bg-slate-300 text-slate-500'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          disabled={isDisabled || saving}
          onClick={submit}
        >
          <Plus className="h-4 w-4" />
          {saving ? 'Saving...' : 'Add'}
        </button>
      </div>
    </div>
  )
}


