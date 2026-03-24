'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import Button from '@/components/admin/button'
import VariantValueSelector from '@/components/admin/variant-value-selector'
import { saveParentVariantAttributes } from '@/app/(admin)/admin/products/actions'

type KV = { key: string; value: string }
type VariantVariable = {
  id: string
  type: 'color' | 'image'
  name: string
  color?: string
  image?: string
}

export default function VariantAttributesEditor({
  parentId,
  initialVariantKey = [],
  variables = [],
  onSave,
}: {
  parentId: string
  initialVariantKey?: KV[]
  variables?: VariantVariable[]
  onSave?: () => void
}) {
  const [rows, setRows] = useState<KV[]>([...initialVariantKey, { key: '', value: '' }])
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  function updateRow(i: number, key: string, value: string | null) {
    const next = [...rows]
    next[i] = { key, value: value ?? '' }

    const last = next[next.length - 1]
    if (last.key || last.value) next.push({ key: '', value: '' })
    setRows(next)
  }

  function removeRow(i: number) {
    const next = rows.filter((_, idx) => idx !== i)
    setRows(next.length ? next : [{ key: '', value: '' }])
  }

  async function save() {
    try {
      setSaving(true)
      await saveParentVariantAttributes(parentId, rows)
      setNotice('Variant attributes saved.')
      onSave?.()
    } catch (error) {
      console.error(error)
      setNotice('Failed to save variant attributes.')
    } finally {
      setSaving(false)
      setTimeout(() => setNotice(null), 3000)
    }
  }

  return (
    <div className="space-y-3 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Variant attributes</h2>
        <button onClick={save} disabled={saving} className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {notice && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-700">
          {notice}
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_40px] items-stretch gap-2">
            <input
              value={r.key}
              onChange={(e) => updateRow(i, e.target.value, r.value)}
              placeholder="Key"
              className="h-full w-full rounded border border-slate-300 px-2 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />

            <div className="h-full">
              <VariantValueSelector
                value={r.value}
                onChange={(v) => updateRow(i, r.key, v)}
                variables={variables}
                allowedType="any"
                className="h-full"
              />
            </div>

            {(r.key || r.value) && (
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="mt-1 self-start rounded p-3 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
