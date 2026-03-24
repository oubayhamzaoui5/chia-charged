import { PackageSearch } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
      <PackageSearch className="mb-3 h-12 w-12 opacity-20" />
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm">{description}</p>
    </div>
  )
}
