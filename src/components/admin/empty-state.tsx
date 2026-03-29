import { PackageSearch } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-2xl p-4" style={{ background: '#F4F6FB' }}>
        <PackageSearch className="h-10 w-10" style={{ color: '#9CA3AF' }} />
      </div>
      <h3 className="text-base font-semibold" style={{ color: '#374151' }}>{title}</h3>
      <p className="mt-1 text-sm" style={{ color: '#9CA3AF' }}>{description}</p>
    </div>
  )
}
