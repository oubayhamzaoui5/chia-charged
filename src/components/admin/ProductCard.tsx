"use client"

import Link from "next/link"
import { Pencil, Trash2,Eye, EyeOff  } from "lucide-react"

import Card from "@/components/admin/card"
import ProductVariantField from "./ProductVariantField"

import type { Product } from "@/types/product.types"
import { getVariantValue } from "@/utils/product.utils"

type Category = {
  id: string
  name: string
}

type ParentVariantKey = {
  key: string
  value?: string
}

type Props = {
  product: Product
  imageSrc: string
  categories: Category[]
  parentVariantKeys: ParentVariantKey[]
  variables: any[]

  openEdit: (p: Product) => void
  deleteProduct: (id: string) => void
  updateVariantValue: (id: string, key: string, val: string) => void

  Price: React.ComponentType<{ p: Product }>
}

export default function ProductCard({
  product: p,
  imageSrc,
  categories,
  parentVariantKeys,
  variables,
  openEdit,
  deleteProduct,
  updateVariantValue,
  Price,
}: Props) {
  return (
<Card className="flex flex-col p-4 relative h-full w-full">
        {/* IMAGE */}
      <div className="relative">
        <img
          src={imageSrc}
          alt=""
          className="w-full aspect-square rounded-lg object-cover border border-foreground/10 bg-foreground/5"
        />

        {/* Status badges */}
    <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
      {/* Visibilite boutique */}
      <span
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-white font-bold ${
          p.inView ? "bg-emerald-500" : "bg-red-500"
        }`}
      >
        {p.inView ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        {p.inView ? "Visible" : "Masque"}
      </span>
    </div>

      <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
      {/* Active */}
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] text-white font-bold ${
          p.isActive ? "bg-emerald-600" : "bg-red-700"
        }`}
      >
        {p.isActive ? "Actif" : "Inactif"}
      </span>
    </div>
  </div>


      {/* CONTENT */}
      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="truncate text-base font-semibold">{p.name}</h3>

        {/* Reference + Actions */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-foreground/60">
            Reference: {p.sku}
          </p>

          <div className="flex gap-1">
            <button
              onClick={() => openEdit(p)}
              className="p-1.5 bg-foreground/10 rounded hover:bg-foreground/20"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => deleteProduct(p.id)}
              className="p-1.5 bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

{/* Categories */}
{categories.length > 0 && (
  <div
    className="mt-2 flex gap-1 overflow-x-auto flex-nowrap cursor-grab select-none hide-scrollbar"
    onMouseDown={(e) => {
      const slider = e.currentTarget
      let isDown = true
      let startX = e.pageX - slider.offsetLeft
      let scrollLeft = slider.scrollLeft

      const mouseMove = (ev: MouseEvent) => {
        if (!isDown) return
        ev.preventDefault()
        const x = ev.pageX - slider.offsetLeft
        const walk = (x - startX) * 1 // scroll speed
        slider.scrollLeft = scrollLeft - walk
      }

      const mouseUp = () => {
        isDown = false
        window.removeEventListener("mousemove", mouseMove)
        window.removeEventListener("mouseup", mouseUp)
      }

      window.addEventListener("mousemove", mouseMove)
      window.addEventListener("mouseup", mouseUp)
    }}
  >
    {categories.map((c) => (
      <span
        key={c.id}
        className="flex-shrink-0 rounded-full bg-foreground/5 px-2 py-0.5 text-[11px]"
      >
        {c.name}
      </span>
    ))}
  </div>
)}




        {/* PRICE (reusable) */}
        <div className="mt-auto pt-3">
          <Price p={p} />
        </div>

        {/* VARIANTS */}
        {p.isVariant && parentVariantKeys.length > 0 && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {parentVariantKeys.map((pk) => (
              <div key={pk.key} className="grid grid-cols-3 gap-1 items-center">
                <span className="text-sm font-medium">{pk.key}</span>

                <ProductVariantField
                  value={getVariantValue(p, pk.key)}
                  type={(pk.value as any) ?? "any"}
                  variables={variables}
                  onChange={(val) =>
                    updateVariantValue(p.id, pk.key, val)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VARIANTS PAGE LINK */}
      {p.isParent && (
        <Link
          href={`/admin/products/${p.id}/variants`}
          className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white"
        >
          +
        </Link>
      )}
    </Card>
  )
}
