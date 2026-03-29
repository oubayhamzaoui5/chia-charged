"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

export default function NavLink({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string
  icon: LucideIcon
  label: string
  badge?: number
}) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-all outline-none ${
        isActive
          ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold"
          : "text-[#4B5563] font-medium hover:bg-[#F9FAFB] hover:text-[#111827]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-[17px] w-[17px] shrink-0" />
        <span>{label}</span>
      </div>

      {badge !== undefined && badge > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1.5 text-[11px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  )
}
