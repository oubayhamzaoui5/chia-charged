'use client'

import { useMemo } from 'react'

type Variable = {
  id: string
  name: string
  type: 'color' | 'image'
  color?: string
  image?: string
}

type Props = {
  value: string
  type?: 'text' | 'color' | 'image' | 'any'
  variables: Variable[]
  onChange: (v: string) => void
}

export default function ProductVariantField({
  value,
  type = 'any',
  variables,
  onChange,
}: Props) {
  // determine actual type
  const parsedType = useMemo(() => {
    if (!type) return 'any'
    if (type.startsWith('isColor')) return 'color'
    if (type.startsWith('isImage')) return 'image'
    if (type === 'text') return 'text'
    return 'any'
  }, [type])

  // options for select
  const options = useMemo(() => {
    if (parsedType === 'color' || parsedType === 'image') {
      return variables.filter(v => v.type === parsedType)
    }
    return [] // everything else uses input
  }, [variables, parsedType])

  // find selected option for preview
  const selected = options.find(v => v.id === value.replace(/is(Color|Image)\((.+)\)/, '$2'))

  return (
    <div className="col-span-2 flex items-center gap-2 w-full">
      {/* TEXT */}
      {options.length === 0 && (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded border border-foreground/10 px-2 py-2 text-xs"
          placeholder="Enter value"
        />
      )}

      {/* SELECT */}
      {options.length > 0 && (
        <select
          value={value.replace(/is(Color|Image)\((.+)\)/, '$2')}
          onChange={e => {
            const val = e.target.value
            if (parsedType === 'color') onChange(`isColor(${val})`)
            else if (parsedType === 'image') onChange(`isImage(${val})`)
            else onChange(val)
          }}
          className="w-full rounded border border-foreground/10 px-2 py-2 text-xs"
        >
          <option value="">Select…</option>
          {options.map(v => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      )}

      {/* Preview */}
      <div className="flex items-center justify-center ">
  {selected?.type === 'color' && (
    <span
      className="w-6 aspect-square rounded-full ml-2"
      style={{ backgroundColor: selected.color }}
    />
  )}
</div>

      {selected?.type === 'image' && selected.image?.trim() && (
        <img
          src={selected.image}
          className="w-6 aspect-square rounded-full object-cover"
          alt=""
        />
      )}
    </div>
  )
}
