// components/navbar-with-categories.tsx
import { Navbar } from "@/components/navbar"
import { getShopCategories } from "@/lib/services/product.service"

type Category = {
  id: string
  name: string
  slug: string
  order?: number
  parent?: string | string[] | null
}

export default async function NavbarWithCategories() {
  const catRes = await getShopCategories()

  const categories: Category[] = catRes.map((c: any) => ({
    id: c.id,
    name: c.name ?? "",
    slug: c.slug ?? "",
    order: Number(c.order ?? 0),
    parent: c.parent ?? null,
  }))

  return <Navbar categories={categories} />
}
