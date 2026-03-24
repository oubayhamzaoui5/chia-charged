"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ChevronDown,
  X,
  CheckCircle,
  BadgePercent,
  Sparkles,
  Search,
  Layers3,
  Coins,
  Heart,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

export type CategoryOption = {
  id: string
  name: string
  slug?: string
  parent?: string | string[] | null
  description?: string | null
}

export type ShopFilters = {
  query: string
  categoryIds: string[]
  priceRange: [number, number]
  inStockOnly: boolean
  onSaleOnly?: boolean
  newArrivalOnly?: boolean
  wishlistOnly?: boolean
}

export function FiltersSidebar({
  categories,
  value,
  onChange,
  onClose,
  priceMax = 1000,
  lockedStatus,
  activeCategoryId,
}: {
  categories: CategoryOption[]
  value: ShopFilters
  onChange: (v: ShopFilters) => void
  onClose?: () => void
  priceMax?: number
  lockedStatus?: {
    onSaleOnly?: boolean
    newArrivalOnly?: boolean
    wishlistOnly?: boolean
  }
  activeCategoryId?: string
}) {
  const [local, setLocal] = useState<ShopFilters>(value)
  const [openParents, setOpenParents] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setLocal(value)
  }, [value])

  function patch(p: Partial<ShopFilters>) {
    const next = { ...local, ...p }
    setLocal(next)
    onChange(next)
  }

  const onSaleOnly = local.onSaleOnly ?? false
  const newArrivalOnly = local.newArrivalOnly ?? false
  const wishlistOnly = local.wishlistOnly ?? false

  const hideOnSale = lockedStatus?.onSaleOnly === true
  const hideNewArrival = lockedStatus?.newArrivalOnly === true
  const hideWishlist = lockedStatus?.wishlistOnly === true

  const { parents, childrenByParent, orphans } = useMemo(() => {
    const rootParents: CategoryOption[] = []
    const groupedChildren: Record<string, CategoryOption[]> = {}

    for (const cat of categories) {
      const parentField = cat.parent

      if (!parentField || (Array.isArray(parentField) && parentField.length === 0)) {
        rootParents.push(cat)
        continue
      }

      const parentIds = Array.isArray(parentField) ? parentField : [parentField]
      parentIds.forEach((parentId) => {
        if (!groupedChildren[parentId]) groupedChildren[parentId] = []
        groupedChildren[parentId].push(cat)
      })
    }

    const rootParentIds = new Set(rootParents.map((p) => p.id))
    const parentOfAnyChildIds = new Set(Object.keys(groupedChildren))

    const orphanItems: CategoryOption[] = categories.filter((cat) => {
      if (!cat.parent) return false

      const parentId = Array.isArray(cat.parent) ? cat.parent[0] : cat.parent
      if (rootParentIds.has(parentId)) return false
      if (parentOfAnyChildIds.has(cat.id)) return false

      return true
    })

    return { parents: rootParents, childrenByParent: groupedChildren, orphans: orphanItems }
  }, [categories])

  const hasActiveChildren =
    !!activeCategoryId && (childrenByParent[activeCategoryId]?.length ?? 0) > 0

  const displayParents: CategoryOption[] = hasActiveChildren
    ? childrenByParent[activeCategoryId!]
    : parents

  const displayOrphans: CategoryOption[] = hasActiveChildren ? [] : orphans
  const hideCategoryAccordion = !!activeCategoryId && !hasActiveChildren

  return (
    <div className="w-full md:w-72 md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:overflow-y-auto border-r border-foreground/10 p-4 md:p-0 md:pr-4">
      {onClose && (
        <div className="mb-4 flex items-center justify-between md:hidden">
          <h2 className="text-lg font-semibold">Filtres</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md p-1"
            aria-label="Fermer les filtres"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="filters-search" className="flex items-center gap-2 text-sm font-semibold">
            <Search className="h-4 w-4" />
            <span>Recherche</span>
          </label>
          <Input
            id="filters-search"
            value={local.query}
            onChange={(e) => patch({ query: e.target.value })}
            placeholder="Rechercher des produits..."
            className="rounded-xl"
          />
        </div>

        {!hideCategoryAccordion && (
          <Accordion type="single" collapsible defaultValue="category">
            <AccordionItem value="category">
              <AccordionTrigger className="flex items-center gap-2 text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Layers3 className="h-4 w-4" />
                  <span>Categorie</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {displayParents.map((parent) => {
                    const children = childrenByParent[parent.id] || []

                    const parentSelected = local.categoryIds.includes(parent.id)
                    const childIds = children.map((c) => c.id)
                    const childrenSelectedCount = childIds.filter((id) =>
                      local.categoryIds.includes(id)
                    ).length

                    const allChildrenSelected =
                      children.length > 0 && childrenSelectedCount === children.length

                    const someChildrenSelected =
                      children.length > 0 &&
                      childrenSelectedCount > 0 &&
                      childrenSelectedCount < children.length

                    const checkboxChecked =
                      parentSelected || allChildrenSelected
                        ? true
                        : someChildrenSelected
                        ? "indeterminate"
                        : false

                    const isOpen = openParents[parent.id] ?? true

                    return (
                      <div key={parent.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
                            <Checkbox
                              checked={checkboxChecked}
                              onCheckedChange={(checked) => {
                                const shouldAdd = !!checked
                                const idsToToggle = [parent.id, ...childIds]
                                let next = [...local.categoryIds]

                                if (shouldAdd) {
                                  idsToToggle.forEach((id) => {
                                    if (!next.includes(id)) next.push(id)
                                  })
                                } else {
                                  next = next.filter((id) => !idsToToggle.includes(id))
                                }

                                patch({ categoryIds: next })
                              }}
                            />
                            <span>{parent.name}</span>
                          </label>

                          {children.length > 0 && (
                            <button
                              type="button"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-md p-1"
                              onClick={() =>
                                setOpenParents((prev) => ({
                                  ...prev,
                                  [parent.id]: !isOpen,
                                }))
                              }
                              aria-label={isOpen ? `Replier ${parent.name}` : `Deplier ${parent.name}`}
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 ${
                                  isOpen ? "rotate-180" : "rotate-0"
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        {children.length > 0 && isOpen && (
                          <div className="ml-6 space-y-1">
                            {children.map((cat) => {
                              const checked = local.categoryIds.includes(cat.id)
                              return (
                                <label
                                  key={cat.id}
                                  className="flex cursor-pointer items-center gap-2 text-xs"
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(c) =>
                                      patch({
                                        categoryIds: c
                                          ? [...local.categoryIds, cat.id]
                                          : local.categoryIds.filter((x) => x !== cat.id),
                                      })
                                    }
                                  />
                                  <span>{cat.name}</span>
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {displayOrphans.length > 0 && (
                    <div className="mt-3 border-t border-foreground/10 pt-2">
                      {displayOrphans.map((cat) => {
                        const checked = local.categoryIds.includes(cat.id)
                        return (
                          <label key={cat.id} className="flex cursor-pointer items-center gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) =>
                                patch({
                                  categoryIds: c
                                    ? [...local.categoryIds, cat.id]
                                    : local.categoryIds.filter((x) => x !== cat.id),
                                })
                              }
                            />
                            <span>{cat.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <Accordion type="single" collapsible defaultValue="price">
          <AccordionItem value="price">
            <AccordionTrigger className="flex items-center gap-2 text-sm font-semibold">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                <span>Prix</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <Slider
                  min={0}
                  max={priceMax}
                  step={5}
                  value={local.priceRange}
                  onValueChange={(v) => patch({ priceRange: [v[0], v[1]] as [number, number] })}
                />
                <div className="flex justify-between text-xs text-foreground/70">
                  <span>{local.priceRange[0]} DT</span>
                  <span>{local.priceRange[1]} DT</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="single" collapsible defaultValue="status">
          <AccordionItem value="status">
            <AccordionTrigger className="flex items-center text-sm font-semibold">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Statut des produits</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={local.inStockOnly}
                    onCheckedChange={(c) => patch({ inStockOnly: !!c })}
                  />
                  <CheckCircle className="h-4 w-4" />
                  <span>En stock</span>
                </label>

                {!hideOnSale && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={onSaleOnly}
                      onCheckedChange={(c) => patch({ onSaleOnly: !!c })}
                    />
                    <BadgePercent className="h-4 w-4" />
                    <span>En promotion</span>
                  </label>
                )}

                {!hideNewArrival && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={newArrivalOnly}
                      onCheckedChange={(c) => patch({ newArrivalOnly: !!c })}
                    />
                    <Sparkles className="h-4 w-4" />
                    <span>Nouveautes</span>
                  </label>
                )}

                {!hideWishlist && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={wishlistOnly}
                      onCheckedChange={(c) => patch({ wishlistOnly: !!c })}
                    />
                    <Heart className="h-4 w-4" />
                    <span>Favoris</span>
                  </label>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
