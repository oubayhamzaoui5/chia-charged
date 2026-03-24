// lib/categories.ts
export type Category = {
  id: string
  name: string
  slug: string
  order?: number
  parent?: string | string[] | null
  description?: string | null
}

/**
 * Client-side fetch of categories using the public PB REST API.
 * Used by the Navbar (and anything else that needs categories on the client).
 */
export async function fetchCategories(): Promise<Category[]> {
  const PB_URL = process.env.NEXT_PUBLIC_PB_URL
  if (!PB_URL) {
    console.error("NEXT_PUBLIC_PB_URL is not defined")
    return []
  }

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/categories/records?perPage=200&sort=order,name`,
      { cache: "no-store" }
    )

    const data = await res.json()
    const items = Array.isArray(data?.items) ? data.items : []

    const categories: Category[] = items.map((c: any) => ({
      id: c.id,
      name: c.name ?? "",
      slug: c.slug ?? "",
      order: Number(c.order ?? 0),
      parent: c.parent ?? null,
      description: c.desc ?? c.description ?? null,
    }))

    return categories
  } catch (err) {
    console.error("Failed to fetch categories", err)
    return []
  }
}
