import { useEffect, useState, useCallback } from 'react'
import { getPb } from '@/lib/pb'

export function useProductVariants(parentId: string) {
  const [parent, setParent] = useState<any>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [variables, setVariables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  // ✅ Utility to normalize variantKey
 function normalizeVariantKey(input: any): Record<string, string> {
  if (Array.isArray(input)) {
    // Convert [{key, value}] → { key: value }
    const result: Record<string, string> = {}
    input.forEach(item => {
      if (item.key && item.value !== undefined) result[item.key] = String(item.value)
    })
    return result
  } else if (typeof input === 'object' && input !== null) {
    // Already an object, ensure all values are strings
    const result: Record<string, string> = {}
    Object.entries(input).forEach(([key, value]) => {
      result[key] = String(value)
    })
    return result
  } else {
    return {}
  }
}


  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const pb = getPb()
      const [p, v, cats, vars] = await Promise.all([
        pb.collection('products').getOne(parentId),
        pb.collection('products').getList(1, 100, {
          filter: `parent="${parentId}" && isVariant=true && isParent=false`,
          expand: 'category',
        }),
        pb.collection('categories').getFullList(),
        pb.collection('variables').getFullList(),
      ])

      // ✅ Normalize variantKey to object format
      const normalizedVariantKey = normalizeVariantKey(p.variantKey ?? [])

      setParent({ ...p, variantKey: normalizedVariantKey })

      setVariants(
        v.items.map((r: any) => ({
          ...r,
          categories: Array.isArray(r.expand?.category)
            ? r.expand.category.map((c: any) => c.id)
            : [],
        }))
      )

      setCategories(cats.map((c: any) => ({ id: c.id, name: c.name ?? '' })))
      setVariables(
        vars.map((v: any) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          color: v.color,
          image:
            v.type === 'image' && v.image
              ? `${process.env.NEXT_PUBLIC_PB_URL}/api/files/variables/${v.id}/${v.image}`
              : undefined,
        }))
      )
    } catch (e) {
      console.error(e)
      setNotice('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [parentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ✅ Return the refetch function
  return {
    parent,
    variants,
    categories,
    variables,
    loading,
    notice,
    refetchParentAndVariants: fetchData,
  }
}
