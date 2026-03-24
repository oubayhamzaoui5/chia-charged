import { useState, useEffect } from "react"
import { Sliders } from "lucide-react"
import Button from "@/components/admin/button"

export default function VariantValueSelector({
  value,
  onChange,
  variables,
  allowedType,
  disabled = false,
  className,
}: {
  value: string | null
  onChange: (val: string | null) => void
  variables: {
    id: string
    type: "color" | "image"
    name: string
    color?: string
    image?: string
  }[]
  allowedType: "color" | "image" | "text" | "any"
  disabled?: boolean
  className?: string
})
{
  const [open, setOpen] = useState(false)
const [internalValue, setInternalValue] = useState(value ?? "")

  // Sync internalValue when parent value changes
  useEffect(() => {
     setInternalValue(value ?? "")
  }, [value])

  // Determine if internalValue corresponds to a variable
  const match = internalValue.match(/^is(Color|Image)\((.+)\)$/)
  const variable = match ? variables.find(v => v.id === match[2]) : null

  // Display name and preview
  const displayName = variable ? variable.name : internalValue
  const preview =
    variable && variable.type === "color" ? (
      <span
        className="inline-block w-8 aspect-square flex-shrink-0 rounded-full ring-1 ring-black/10"
        style={{ backgroundColor: variable.color }}
      />
    ) : variable && variable.type === "image" && variable.image?.trim() ? (
      <img
        src={variable.image}
        className="inline-block w-8 aspect-square flex-shrink-0 rounded-full object-cover ring-1 ring-black/10"
        alt={variable.name}
      />
    ) : null
const filteredVariables =
  allowedType === "text"
    ? []                    // text typing: show no dropdown
    : allowedType === "any" // parent: show all variables
    ? variables
    : variables.filter(v => v.type === allowedType)



// Typing allowed only if it's text or 'any' AND not a variable
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (variable) return // ❌ block typing if a variable is selected
  if (allowedType !== "text" && allowedType !== "any") return
  setInternalValue(e.target.value)
  onChange(e.target.value)
}


  return (
    <div className={`relative ${className ?? ''}`}>
      {/* Input container */}
      <div className="flex items-center gap-2 rounded border px-3 py-2 text-sm bg-white min-h-[3rem] w-72">
        {preview && <div className="flex items-center justify-center w-8 aspect-square flex-shrink-0">{preview}</div>}
      <input
  type="text"
  value={displayName} // use raw value for consistent width
  onChange={handleInputChange}
  placeholder="Value"
    disabled={disabled}
  className="flex-1 border-none p-0 text-sm focus:ring-0 focus:outline-none min-w-0"
/>
{allowedType !== "text" && (
  <button className="px-4 py-2 text-white bg-blue-600 rounded-lg  " onClick={() => setOpen(prev => !prev)}>
    <Sliders size={16} />
  </button>
)}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-64 overflow-auto rounded-lg border bg-white p-2 shadow-lg">
          <div className="grid grid-cols-4 gap-2">
            {filteredVariables.map(v => (
              <button
                key={v.id}
                onClick={() => {
                  const val = v.type === "color" ? `isColor(${v.id})` : `isImage(${v.id})`
                  setInternalValue(val)
                  onChange(val)
                  setOpen(false)
                }}
                className="flex flex-col items-center justify-center gap-1 rounded-lg border p-2 hover:bg-gray-50"
              >
                {v.type === "color" && (
                  <span
                    className="w-8 aspect-square rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: v.color }}
                  />
                )}
                {v.type === "image" && (
                  <img
                    src={v.image || "/aboutimg.webp"}
                    className="w-8 aspect-square rounded-full object-cover ring-1 ring-black/10"
                    alt={v.name}
                  />
                )}
                <span className="text-xs text-gray-600">{v.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
