import { PackageSearch } from "lucide-react"

type ShopEmptyStateProps = {
  title: string
  description: string
}

export default function ShopEmptyState({ title, description }: ShopEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
              <PackageSearch className="mb-3 h-12 w-12 opacity-80" />
        <h2 className="text-xl font-semibold text-black">{title}</h2>
        <p className="text-sm text-black/80">{description}</p>
    </div>
  )
}
