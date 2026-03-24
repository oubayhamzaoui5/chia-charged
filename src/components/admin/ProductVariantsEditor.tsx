"use client"

type Props = {
  isVariant: boolean
  setIsVariant: (v: boolean) => void
  isParent: boolean
  setIsParent: (v: boolean) => void
  hidden?: boolean
}

export default function ProductVariantsEditor({
  isVariant,
  setIsVariant,
  isParent,
  setIsParent,
  hidden = false,
}: Props) {
  if (hidden) return null

  const enabled = isParent && isVariant

  const handleToggle = () => {
    const next = !enabled
    setIsParent(next)
    setIsVariant(next)
  }

  return (
    <div 
      onClick={handleToggle}
      className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-slate-50/50"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="select-none">
          <p className="text-sm font-semibold text-slate-800">Collection</p>
          <p className="text-xs text-slate-500">
            Enable this option to manage variants under this product.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          // The parent div handles the click, but we keep the button for accessibility
          className={`pointer-events-none relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
